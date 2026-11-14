import { useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { DiffView } from "@/components/code-view"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/cn"
import { useStudio } from "@/lib/studio/store"
import type { Issue, Pull } from "@/lib/studio/types"

export const Route = createFileRoute("/flow")({
  component: FlowPage,
  head: () => ({ meta: [{ title: "Duyệt · Helio" }] }),
})

type Filter = "all" | "open" | "review" | "fail" | "merged"
type Row = { key: string; kind: "issue"; issue: Issue } | { key: string; kind: "pull"; pull: Pull }

const FILTERS: { id: Filter; label: string }[] = [
  { id: "open", label: "Đang mở" },
  { id: "review", label: "Chờ duyệt" },
  { id: "fail", label: "CI lỗi" },
  { id: "merged", label: "Đã merge" },
  { id: "all", label: "Tất cả" },
]

function rowsFor(filter: Filter, issues: Issue[], pulls: Pull[]): Row[] {
  const issueRows: Row[] = issues
    .filter((issue) => (filter === "all" ? true : filter === "open" ? issue.open : false))
    .map((issue) => ({ key: `issue:${issue.id}`, kind: "issue", issue }))
  const pullRows: Row[] = pulls
    .filter((pull) => {
      if (filter === "merged") return pull.state === "merged"
      if (filter === "fail") return pull.checks.some((check) => check.state === "fail")
      if (filter === "review") return pull.state === "open" && pull.checks.every((check) => check.state === "pass")
      if (filter === "open") return pull.state === "open" || pull.state === "draft"
      return true
    })
    .map((pull) => ({ key: `pull:${pull.id}`, kind: "pull", pull }))
  return [...pullRows, ...issueRows]
}

function FlowPage() {
  const issues = useStudio((s) => s.issues)
  const pulls = useStudio((s) => s.pulls)
  const repos = useStudio((s) => s.repos)
  const addIssue = useStudio((s) => s.addIssue)
  const closeIssue = useStudio((s) => s.closeIssue)
  const commentPull = useStudio((s) => s.commentPull)
  const mergePull = useStudio((s) => s.mergePull)
  const [filter, setFilter] = useState<Filter>("open")
  const [picked, setPicked] = useState("pull:p1")
  const [writing, setWriting] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [repo, setRepo] = useState("helio")
  const [note, setNote] = useState("")
  const rows = useMemo(() => rowsFor(filter, issues, pulls), [filter, issues, pulls])
  const current = rows.find((row) => row.key === picked) ?? rows[0]
  const openCount = issues.filter((issue) => issue.open).length + pulls.filter((pull) => pull.state === "open").length

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Duyệt</h1>
          <p className="mt-1 text-sm text-mist">{openCount} mục đang mở. Diff nằm cạnh nhận xét, không phải một trang khác.</p>
        </div>
        <Button variant="line" onClick={() => setWriting((value) => !value)}>
          {writing ? "Đóng" : "Việc mới"}
        </Button>
      </div>
      {writing ? (
        <form
          className="grid gap-3 rounded-lg border border-line bg-ink-2 p-4"
          onSubmit={(event) => {
            event.preventDefault()
            addIssue({ repo, title, body })
            setTitle("")
            setBody("")
            setWriting(false)
            setFilter("open")
          }}
        >
          <label className="flex flex-col gap-2 text-sm">
            Kho
            <select
              value={repo}
              onChange={(event) => setRepo(event.target.value)}
              className="h-11 rounded-md border border-line bg-ink px-3 text-paper"
            >
              {repos.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Tiêu đề
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="h-11 rounded-md border border-line bg-ink px-3 text-paper outline-none focus-visible:border-lamp"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Mô tả
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="min-h-24 rounded-md border border-line bg-ink px-3 py-3 text-paper outline-none focus-visible:border-lamp"
            />
          </label>
          <Button type="submit" className="w-fit">
            Tạo việc
          </Button>
        </form>
      ) : null}
      <div className="flex gap-2 overflow-x-auto">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "h-11 shrink-0 rounded-md px-3 text-sm",
              filter === item.id ? "bg-lamp text-ink" : "bg-panel text-paper",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-mist">Không có mục nào trong bộ lọc này.</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
          <ul className="flex flex-col gap-2">
            {rows.map((row) => {
              const titleText = row.kind === "issue" ? row.issue.title : row.pull.title
              const meta =
                row.kind === "issue"
                  ? `${row.issue.repo} · việc · ${row.issue.time}`
                  : `${row.pull.repo} · ${row.pull.state === "draft" ? "nháp" : row.pull.state === "merged" ? "đã merge" : "PR"} · ${row.pull.time}`
              return (
                <li key={row.key}>
                  <button
                    type="button"
                    onClick={() => setPicked(row.key)}
                    className={cn(
                      "w-full rounded-lg border px-3 py-3 text-left",
                      current?.key === row.key ? "border-lamp bg-ink-2" : "border-line bg-ink hover:border-lamp",
                    )}
                  >
                    <span className="block text-sm font-medium text-paper">{titleText}</span>
                    <span className="mt-1 block font-mono text-xs text-mist">{meta}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="rounded-lg border border-line bg-ink-2">
            {current?.kind === "issue" ? (
              <div className="flex flex-col gap-4 p-4">
                <div>
                  <p className="font-mono text-xs text-mist">{current.issue.repo}</p>
                  <h2 className="mt-1 text-xl font-semibold">{current.issue.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {current.issue.labels.map((label) => (
                      <span key={label} className="rounded-md border border-line px-2 py-1 text-xs text-mist">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm leading-6 text-paper">{current.issue.body}</p>
                {current.issue.open ? (
                  <Button variant="line" className="w-fit" onClick={() => closeIssue(current.issue.id)}>
                    Đóng việc
                  </Button>
                ) : (
                  <p className="text-sm text-mist">Việc này đã đóng.</p>
                )}
              </div>
            ) : current?.kind === "pull" ? (
              <div className="flex flex-col">
                <div className="flex flex-col gap-3 border-b border-line p-4">
                  <p className="font-mono text-xs text-mist">
                    {current.pull.repo} · {current.pull.branch} · {current.pull.author}
                  </p>
                  <h2 className="text-xl font-semibold">{current.pull.title}</h2>
                  <p className="text-sm leading-6 text-paper">{current.pull.body}</p>
                  <ul className="flex flex-wrap gap-2">
                    {current.pull.checks.map((check) => (
                      <li key={check.name} className="rounded-md bg-panel px-2 py-1 font-mono text-xs text-paper">
                        {check.name} · {check.state === "pass" ? "đạt" : check.state === "fail" ? "lỗi" : "chờ"}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="w-fit"
                      disabled={current.pull.state !== "open" || current.pull.checks.some((check) => check.state !== "pass")}
                      onClick={() => mergePull(current.pull.id)}
                    >
                      {current.pull.state === "merged"
                        ? "Đã merge"
                        : current.pull.state === "draft"
                          ? "Còn là bản nháp"
                          : "Merge"}
                    </Button>
                  </div>
                </div>
                <DiffView patch={current.pull.patch} />
                <div className="flex flex-col gap-3 border-t border-line p-4">
                  {current.pull.comments.length === 0 ? (
                    <p className="text-sm text-mist">Chưa có nhận xét.</p>
                  ) : (
                    current.pull.comments.map((comment) => (
                      <p key={comment.id} className="text-sm leading-6">
                        <span className="text-lamp">{comment.author}</span> <span className="text-paper">{comment.text}</span>
                      </p>
                    ))
                  )}
                  <form
                    className="flex flex-col gap-2 sm:flex-row"
                    onSubmit={(event) => {
                      event.preventDefault()
                      commentPull(current.pull.id, note)
                      setNote("")
                    }}
                  >
                    <input
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Nhận xét"
                      className="h-11 min-w-0 flex-1 rounded-md border border-line bg-ink px-3 text-sm text-paper outline-none focus-visible:border-lamp"
                    />
                    <Button type="submit" variant="line">
                      Gửi
                    </Button>
                  </form>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
