import { createServerFn } from "@tanstack/react-start"

export type SkillHit = {
  name: string
  source: string
  url: string
  blurb: string
  stars: number
}

function clip(value: unknown, max: number) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max)
}

function skillTitle(text: string, fallback: string) {
  const named = text.match(/^---[\s\S]*?\nname:\s*["']?([^"'\n]+)/)
  return clip(named?.[1] || fallback, 80) || fallback
}

function rawCandidates(input: string) {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    return []
  }
  if (url.protocol !== "https:") return []
  if (url.hostname === "raw.githubusercontent.com") return [url.toString()]
  if (url.hostname !== "github.com") return []
  const parts = url.pathname.split("/").filter(Boolean)
  if (parts.length >= 5 && parts[2] === "blob") {
    const [owner, repo, , ref, ...rest] = parts
    return [`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${rest.join("/")}`]
  }
  if (parts.length >= 2) {
    const [owner, repo] = parts
    return ["SKILL.md", "skills/SKILL.md", "README.md"].map(
      (path) => `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`,
    )
  }
  return []
}

async function pullText(url: string) {
  const res = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(12000),
    headers: { Accept: "text/plain", "User-Agent": "holine" },
  })
  if (res.status !== 200) return null
  const text = (await res.text()).replace(/\u0000/g, "")
  if (text.length < 20 || /^<!doctype html/i.test(text) || /^<html/i.test(text)) return null
  return text.slice(0, 4000)
}

export const searchSkills = createServerFn({ method: "POST" })
  .validator((input: { q?: string }) => {
    const q = clip(input?.q, 60).replace(/[^\p{L}\p{N} ._+/-]/gu, "")
    if (q.length < 2) throw new Error("Gõ ít nhất 2 chữ")
    return { q }
  })
  .handler(async ({ data }) => {
    const query = new URLSearchParams({
      q: `${data.q} skill`,
      sort: "stars",
      per_page: "6",
    })
    try {
      const res = await fetch(`https://api.github.com/search/repositories?${query}`, {
        signal: AbortSignal.timeout(12000),
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "holine",
        },
      })
      if (res.status === 403 || res.status === 429) {
        return { ok: false as const, error: "GitHub đang giới hạn lượt tìm. Dán link kho bên dưới.", items: [] as SkillHit[] }
      }
      if (!res.ok) {
        return { ok: false as const, error: `GitHub không trả kết quả (${res.status}).`, items: [] as SkillHit[] }
      }
      const body = (await res.json()) as {
        items?: { full_name?: string; description?: string | null; html_url?: string; stargazers_count?: number }[]
      }
      const items = (body.items ?? [])
        .filter((item) => item.full_name && item.html_url)
        .map((item) => ({
          name: item.full_name as string,
          source: "GitHub",
          url: item.html_url as string,
          blurb: clip(item.description, 180) || "Không có mô tả.",
          stars: item.stargazers_count ?? 0,
        }))
      return { ok: true as const, error: "", items }
    } catch {
      return { ok: false as const, error: "Không nối được GitHub.", items: [] as SkillHit[] }
    }
  })

export const importGithub = createServerFn({ method: "POST" })
  .validator((input: { url?: string }) => {
    const url = String(input?.url ?? "").trim().slice(0, 300)
    if (!rawCandidates(url).length) throw new Error("Chỉ nhận link github.com hoặc raw.githubusercontent.com")
    return { url }
  })
  .handler(async ({ data }) => {
    try {
      for (const target of rawCandidates(data.url)) {
        const text = await pullText(target)
        if (!text) continue
        const fallback = target.split("/").filter(Boolean).slice(-2, -1)[0] || "skill"
        return { ok: true as const, name: skillTitle(text, fallback), source: data.url, text }
      }
      return { ok: false as const, error: "Không thấy SKILL.md hoặc README trên nhánh main." }
    } catch {
      return { ok: false as const, error: "Không tải được file từ GitHub." }
    }
  })
