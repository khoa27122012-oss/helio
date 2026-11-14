import { createServerFn } from "@tanstack/react-start"

export type SkillHit = {
  name: string
  source: string
  url: string
  blurb: string
  meta: string
  kind: "skill" | "plugin"
  skillId?: string
}

function clip(value: unknown, max: number) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max)
}

function skillTitle(text: string, fallback: string) {
  const named = text.match(/^---[\s\S]*?\nname:\s*["']?([^"'\n]+)/)
  return clip(named?.[1] || fallback, 80) || fallback
}

function countLabel(count: number, unit: string) {
  const num = count >= 1000 ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k` : String(count)
  return `${num} ${unit}`
}

function repoOf(input: string) {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    return null
  }
  if (url.protocol !== "https:" || url.hostname !== "github.com") return null
  const parts = url.pathname.split("/").filter(Boolean)
  if (parts.length < 2) return null
  const [owner, repo] = parts
  if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) return null
  return { owner, repo }
}

function fileUrl(input: string) {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    return ""
  }
  if (url.protocol !== "https:") return ""
  if (url.hostname === "raw.githubusercontent.com") return url.toString()
  if (url.hostname !== "github.com") return ""
  const parts = url.pathname.split("/").filter(Boolean)
  if (parts.length >= 5 && parts[2] === "blob") {
    const [owner, repo, , ref, ...rest] = parts
    return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${rest.join("/")}`
  }
  return ""
}

const SKILL_PREFIXES = ["", "skills/", ".agent-skills/", ".agents/skills/", ".claude/skills/", "plugins/", ".claude/plugins/"]

function skillFiles(owner: string, repo: string, skillId: string) {
  const urls: string[] = []
  for (const ref of ["main", "master"]) {
    for (const prefix of SKILL_PREFIXES) {
      urls.push(`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${prefix}${skillId}/SKILL.md`)
    }
  }
  return urls
}

async function pullText(url: string) {
  const res = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(8000),
    headers: { Accept: "text/plain", "User-Agent": "holine" },
  })
  if (res.status !== 200) return null
  const text = (await res.text()).replace(/\u0000/g, "")
  if (text.length < 20 || /^<!doctype html/i.test(text) || /^<html/i.test(text)) return null
  return text.slice(0, 4000)
}

async function firstText(urls: string[]) {
  for (let i = 0; i < urls.length; i += 7) {
    const found = await Promise.all(urls.slice(i, i + 7).map((url) => pullText(url).catch(() => null)))
    const hit = found.find((text) => text)
    if (hit) return hit
  }
  return null
}

async function skillsIndex(q: string): Promise<SkillHit[]> {
  const res = await fetch(`https://www.skills.sh/api/search?q=${encodeURIComponent(q)}`, {
    signal: AbortSignal.timeout(12000),
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 (compatible; Holine/1.0)" },
  })
  if (!res.ok) return []
  const body = (await res.json()) as {
    skills?: { name?: string; source?: string; skillId?: string; installs?: number }[]
  }
  return (body.skills ?? [])
    .filter((item) => item.name && item.source && item.skillId && /^[\w.-]+\/[\w.-]+$/.test(item.source))
    .slice(0, 80)
    .map((item) => {
      const name = clip(item.name, 80)
      const skillId = clip(item.skillId, 80)
      const kind = /plugin/i.test(`${name} ${skillId}`) ? "plugin" : "skill"
      return {
        name,
        source: item.source as string,
        url: `https://github.com/${item.source}`,
        blurb: kind === "plugin" ? "Plugin trong chỉ mục skill." : "Skill trong chỉ mục công khai.",
        meta: countLabel(item.installs ?? 0, "lượt cài"),
        kind,
        skillId,
      } satisfies SkillHit
    })
}

async function githubRepos(q: string): Promise<{ items: SkillHit[]; error: string }> {
  const query = new URLSearchParams({ q, sort: "stars", per_page: "8" })
  const res = await fetch(`https://api.github.com/search/repositories?${query}`, {
    signal: AbortSignal.timeout(12000),
    headers: { Accept: "application/vnd.github+json", "User-Agent": "holine" },
  })
  if (res.status === 403 || res.status === 429) return { items: [], error: "GitHub đang giới hạn lượt tìm." }
  if (!res.ok) return { items: [], error: `GitHub không trả kết quả (${res.status}).` }
  const body = (await res.json()) as {
    items?: { full_name?: string; description?: string | null; html_url?: string; stargazers_count?: number }[]
  }
  const items = (body.items ?? [])
    .filter((item) => item.full_name && item.html_url)
    .map((item) => {
      const name = item.full_name as string
      const blurb = clip(item.description, 180) || "Không có mô tả."
      const kind = /plugin/i.test(`${name} ${blurb}`) ? "plugin" : "skill"
      return {
        name,
        source: "GitHub",
        url: item.html_url as string,
        blurb,
        meta: countLabel(item.stargazers_count ?? 0, "sao"),
        kind,
      } satisfies SkillHit
    })
  return { items, error: "" }
}

export const searchSkills = createServerFn({ method: "POST" })
  .validator((input: { q?: string }) => {
    const q = clip(input?.q, 60).replace(/[^\p{L}\p{N} ._+/-]/gu, "")
    if (q.length < 2) throw new Error("Gõ ít nhất 2 chữ")
    return { q }
  })
  .handler(async ({ data }) => {
    try {
      const [index, repos] = await Promise.all([
        skillsIndex(data.q).catch(() => [] as SkillHit[]),
        githubRepos(data.q).catch(() => ({ items: [] as SkillHit[], error: "Không nối được GitHub." })),
      ])
      const seen = new Set(index.map((item) => item.source.toLowerCase()))
      const items = [...index, ...repos.items.filter((item) => !seen.has(item.name.toLowerCase()))].slice(0, 80)
      if (!items.length && repos.error) return { ok: false as const, error: repos.error, items }
      const error = items.length && repos.error ? repos.error : ""
      return { ok: true as const, error, items }
    } catch {
      return { ok: false as const, error: "Không tìm được skill.", items: [] as SkillHit[] }
    }
  })

export const importGithub = createServerFn({ method: "POST" })
  .validator((input: { url?: string; skillId?: string }) => {
    const url = String(input?.url ?? "").trim().slice(0, 300)
    const skillId = clip(input?.skillId, 80)
    if (skillId && !/^[\w.-]+$/.test(skillId)) throw new Error("Tên skill không hợp lệ")
    if (!fileUrl(url) && !repoOf(url)) throw new Error("Chỉ nhận link github.com hoặc raw.githubusercontent.com")
    return { url, skillId }
  })
  .handler(async ({ data }) => {
    try {
      const direct = fileUrl(data.url)
      const repo = repoOf(data.url)
      const targets = direct ? [direct] : []
      if (!direct && repo && data.skillId) targets.push(...skillFiles(repo.owner, repo.repo, data.skillId))
      if (!direct && repo) {
        for (const path of ["SKILL.md", "skills/SKILL.md", "README.md"]) {
          targets.push(`https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/main/${path}`)
        }
      }
      const text = await firstText(targets)
      if (!text) return { ok: false as const, error: "Không thấy SKILL.md hoặc README." }
      const fallback = data.skillId || targets[0]?.split("/").filter(Boolean).slice(-2, -1)[0] || "skill"
      return { ok: true as const, name: skillTitle(text, fallback), source: data.url, text }
    } catch {
      return { ok: false as const, error: "Không tải được file từ GitHub." }
    }
  })
