export type VendorId =
  | "grok"
  | "gemini"
  | "openai"
  | "anthropic"
  | "openrouter"
  | "groq"
  | "deepseek"
  | "moonshot"
  | "qwen"
  | "mistral"
  | "cohere"
  | "fireworks"
  | "perplexity"
  | "cerebras"
  | "together"

export type VendorKind = "openai" | "gemini" | "anthropic" | "cohere"

export type Vendor = {
  id: VendorId
  label: string
  kind: VendorKind
  probeUrl: string
  probeMethod: "GET" | "POST"
  chatUrl: string
  model: string
  prefer: string[]
}

export const VENDORS: Record<VendorId, Vendor> = {
  grok: {
    id: "grok",
    label: "Grok",
    kind: "openai",
    probeUrl: "https://api.x.ai/v1/models",
    probeMethod: "GET",
    chatUrl: "https://api.x.ai/v1/chat/completions",
    model: "grok-4.5",
    prefer: ["grok-4.5"],
  },
  gemini: {
    id: "gemini",
    label: "Gemini",
    kind: "gemini",
    probeUrl: "https://generativelanguage.googleapis.com/v1beta/models",
    probeMethod: "GET",
    chatUrl: "https://generativelanguage.googleapis.com/v1beta/models",
    model: "gemini-3.8-flash",
    prefer: ["gemini-3.8-flash"],
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    kind: "openai",
    probeUrl: "https://api.openai.com/v1/models",
    probeMethod: "GET",
    chatUrl: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    prefer: ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4o", "gpt-4.1"],
  },
  anthropic: {
    id: "anthropic",
    label: "Claude",
    kind: "anthropic",
    probeUrl: "https://api.anthropic.com/v1/models",
    probeMethod: "GET",
    chatUrl: "https://api.anthropic.com/v1/messages",
    model: "claude-sonnet-4-5",
    prefer: ["claude-sonnet-4-5", "sonnet", "haiku"],
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    kind: "openai",
    probeUrl: "https://openrouter.ai/api/v1/key",
    probeMethod: "GET",
    chatUrl: "https://openrouter.ai/api/v1/chat/completions",
    model: "openrouter/auto",
    prefer: ["openrouter/auto"],
  },
  groq: {
    id: "groq",
    label: "Groq",
    kind: "openai",
    probeUrl: "https://api.groq.com/openai/v1/models",
    probeMethod: "GET",
    chatUrl: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.1-8b-instant",
    prefer: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"],
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    kind: "openai",
    probeUrl: "https://api.deepseek.com/models",
    probeMethod: "GET",
    chatUrl: "https://api.deepseek.com/chat/completions",
    model: "deepseek-chat",
    prefer: ["deepseek-chat"],
  },
  moonshot: {
    id: "moonshot",
    label: "Moonshot",
    kind: "openai",
    probeUrl: "https://api.moonshot.ai/v1/models",
    probeMethod: "GET",
    chatUrl: "https://api.moonshot.ai/v1/chat/completions",
    model: "moonshot-v1-8k",
    prefer: ["moonshot-v1-8k", "moonshot-v1-32k", "kimi-latest"],
  },
  qwen: {
    id: "qwen",
    label: "Qwen",
    kind: "openai",
    probeUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/models",
    probeMethod: "GET",
    chatUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    model: "qwen-turbo",
    prefer: ["qwen-turbo", "qwen-plus", "qwen-flash"],
  },
  mistral: {
    id: "mistral",
    label: "Mistral",
    kind: "openai",
    probeUrl: "https://api.mistral.ai/v1/models",
    probeMethod: "GET",
    chatUrl: "https://api.mistral.ai/v1/chat/completions",
    model: "mistral-small-latest",
    prefer: ["mistral-small-latest"],
  },
  cohere: {
    id: "cohere",
    label: "Cohere",
    kind: "cohere",
    probeUrl: "https://api.cohere.com/v2/models",
    probeMethod: "GET",
    chatUrl: "https://api.cohere.com/v2/chat",
    model: "command-r",
    prefer: ["command-a-03-2025", "command-r-plus", "command-r"],
  },
  fireworks: {
    id: "fireworks",
    label: "Fireworks",
    kind: "openai",
    probeUrl: "https://api.fireworks.ai/inference/v1/models",
    probeMethod: "GET",
    chatUrl: "https://api.fireworks.ai/inference/v1/chat/completions",
    model: "accounts/fireworks/models/llama-v3p1-8b-instruct",
    prefer: ["accounts/fireworks/models/llama-v3p1-8b-instruct"],
  },
  perplexity: {
    id: "perplexity",
    label: "Perplexity",
    kind: "openai",
    probeUrl: "https://api.perplexity.ai/chat/completions",
    probeMethod: "POST",
    chatUrl: "https://api.perplexity.ai/chat/completions",
    model: "sonar",
    prefer: ["sonar"],
  },
  cerebras: {
    id: "cerebras",
    label: "Cerebras",
    kind: "openai",
    probeUrl: "https://api.cerebras.ai/v1/models",
    probeMethod: "GET",
    chatUrl: "https://api.cerebras.ai/v1/chat/completions",
    model: "llama3.1-8b",
    prefer: ["llama3.1-8b", "llama-3.3-70b"],
  },
  together: {
    id: "together",
    label: "Together",
    kind: "openai",
    probeUrl: "https://api.together.xyz/v1/models",
    probeMethod: "GET",
    chatUrl: "https://api.together.xyz/v1/chat/completions",
    model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    prefer: ["meta-llama/Llama-3.3-70B-Instruct-Turbo"],
  },
}

