export type KeyName = "xai" | "gemini"

export type ApiKeys = { xai: string; gemini: string }

/** Empty string means none. Null means the pasted value is not a key. */
export function cleanKey(value: unknown): string | null {
  const raw = String(value ?? "").trim()
  if (!raw) return ""
  const key = raw.replace(/\s+/g, "")
  if (key.length < 12 || key.length > 400 || key.startsWith("{") || /private_key/i.test(key)) return null
  if (/[^\x21-\x7e]/.test(key)) return null
  return key
}

export function readKeys(value: unknown): ApiKeys {
  const raw = (value ?? {}) as Partial<ApiKeys>
  return {
    xai: cleanKey(raw.xai) || "",
    gemini: cleanKey(raw.gemini) || "",
  }
}

export function keyHint(value: string) {
  if (value.length < 4) return ""
  return `••••${value.slice(-4)}`
}
