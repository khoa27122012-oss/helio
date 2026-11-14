import { useEffect, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { aiStatus } from "@/lib/gateway/ask"
import { INSTALLED, STRATEGIES, type Installed } from "@/lib/gateway/catalog"
import { importGithub, searchSkills, type SkillHit } from "@/lib/gateway/find"
import { PUBLIC_SKILLS, type PublicSkill } from "@/lib/gateway/library"
import { useStudio } from "@/lib/studio/store"
import type { StrategyId } from "@/lib/studio/types"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/gateway")({
  component: GatewayPage,
  head: () => ({ meta: [{ title: "Skill · Holine" }] }),
})

const TOPICS = [
  { label: "Claude", q: "claude agent skills" },
  { label: "Codex", q: "codex skills" },
  { label: "Gemini", q: "gemini cli skills" },
  { label: "Cursor", q: "cursor agent skills" },
]

function Row({ item }: { item: Installed }) {
  return (
    <li className="rounded-lg border border-line bg-ink-2 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold">{item.name}</h3>
          <p className="mt-1 font-mono text-xs text-mist">{item.source}</p>
        </div>
        <span className="font-mono text-xs text-lamp">Bật</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-paper">{item.blurb}</p>
    </li>
  )
}

function GatewayPage() {
  const strategy = useStudio((s) => s.strategy)
  const setStrategy = useStudio((s) => s.setStrategy)
  const extraSkills = useStudio((s) => s.extraSkills)
  const addExtra = useStudio((s) => s.addExtra)
  const removeExtra = useStudio((s) => s.removeExtra)
  const [ready, setReady] = useState<boolean | null>(null)
  const [query, setQuery] = useState("")
  const [url, setUrl] = useState("")
  const [hits, setHits] = useState<SkillHit[]>([])
  const [searched, setSearched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState("")

  useEffect(() => {
    let live = true
    void aiStatus()
      .then((status) => {
        if (live) setReady(status.ready)
      })
      .catch(() => {
        if (live) setReady(false)
      })
    return () => {
      live = false
    }
  }, [])

  const needle = query.trim().toLowerCase()
  const known = PUBLIC_SKILLS
  const plugins = INSTALLED.filter((item) => item.kind === "plugin")
  const skills = INSTALLED.filter((item) => item.kind === "skill")
  const voice = ready === null ? "Đang kiểm tra Grok." : ready ? "Chỉ Grok 4.5 trả lời." : "Grok chưa có trong bản này."
  const local = needle.length < 2
    ? []
    : [
        ...INSTALLED.filter((item) => `${item.name} ${item.blurb} ${item.source}`.toLowerCase().includes(needle)).map((item) => ({
          key: `local-${item.id}`,
          name: item.name,
          source: item.source,
          blurb: item.blurb,
          meta: "Đang bật",
          kind: item.kind,
          url: "",
          skillId: "",
        })),
        ...PUBLIC_SKILLS.filter((item) => `${item.name} ${item.blurb} ${item.source} ${item.agents}`.toLowerCase().includes(needle)).map(
          (item) => ({
            key: `pub-${item.url}`,
            name: item.name,
            source: item.source,
            blurb: item.blurb,
            meta: item.agents,
            kind: "skill" as const,
            url: item.url,
            skillId: "",
          }),
        ),
      ]

  function take(skill: { name: string; source: string; text: string }) {
    if (skill.text.trim().length < 20) {
      setNote("Nội dung quá ngắn.")
      return
    }
    if (extraSkills.some((item) => item.source === skill.source && skill.source)) {
      setNote("Đã có trong phòng.")
      return
    }
    addExtra(skill)
    setNote(`Đã đưa ${skill.name} vào phòng. Grok đọc phần tóm tắt, không chạy script trong file.`)
  }

  async function find(q: string) {
    const text = q.trim()
    if (text.length < 2) {
      setNote("Gõ ít nhất 2 chữ.")
      return
    }
    setBusy(true)
    setNote("")
    try {
      const result = await searchSkills({ data: { q: text } })
      setHits(result.items)
      setSearched(true)
      if (!result.ok) setNote(result.error)
      else if (result.items.length === 0 && local.length === 0) setNote("Không có skill hay plugin khớp. Dán link GitHub bên dưới.")
    } catch (error) {
      setHits([])
      setSearched(true)
      setNote(error instanceof Error ? error.message : "Không tìm được.")
    } finally {
      setBusy(false)
    }
  }

  async function pull(target: string, skillId = "") {
    const link = target.trim()
    if (!link) return
    setBusy(true)
    setNote("")
    try {
      const result = await importGithub({ data: { url: link, skillId } })
      if (!result.ok) {
        setNote(result.error)
        return
      }
      take({ name: result.name, source: link, text: result.text })
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Không tải được.")
    } finally {
      setBusy(false)
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    if (file.size > 80 * 1024) {
      setNote("File lớn hơn 80 KB.")
      return
    }
    const text = await file.text()
    const name = file.name.replace(/\.(md|markdown|txt)$/i, "") || "skill"
    take({ name, source: `upload:${file.name}`, text })
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Skill</h1>
        <p className="mt-1 max-w-xl text-sm leading-6 text-mist">
          Tìm mọi skill và plugin. Gõ tên, ví dụ heretic, rồi bấm Tìm. {voice} Holine không cài CLI và không chạy script trong file.
        </p>
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            void find(query)
          }}
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm skill hoặc plugin"
            aria-label="Tìm skill hoặc plugin"
            className="h-12 min-w-0 flex-1 rounded-md border border-line bg-ink-2 px-3 text-sm text-paper outline-none placeholder:text-mist focus-visible:border-lamp"
          />
          <Button type="submit" disabled={busy}>
            Tìm
          </Button>
        </form>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {TOPICS.map((topic) => (
            <button
              key={topic.label}
              type="button"
              disabled={busy}
              onClick={() => {
                setQuery(topic.q)
                void find(topic.q)
              }}
              className="h-11 shrink-0 rounded-md border border-line px-3 text-sm text-paper hover:border-lamp disabled:opacity-40"
            >
              {topic.label}
            </button>
          ))}
        </div>
        {note ? <p className="mt-3 text-sm leading-6 text-paper">{note}</p> : null}
      </div>

      {needle.length >= 2 || searched ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Kết quả</h2>
          {local.map((item) => (
            <article key={item.key} className="rounded-lg border border-line bg-ink-2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold">{item.name}</h3>
                  <p className="mt-1 font-mono text-xs text-mist">
                    {item.kind === "plugin" ? "Plugin" : "Skill"} · {item.meta} · {item.source}
                  </p>
                </div>
                {item.url ? (
                  <Button variant="line" className="px-3" disabled={busy} onClick={() => void pull(item.url, item.skillId)}>
                    Đưa vào phòng
                  </Button>
                ) : (
                  <span className="font-mono text-xs text-lamp">Đang bật</span>
                )}
              </div>
              <p className="mt-3 text-sm leading-6 text-paper">{item.blurb}</p>
            </article>
          ))}
          {searched
            ? hits
                .filter(
                  (item) =>
                    !local.some((row) => row.name.toLowerCase() === item.name.toLowerCase() && row.source === item.source),
                )
                .map((item) => (
                <article key={`${item.source}-${item.name}-${item.skillId ?? ""}`} className="rounded-lg border border-line bg-ink-2 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold">{item.name}</h3>
                      <p className="mt-1 font-mono text-xs text-mist">
                        {item.kind === "plugin" ? "Plugin" : "Skill"} · {item.meta} · {item.source}
                      </p>
                    </div>
                    <Button variant="line" className="px-3" disabled={busy} onClick={() => void pull(item.url, item.skillId)}>
                      Đưa vào phòng
                    </Button>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-paper">{item.blurb}</p>
                </article>
              ))
            : null}
          {local.length === 0 && (!searched || hits.length === 0) ? (
            <p className="text-sm text-mist">{busy ? "Đang tìm…" : "Bấm Tìm để lấy chỉ mục skill và plugin."}</p>
          ) : null}
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">File đã kiểm</h2>
        <p className="text-sm leading-6 text-mist">SKILL.md công khai đã kiểm. Bấm để tải đúng file. Danh sách đầy đủ nằm ở kết quả tìm.</p>
        <ul className="flex flex-col gap-3">
          {known.map((item) => (
            <Known key={item.url} item={item} busy={busy} onPull={() => void pull(item.url)} />
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Đưa từ GitHub</h2>
        <p className="text-sm leading-6 text-mist">Link kho hoặc link file. Chỉ nhận github.com và raw.githubusercontent.com. Thử SKILL.md, rồi README.</p>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            void pull(url)
          }}
        >
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://github.com/owner/repo"
            aria-label="Link GitHub"
            className="h-12 min-w-0 flex-1 rounded-md border border-line bg-ink-2 px-3 font-mono text-sm text-paper outline-none placeholder:text-mist focus-visible:border-lamp"
          />
          <Button type="submit" variant="line" disabled={busy || !url.trim()}>
            Lấy file
          </Button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Tải file lên</h2>
        <p className="text-sm leading-6 text-mist">File .md hoặc .txt, tối đa 80 KB. Chữ nằm trên máy bạn, rồi gửi tóm tắt cho Grok.</p>
        <label className="inline-flex h-11 w-fit cursor-pointer items-center rounded-md border border-line px-4 text-sm text-paper hover:border-lamp">
          Chọn file
          <input
            type="file"
            accept=".md,.markdown,.txt,text/markdown,text/plain"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ""
              void onFile(file)
            }}
          />
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Đang dùng trong phòng</h2>
        {extraSkills.length === 0 ? (
          <p className="text-sm text-mist">Chưa đưa skill nào. Các khung chat vẫn là chỗ nhắn.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {extraSkills.map((item) => (
              <li key={item.id} className="rounded-lg border border-line bg-ink-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold">{item.name}</h3>
                    <p className="mt-1 truncate font-mono text-xs text-mist">{item.source}</p>
                  </div>
                  <Button variant="line" className="px-3" onClick={() => removeExtra(item.id)}>
                    Gỡ
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Cách gọi</h2>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Cách gọi">
          {STRATEGIES.map((item) => {
            const on = strategy === item.id
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setStrategy(item.id as StrategyId)}
                className={on ? "rounded-lg border border-lamp bg-ink-2 p-4 text-left" : "rounded-lg border border-line bg-ink-2 p-4 text-left"}
              >
                <span className="text-base font-semibold">{item.name}</span>
                <span className="mt-1 block text-sm leading-6 text-mist">{item.detail}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Plugin luôn bật</h2>
        <ul className="flex flex-col gap-3">
          {plugins.map((item) => (
            <Row key={item.id} item={item} />
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Skill sẵn trong Holine</h2>
        <ul className="flex flex-col gap-3">
          {skills.map((item) => (
            <Row key={item.id} item={item} />
          ))}
        </ul>
      </section>
    </div>
  )
}

function Known({ item, busy, onPull }: { item: PublicSkill; busy: boolean; onPull: () => void }) {
  return (
    <li className="rounded-lg border border-line bg-ink-2 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold">{item.name}</h3>
          <p className="mt-1 font-mono text-xs text-mist">
            {item.agents} · {item.source}
          </p>
        </div>
        <Button variant="line" className="px-3" disabled={busy} onClick={onPull}>
          Đưa vào phòng
        </Button>
      </div>
      <p className="mt-3 text-sm leading-6 text-paper">{item.blurb}</p>
    </li>
  )
}
