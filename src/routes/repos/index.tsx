import { useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Star } from "lucide-react"
import { compact } from "@/lib/studio/format"
import { useStudio } from "@/lib/studio/store"

export const Route = createFileRoute("/repos/")({
  component: ReposPage,
  head: () => ({ meta: [{ title: "Kho · Holine" }] }),
})

function ReposPage() {
  const repos = useStudio((s) => s.repos)
  const issues = useStudio((s) => s.issues)
  const toggleStar = useStudio((s) => s.toggleStar)
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()
  const shown = repos.filter((repo) => `${repo.name} ${repo.description} ${repo.language}`.toLowerCase().includes(q))

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kho mã</h1>
          <p className="mt-1 max-w-xl text-sm leading-6 text-mist">
            Năm repo của studio. Sao, đọc file, rồi nhờ agent tóm tắt mà không rời phòng.
          </p>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Lọc theo tên hoặc ngôn ngữ"
          className="h-11 w-full rounded-md border border-line bg-ink-2 px-3 text-sm text-paper outline-none placeholder:text-mist focus-visible:border-lamp sm:max-w-xs"
        />
      </div>
      {shown.length === 0 ? (
        <p className="text-sm text-mist">Không có kho khớp.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {shown.map((repo) => {
            const open = issues.filter((issue) => issue.repo === repo.slug && issue.open).length
            return (
              <li key={repo.slug}>
                <article className="flex h-full flex-col rounded-lg border border-line bg-ink-2 p-4 transition-colors duration-200 hover:border-lamp">
                  <div className="flex items-start justify-between gap-3">
                    <Link to="/repos/$slug" params={{ slug: repo.slug }} className="min-w-0">
                      <h2 className="truncate text-lg font-semibold">{repo.name}</h2>
                      <p className="mt-1 font-mono text-xs text-mist">{repo.language}</p>
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleStar(repo.slug)}
                      className="flex h-11 items-center gap-2 rounded-md px-2 text-sm text-paper hover:bg-panel"
                      aria-pressed={repo.starred}
                    >
                      <Star className={repo.starred ? "size-4 fill-lamp text-lamp" : "size-4 text-mist"} />
                      {compact(repo.stars)}
                    </button>
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-6 text-paper">{repo.description}</p>
                  <p className="mt-4 font-mono text-xs text-mist">
                    {repo.branch} · {repo.updated}
                    {open ? ` · ${open} việc mở` : ""}
                  </p>
                </article>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