const SKIP = /embed|whisper|tts|audio|image|moderation|dall|realtime|rerank|guard/i

export function isVendor(id: string): id is VendorId {
  return Object.prototype.hasOwnProperty.call(VENDORS, id)
}

export function vendorLabel(id: string) {
  return isVendor(id) ? VENDORS[id].label : ""
}

/** Ordered probes. Unique prefixes hit one host. Shared prefixes continue only after a rejection. */
export function guessVendors(key: string): VendorId[] {
  if (key.startsWith("xai-")) return ["grok"]
  if (key.startsWith("AIza")) return ["gemini"]
  if (key.startsWith("sk-ant-")) return ["anthropic"]
  if (key.startsWith("sk-or-")) return ["openrouter"]
  if (key.startsWith("gsk_")) return ["groq"]
  if (key.startsWith("fw_")) return ["fireworks"]
  if (key.startsWith("pplx-")) return ["perplexity"]
  if (key.startsWith("csk-")) return ["cerebras"]
  if (key.startsWith("sk-proj-") || key.startsWith("sk-svcacct-") || key.startsWith("sk-admin-")) return ["openai"]
  if (/^sk-[a-f0-9]{32}$/i.test(key)) return ["deepseek", "openai", "moonshot", "qwen"]
  if (key.startsWith("sk-")) return ["openai", "deepseek", "moonshot", "qwen"]
  return ["mistral", "cohere", "together"]
}

export function vendorHeaders(vendor: Vendor, apiKey: string, json = false) {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "Mozilla/5.0 (compatible; Holine/1.0)",
  }
  if (json) headers["Content-Type"] = "application/json"
  if (vendor.kind === "gemini") headers["x-goog-api-key"] = apiKey
  else if (vendor.kind === "anthropic") {
    headers["x-api-key"] = apiKey
    headers["anthropic-version"] = "2023-06-01"
  } else headers.Authorization = `Bearer ${apiKey}`
  return headers
}

export function collectIds(body: unknown) {
  const root = body as { data?: { id?: string }[]; models?: { name?: string }[] }
  const ids: string[] = []
  for (const row of root?.data ?? []) if (row?.id) ids.push(String(row.id))
  for (const row of root?.models ?? []) if (row?.name) ids.push(String(row.name).replace(/^models\//, ""))
  return ids
}

export function pickModel(vendor: Vendor, ids: string[]) {
  if (vendor.id === "grok") return "grok-4.5"
  if (vendor.id === "openrouter" || vendor.id === "perplexity") return vendor.model
  const cleaned = ids.map((id) => id.replace(/^models\//, ""))
  for (const want of vendor.prefer) {
    const exact = cleaned.find((id) => id === want)
    if (exact) return exact
  }
  for (const want of vendor.prefer) {
    const hit = cleaned.find((id) => id.includes(want))
    if (hit) return hit
  }
  if (vendor.id === "gemini") {
    const flash = cleaned.find((id) => id.includes("gemini") && id.includes("flash"))
    if (flash) return flash
  }
  const chat = cleaned.find((id) => !SKIP.test(id))
  return chat || vendor.model
}
