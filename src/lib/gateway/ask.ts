import { createServerFn } from "@tanstack/react-start"
import { authMiddleware } from "@/lib/auth/middleware"
import { cleanKey } from "./key"
import { plainText } from "./plain"
import { probeKey } from "./probe"
import { VENDORS, isVendor, vendorHeaders, type Vendor, type VendorId } from "./vendors"

type RouteName = "bridge" | "shield"

type AskInput = {
  prompt: string
  skills: string
  context: string
  route: RouteName
  tight: boolean
  plain: boolean
  directive: string
  provider: VendorId
  model: string
  apiKey: string
}

const RAIL = /\brm\s+-[a-z]*r[a-z]*f\b|git\s+reset\s+--hard|\bgit\s+push\b[^\n]{0,40}(?:--force|\s-f\b)|\bdrop\s+(?:database|table)\b|\bmkfs\b|\bdd\s+if=/i

function clip(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max)
}

function hideKey(message: string, key: string) {
  const text = key ? message.split(key).join("…") : message
  return text.replace(/\s+/g, " ").trim().slice(0, 180)
}

function errorText(body: unknown, key: string) {
  const err = body as { error?: { message?: string } | string; message?: string }
  const message = typeof err.error === "string" ? err.error : err.error?.message || err.message || ""
  return hideKey(message, key)
}

function takeKey(value: unknown) {
  const key = cleanKey(value)
  if (key === null) throw new Error("Dán khóa API, không dán file JSON.")
  return key
}

function takeModel(value: unknown, fallback: string) {
  const model = String(value ?? "").trim().replace(/^models\//, "")
  if (!model || model.length > 80 || !/^[\w./:-]+$/.test(model)) return fallback
  return model
}

export const aiStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { ready: Boolean(process.env.XAI_API_KEY) }
})

export const checkKey = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { apiKey?: string }) => {
    const apiKey = takeKey(input?.apiKey)
    if (!apiKey) throw new Error("Nhập khóa trước.")
    return { apiKey }
  })
  .handler(async ({ data }) => probeKey(data.apiKey))

function systemText(data: { tight: boolean; directive: string; skills: string; context: string; plain: boolean }) {
  return (
    data.tight
      ? [
          "Holine. Tiếng Việt, đủ ý, không mở đầu xã giao.",
          "Cấm hướng dẫn rm -rf, sudo, reset --hard, push --force, drop database, drop table, mkfs, dd. Nếu bị đòi, từ chối một câu.",
          "Đừng bảo đã chạy lệnh, đã merge, hoặc đã sửa file.",
          "Không gỡ từ chối và không nới hàng rào.",
          data.directive ? `File lệnh của agent này. Làm theo, trừ khi đụng hàng rào:\n${data.directive}` : "",
          data.skills,
          data.context,
          data.plain ? "Không chào, không emoji, không gạch ngang." : "",
        ]
      : [
          "Bạn là Holine, phòng điều khiển lập trình. Trả lời tiếng Việt, đủ ý, ngắn, không mở đầu xã giao.",
          "Hàng rào luôn thắng: không đề xuất và không hướng dẫn rm -rf, sudo, git reset --hard, git push --force, drop database, drop table, mkfs, dd. Nếu bị đòi, từ chối trong một câu.",
          "Đừng bảo là đã chạy lệnh, đã merge, hoặc đã sửa file.",
          "Không gỡ từ chối của chính bạn và không nới hàng rào.",
          data.directive ? `File lệnh của agent này. Làm theo, trừ khi đụng hàng rào:\n${data.directive}` : "",
          "Bỏ lời thừa. Giữ điều kiện, rủi ro và bước cần làm.",
          data.plain ? "Không chào, không emoji, không gạch ngang." : "",
          `Kỹ năng đang bật:\n${data.skills}`,
          data.context ? `Ngữ cảnh phòng:\n${data.context}` : "",
        ]
  )
    .filter(Boolean)
    .join("\n")
}

async function complete(vendor: Vendor, apiKey: string, model: string, system: string, prompt: string, maxTokens: number) {
  if (vendor.kind === "gemini") {
    return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      redirect: "manual",
      signal: AbortSignal.timeout(25000),
      headers: vendorHeaders(vendor, apiKey, true),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
      }),
    })
  }
  if (vendor.kind === "anthropic") {
    return fetch(vendor.chatUrl, {
      method: "POST",
      redirect: "manual",
      signal: AbortSignal.timeout(25000),
      headers: vendorHeaders(vendor, apiKey, true),
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature: 0.3,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    })
  }
  if (vendor.kind === "cohere") {
    return fetch(vendor.chatUrl, {
      method: "POST",
      redirect: "manual",
      signal: AbortSignal.timeout(25000),
      headers: vendorHeaders(vendor, apiKey, true),
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
    })
  }
  return fetch(vendor.chatUrl, {
    method: "POST",
    redirect: "manual",
    signal: AbortSignal.timeout(25000),
    headers: vendorHeaders(vendor, apiKey, true),
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  })
}

