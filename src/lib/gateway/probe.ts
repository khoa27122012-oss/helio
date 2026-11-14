import { VENDORS, collectIds, guessVendors, pickModel, vendorHeaders, type Vendor, type VendorId } from "./vendors"

export type ProbeHit = { ok: true; provider: VendorId; label: string; model: string }
export type ProbeMiss = { ok: false; error: string }

function redact(message: string, key: string) {
  const text = key ? message.split(key).join("…") : message
  return text.replace(/\s+/g, " ").trim().slice(0, 180)
}

function errorText(body: unknown, key: string) {
  const err = body as { error?: { message?: string } | string; message?: string; detail?: string }
  const message =
    typeof err?.error === "string" ? err.error : err?.error?.message || err?.message || err?.detail || ""
  return redact(String(message), key)
}

function refused(status: number, raw: string) {
  if (status === 401) return true
  if (/error code:\s*1010/i.test(raw)) return false
  if (status === 400 || status === 403) return /api key|unauthor|invalid|incorrect|authentication/i.test(raw)
  return false
}

async function probeOne(vendor: Vendor, apiKey: string): Promise<{ hit?: ProbeHit; error: string; authFail: boolean }> {
  try {
    const res = await fetch(vendor.probeUrl, {
      method: vendor.probeMethod,
      redirect: "manual",
      signal: AbortSignal.timeout(12000),
      headers: vendorHeaders(vendor, apiKey, vendor.probeMethod === "POST"),
      body:
        vendor.probeMethod === "POST"
          ? JSON.stringify({
              model: vendor.model,
              max_tokens: 1,
              temperature: 0,
              messages: [{ role: "user", content: "hi" }],
            })
          : undefined,
    })
    const raw = await res.text()
    if (res.status >= 200 && res.status < 300) {
      let body: unknown = {}
      try {
        body = raw ? JSON.parse(raw) : {}
      } catch {
        body = {}
      }
      return {
        hit: { ok: true, provider: vendor.id, label: vendor.label, model: pickModel(vendor, collectIds(body)) },
        error: "",
        authFail: false,
      }
    }
    let extra = ""
    try {
      extra = errorText(raw ? JSON.parse(raw) : {}, apiKey)
    } catch {
      extra = redact(raw, apiKey)
    }
    const authFail = refused(res.status, `${raw}\n${extra}`)
    const why = authFail ? `${vendor.label} từ chối khóa này.` : `Không kiểm tra được ${vendor.label}.`
    return { error: extra ? `${why} ${extra}` : why, authFail }
  } catch {
    return { error: `Không nối được ${vendor.label}.`, authFail: false }
  }
}

export async function probeKey(apiKey: string): Promise<ProbeHit | ProbeMiss> {
  const order = guessVendors(apiKey)
  let last = "Không nhận ra khóa này."
  for (const id of order) {
    const result = await probeOne(VENDORS[id], apiKey)
    if (result.hit) return result.hit
    last = result.error
    if (!result.authFail) break
  }
  return { ok: false, error: last }
}
