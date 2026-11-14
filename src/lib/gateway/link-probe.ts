import { serviceLabel, type ServiceId } from "./services"

export type LinkHit = { ok: true; service: ServiceId; label: string; account: string }
export type LinkMiss = { ok: false; error: string }

const UA = "Mozilla/5.0 (compatible; Holine/1.0)"

function clip(value: unknown) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim()
  if (!text || text.length > 80) return ""
  return text
}

async function readJson(url: string, init: RequestInit): Promise<{ status: number; json: unknown }> {
  const res = await fetch(url, { ...init, redirect: "manual", signal: AbortSignal.timeout(12000) })
  const raw = (await res.text()).slice(0, 4000)
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"))
  const source = lines.length
    ? (lines
        .map((line) => line.slice(5).trim())
        .filter((line) => line && line !== "[DONE]")
        .at(-1) ?? "")
    : raw.trim()
  if (!source || source.startsWith("<")) return { status: res.status, json: null }
  try {
    return { status: res.status, json: JSON.parse(source) }
  } catch {
    return { status: res.status, json: null }
  }
}

function okStatus(status: number) {
  return status >= 200 && status < 300
}

async function probeStitch(key: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    "user-agent": UA,
  }
  if (key.startsWith("ya29.")) headers.authorization = `Bearer ${key}`
  else headers["x-goog-api-key"] = key
  const { status, json } = await readJson("https://stitch.googleapis.com/mcp", {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "list_projects", arguments: { pageSize: 5 } },
    }),
  })
  const result = (
    json as {
      result?: {
        isError?: boolean
        content?: { text?: string }[]
        structuredContent?: { projects?: { title?: string; displayName?: string; name?: string }[] }
      }
    } | null
  )?.result
  if (!okStatus(status) || !result || result.isError) return ""
  const structured = result.structuredContent?.projects
  if (Array.isArray(structured)) {
    const title = clip(structured[0]?.title || structured[0]?.displayName || structured[0]?.name)
    return title || (structured.length ? `${structured.length} project` : "không có project")
  }
  const text = (result.content ?? []).map((item) => item.text ?? "").join("\n")
  if (/api key|unauthor|invalid|not supported|permission denied|authentication/i.test(text)) return ""
  try {
    const body = JSON.parse(text) as { projects?: { title?: string; displayName?: string; name?: string }[] }
    const projects = Array.isArray(body.projects) ? body.projects : null
    if (!projects) return ""
    const title = clip(projects[0]?.title || projects[0]?.displayName || projects[0]?.name)
    return title || (projects.length ? `${projects.length} project` : "không có project")
  } catch {
    return ""
  }
}

async function probeFigma(key: string) {
  const { status, json } = await readJson("https://api.figma.com/v1/me", {
    headers: { "x-figma-token": key, accept: "application/json", "user-agent": UA },
  })
  const body = json as { handle?: string; email?: string } | null
  if (!okStatus(status)) return ""
  return clip(body?.handle || body?.email)
}

async function probeGithub(key: string) {
  const { status, json } = await readJson("https://api.github.com/user", {
    headers: {
      authorization: `Bearer ${key}`,
      accept: "application/vnd.github+json",
      "user-agent": UA,
    },
  })
  if (!okStatus(status)) return ""
  return clip((json as { login?: string } | null)?.login)
}

async function probeNotion(key: string) {
  const { status, json } = await readJson("https://api.notion.com/v1/users/me", {
    headers: {
      authorization: `Bearer ${key}`,
      "notion-version": "2022-06-28",
      accept: "application/json",
      "user-agent": UA,
    },
  })
  const body = json as { name?: string; type?: string } | null
  if (!okStatus(status) || body?.type === "error") return ""
  return clip(body?.name) || (body?.type ? "bot" : "")
}

async function probeLinear(key: string) {
  const { status, json } = await readJson("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      authorization: key,
      "content-type": "application/json",
      accept: "application/json",
      "user-agent": UA,
    },
    body: JSON.stringify({ query: "{ viewer { name email } }" }),
  })
  const body = json as { data?: { viewer?: { name?: string; email?: string } }; errors?: unknown[] } | null
  if (!okStatus(status) || body?.errors?.length || !body?.data?.viewer) return ""
  return clip(body.data.viewer.name || body.data.viewer.email)
}

async function probeSlack(key: string) {
  const { status, json } = await readJson("https://slack.com/api/auth.test", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, accept: "application/json", "user-agent": UA },
  })
  const body = json as { ok?: boolean; team?: string; user?: string } | null
  if (!okStatus(status) || body?.ok !== true) return ""
  return clip([body.team, body.user].filter(Boolean).join(" · "))
}

async function probeVercel(key: string) {
  const { status, json } = await readJson("https://api.vercel.com/v2/user", {
    headers: { authorization: `Bearer ${key}`, accept: "application/json", "user-agent": UA },
  })
  const user = (json as { user?: { username?: string; email?: string }; error?: { invalidToken?: boolean } } | null)
  if (!okStatus(status) || user?.error?.invalidToken) return ""
  return clip(user?.user?.username || user?.user?.email)
}

const PROBES: Record<ServiceId, (key: string) => Promise<string>> = {
  stitch: probeStitch,
  figma: probeFigma,
  github: probeGithub,
  notion: probeNotion,
  linear: probeLinear,
  slack: probeSlack,
  vercel: probeVercel,
}

export async function probeService(service: ServiceId, apiKey: string): Promise<LinkHit | LinkMiss> {
  const label = serviceLabel(service)
  try {
    const account = await PROBES[service](apiKey)
    if (!account) return { ok: false, error: `${label} từ chối khóa này.` }
    return { ok: true, service, label, account }
  } catch {
    return { ok: false, error: `Không nối được ${label}.` }
  }
}
