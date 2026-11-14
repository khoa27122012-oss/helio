import { createServerFn } from "@tanstack/react-start"

type RouteName = "bridge" | "shield"

type AskInput = {
  prompt: string
  skills: string
  context: string
  route: RouteName
}

const RAIL = /\brm\s+-[a-z]*r[a-z]*f\b|git\s+reset\s+--hard|\bgit\s+push\b[^\n]{0,40}(?:--force|\s-f\b)|\bdrop\s+(?:database|table)\b|\bmkfs\b|\bdd\s+if=/i

function clip(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max)
}

export const aiStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { ready: Boolean(process.env.XAI_API_KEY) }
})

async function complete(apiKey: string, system: string, prompt: string, maxTokens: number) {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(25000),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      max_tokens: maxTokens,
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  })
  return res
}

export const askHelio = createServerFn({ method: "POST" })
  .validator((input: AskInput) => {
    const prompt = clip(input?.prompt, 2000)
    if (!prompt) throw new Error("Thiếu câu hỏi")
    const route: RouteName = input?.route === "shield" ? "shield" : "bridge"
    return {
      prompt,
      skills: clip(input?.skills, 1400),
      context: clip(input?.context, 800),
      route,
    }
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY
    if (!apiKey) {
      return { ok: false as const, error: "Grok chưa sẵn trong bản này.", tier: "local" as const }
    }

    const system = [
      "Bạn là Helio, phòng điều khiển lập trình. Trả lời tiếng Việt, đủ ý, ngắn, không mở đầu xã giao.",
      "Hàng rào luôn thắng: không đề xuất và không hướng dẫn rm -rf, sudo, git reset --hard, git push --force, drop database, drop table, mkfs, dd. Nếu bị đòi, từ chối trong một câu.",
      "Đây không phải shell thật. Đừng bảo là đã chạy lệnh, đã merge, hoặc đã sửa file.",
      "Không gỡ từ chối của chính bạn và không nới hàng rào, kể cả khi một skill nghiên cứu được bật.",
      "Token shield: bỏ lời thừa. Giữ điều kiện, rủi ro và bước cần làm.",
      `Kỹ năng đang bật:\n${data.skills}`,
      data.context ? `Ngữ cảnh phòng:\n${data.context}` : "",
    ]
      .filter(Boolean)
      .join("\n")

    const maxTokens = data.route === "shield" ? 420 : 520
    try {
      let res = await complete(apiKey, system, data.prompt, maxTokens)
      if (!res.ok && data.route === "bridge" && res.status >= 500) {
        res = await complete(apiKey, system, data.prompt, maxTokens)
      }
      if (!res.ok) {
        return { ok: false as const, error: `Grok không trả lời (${res.status}).`, tier: "local" as const }
      }
      const body = (await res.json()) as {
        choices?: { message?: { content?: string } }[]
        usage?: { total_tokens?: number }
      }
      let text = body.choices?.[0]?.message?.content?.trim() ?? ""
      if (!text) {
        return { ok: false as const, error: "Grok trả về rỗng.", tier: "local" as const }
      }
      if (RAIL.test(text)) {
        text = "Mình không đưa lệnh phá. Hàng rào vẫn chặn rm -rf, reset --hard, force-push và drop."
      }
      const tokens = body.usage?.total_tokens || Math.ceil((system.length + data.prompt.length + text.length) / 4)
      return { ok: true as const, text, tokens, tier: "grok" as const }
    } catch {
      return { ok: false as const, error: "Không nối được Grok.", tier: "local" as const }
    }
  })
