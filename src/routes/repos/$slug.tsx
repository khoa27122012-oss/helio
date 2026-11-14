import { useState } from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Star } from "lucide-react"
import { CodeBlock, Markdown } from "@/components/code-view"
import { Button } from "@/components/ui/button"
import { compact } from "@/lib/studio/format"
import { useStudio } from "@/lib/studio/store"
import { cn } from "@/lib/cn"

export const Route = createFileRoute("/repos/$slug")({
  component: RepoPage,
  head: () => ({ meta: [{ title: "Kho · Holine" }] }),
})

function RepoPage() {
  const { slug } = Route.useParams()
  const repo = useStudio((s) => s.repos.find((item) => item.slug === slug))
  const toggleStar = useStudio((s) => s.toggleStar)
  const submit = useStudio((s) => s.submit)
  const focusId = useStudio((s) => s.focusId)
  const navigate = useNavigate()
  const [path, setPath] = useState(repo?.files[0]?.path ?? "")
  const [tab, setTab] = useState<"code" | "tree" | "log">("code")
  const [commit, setCommit] = useState(repo?.commits[0]?.hash ?? "")

  if (!repo) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Không thấy kho này</h1>
        <Link to="/repos" className="mt-4 inline-flex h-11 items-center text-lamp">
          Về kho mã
        </Link>
      </div>
    )
  }

  const file = repo.files.find((item) => item.path === path) ?? repo.files[0]
  const tabs = [
    { id: "tree" as const, label: "Cây" },
    { id: "code" as const, label: "Mã" },
    { id: "log" as const, label: "Lịch sử" },
  ]

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <Link to="/repos" className="text-sm text-mist hover:text-paper">
          Kho
        </Link>
        <h1 className="text-lg font-semibold">{repo.name}</h1>
        <span className="font-mono text-xs text-mist">{repo.branch}</span>
        <button
          type="button"
          onClick={() => toggleStar(repo.slug)}
          className="ml-auto flex h-11 items-center gap-2 rounded-md px-2 text-sm hover:bg-panel"
          aria-pressed={repo.starred}
        >
          <Star className={repo.starred ? "size-4 fill-lamp text-lamp" : "size-4 text-mist"} />
          {compact(repo.stars)}
        </button>
      </div>
      <div className="flex gap-2 p-3 md:hidden">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "h-11 flex-1 rounded-md text-sm",
              tab === item.id ? "bg-lamp text-ink" : "bg-panel text-paper",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className={cn("md:w-56 md:shrink-0 md:border-r md:border-line", tab !== "tree" && "max-md:hidden")}>
          <p className="px-4 pt-4 text-xs tracking-wide text-mist uppercase">Tệp</p>
          <ul className="p-2">
            {repo.files.map((item) => (
              <li key={item.path}>
                <button
                  type="button"
                  onClick={() => {
                    setPath(item.path)
                    setTab("code")
                  }}
                  className={cn(
                    "flex h-11 w-full items-center rounded-md px-2 text-left font-mono text-xs",
                    item.path === file?.path ? "bg-panel text-lamp" : "text-paper hover:bg-panel",
                  )}
                >
                  <span className="truncate">{item.path}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section className={cn("min-w-0 flex-1", tab !== "code" && "max-md:hidden")}>
          {file ? (
            <>
              <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2">
                <p className="min-w-0 flex-1 truncate font-mono text-xs text-mist">{file.path}</p>
                <Button
                  variant="line"
                  className="px-3"
                  onClick={() => {
                    submit(focusId, `đọc ${file.path} và tóm tắt rủi ro`)
                    void navigate({ to: "/" })
                  }}
                >
                  Nhờ agent đọc
                </Button>
              </div>
              {file.lang === "md" ? <Markdown text={file.code} /> : <CodeBlock code={file.code} />}
            </>
          ) : (
            <p className="p-4 text-sm text-mist">Kho này chưa có tệp.</p>
          )}
        </section>
        <aside className={cn("md:w-72 md:shrink-0 md:border-l md:border-line", tab !== "log" && "max-md:hidden")}>
          <p className="px-4 pt-4 text-xs tracking-wide text-mist uppercase">Lịch sử</p>
          <ul className="flex flex-col gap-1 p-2">
            {repo.commits.map((item) => (
              <li key={item.hash}>
                <button
                  type="button"
                  onClick={() => setCommit(item.hash)}
                  className={cn(
                    "w-full rounded-md px-2 py-3 text-left",
                    commit === item.hash ? "bg-panel" : "hover:bg-panel",
                  )}
                >
                  <span className="block text-sm text-paper">{item.title}</span>
                  <span className="mt-1 block font-mono text-xs text-mist">
                    {item.hash} · {item.author} · {item.time}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="px-4 pb-4 text-sm leading-6 text-mist">Diff đầy đủ nằm ở mục Duyệt, cạnh nhận xét.</p>
        </aside>
      </div>
    </div>
  )
}