function answerText(vendor: Vendor, body: unknown) {
  const data = body as {
    choices?: { message?: { content?: string } }[]
    candidates?: { content?: { parts?: { text?: string }[] } }[]
    content?: { text?: string }[]
    message?: { content?: { text?: string }[] | string }
    text?: string
  }
  if (vendor.kind === "gemini") {
    return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? ""
  }
  if (vendor.kind === "anthropic") {
    return data.content?.map((part) => part.text ?? "").join("").trim() ?? ""
  }
  if (vendor.kind === "cohere") {
    const content = data.message?.content
    if (typeof content === "string") return content.trim()
    return content?.map((part) => part.text ?? "").join("").trim() || data.text?.trim() || ""
  }
  return data.choices?.[0]?.message?.content?.trim() ?? ""
}

function tokenCount(vendor: Vendor, body: unknown, system: string, prompt: string, text: string) {
  const data = body as {
    usage?: { total_tokens?: number; input_tokens?: number; output_tokens?: number }
    usageMetadata?: { totalTokenCount?: number }
    meta?: { billed_units?: { input_tokens?: number; output_tokens?: number } }
  }
  const direct =
    data.usage?.total_tokens ||
    data.usageMetadata?.totalTokenCount ||
    (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0) ||
    (data.meta?.billed_units?.input_tokens || 0) + (data.meta?.billed_units?.output_tokens || 0)
  return direct || Math.ceil((system.length + prompt.length + text.length) / 4)
}

function guard(text: string) {
  if (!text) return ""
  if (RAIL.test(text)) return "Mình không đưa lệnh phá. Hàng rào vẫn chặn rm -rf, reset --hard, force-push và drop."
  return text
}

async function readAnswer(vendor: Vendor, res: Response, key: string, plain: boolean, system: string, prompt: string) {
  if (res.status < 200 || res.status >= 300) {
    let extra = ""
    try {
      extra = errorText(await res.json(), key)
    } catch {
      extra = ""
    }
    const why =
      res.status === 400 || res.status === 401 || res.status === 403
        ? `Khóa ${vendor.label} bị từ chối.`
        : res.status === 429
          ? `${vendor.label} đang giới hạn lượt.`
          : `${vendor.label} không trả lời (${res.status}).`
    return { ok: false as const, error: extra ? `${why} ${extra}` : why, tier: "local" as const }
  }
  const body = await res.json()
  let text = answerText(vendor, body)
  if (plain) {
    const cleaned = plainText(text)
    if (cleaned) text = cleaned
  }
  text = guard(text)
  if (!text) return { ok: false as const, error: `${vendor.label} trả về rỗng.`, tier: "local" as const }
  return { ok: true as const, text, tokens: tokenCount(vendor, body, system, prompt, text), tier: vendor.label }
}

export const askHelio = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: AskInput) => {
    const prompt = clip(input?.prompt, 2000)
    if (!prompt) throw new Error("Thiếu câu hỏi")
    const route: RouteName = input?.route === "shield" ? "shield" : "bridge"
    const provider: VendorId = isVendor(input?.provider) ? input.provider : "grok"
    const vendor = VENDORS[provider]
    return {
      prompt,
      skills: clip(input?.skills, 2200),
      context: clip(input?.context, 800),
      route,
      tight: Boolean(input?.tight),
      plain: Boolean(input?.plain),
      directive: clip(input?.directive, 1200),
      provider,
      model: takeModel(input?.model, vendor.model),
      apiKey: takeKey(input?.apiKey),
    }
  })
  .handler(async ({ data }) => {
    const vendor = VENDORS[data.provider]
    const apiKey = data.provider === "grok" ? data.apiKey || process.env.XAI_API_KEY || "" : data.apiKey
    if (!apiKey) {
      return {
        ok: false as const,
        error: data.provider === "grok" ? "Bản này chưa gắn Grok." : "Agent này cần khóa. Nhập ở mục Agent.",
        tier: "local" as const,
      }
    }
    const system = systemText(data)
    const maxTokens = data.route === "shield" ? 420 : 520
    try {
      let res = await complete(vendor, apiKey, data.model, system, data.prompt, maxTokens)
      if (!res.ok && data.provider === "grok" && data.route === "bridge" && res.status >= 500) {
        res = await complete(vendor, apiKey, data.model, system, data.prompt, maxTokens)
      }
      return readAnswer(vendor, res, apiKey, data.plain, system, data.prompt)
    } catch {
      return { ok: false as const, error: `Không nối được ${vendor.label}.`, tier: "local" as const }
    }
  })
