import { useState } from "react"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { checkKey } from "@/lib/gateway/ask"
import { cleanKey, keyHint } from "@/lib/gateway/key"
import { vendorLabel } from "@/lib/gateway/vendors"
import { useStudio } from "@/lib/studio/store"

export const Route = createFileRoute("/agents")({
  component: AgentsPage,
  head: () => ({ meta: [{ title: "Agent · Holine" }] }),
})

function AgentsPage() {
  const agents = useStudio((s) => s.agents)
  const started = useStudio((s) => s.started)
  const toggleAgent = useStudio((s) => s.toggleAgent)
  const setWorktree = useStudio((s) => s.setWorktree)
  const addKeyed = useStudio((s) => s.addKeyed)
  const setTask = useStudio((s) => s.setTask)
  const navigate = useNavigate()
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [tasks, setTasks] = useState<Record<string, string>>({})
  const [apiKey, setApiKey] = useState("")
  const [name, setName] = useState("")
  const [task, setTaskDraft] = useState("")
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState("")

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/"
          className="inline-flex h-11 items-center gap-2 rounded-md border border-line px-3 text-sm text-paper hover:border-lamp"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Quay lại
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Agent</h1>
      </div>
      <p className="max-w-xl text-sm leading-6 text-mist">
        AI trên trình duyệt dùng đăng nhập Google, không cần khóa. Dán khóa vào đây: Holine tự nhận nhà cung cấp và chỉ thêm khi khóa đúng. Đặt tên, giao nhiệm vụ. Phòng hiện đúng tên đó.
      </p>
      <form
        className="flex flex-col gap-3 rounded-lg border border-line bg-ink-2 p-4"
        onSubmit={(event) => {
          event.preventDefault()
          if (busy) return
          const key = cleanKey(apiKey)
          if (key === null) {
            setNote("Dán khóa API, không dán file JSON.")
            return
          }
          if (!key) {
            setNote("Nhập khóa trước.")
            return
          }
          const given = name.trim()
          if (!given) {
            setNote("Đặt tên cho AI này.")
            return
          }
          if (task.trim().length < 2) {
            setNote("Viết nhiệm vụ.")
            return
          }
          setBusy(true)
          setNote("Đang kiểm tra khóa…")
          void checkKey({ data: { apiKey: key } })
            .then((found) => {
              if (!found.ok) {
                setNote(found.error)
                return
              }
              const ok = addKeyed({ name: given, apiKey: key, task, provider: found.provider, model: found.model })
              if (!ok) {
                setNote("Chưa tạo được.")
                return
              }
              setApiKey("")
              setName("")
              setTaskDraft("")
              setNote("")
              void navigate({ to: "/" })
            })
            .catch((error: unknown) => {
              const denied = error instanceof Error && error.message === "Unauthorized"
              setNote(denied ? "Đăng nhập Google trước khi kiểm tra khóa." : "Không kiểm tra được khóa.")
            })
            .finally(() => setBusy(false))
        }}
      >
        <label className="flex flex-col gap-2 text-sm">
          Khóa API
          <input
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            type={show ? "text" : "password"}
            autoComplete="off"
            spellCheck={false}
            disabled={busy}
            placeholder="Dán khóa, Holine tự nhận"
            className="h-11 rounded-md border border-line bg-ink px-3 font-mono text-sm text-paper outline-none placeholder:text-mist focus-visible:border-lamp disabled:opacity-60"
          />
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShow((value) => !value)} className="h-11 rounded-md border border-line px-3 text-sm text-paper">
            {show ? "Ẩn" : "Hiện"}
          </button>
        </div>
        <label className="flex flex-col gap-2 text-sm">
          Tên
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={busy}
            placeholder="Tên hiện trong phòng"
            className="h-11 rounded-md border border-line bg-ink px-3 text-sm text-paper outline-none placeholder:text-mist focus-visible:border-lamp disabled:opacity-60"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Nhiệm vụ
          <textarea
            value={task}
            onChange={(event) => setTaskDraft(event.target.value)}
            disabled={busy}
            placeholder="Ví dụ: chỉ lập khung, không viết code triển khai."
            rows={3}
            className="rounded-md border border-line bg-ink px-3 py-2 text-sm leading-6 text-paper outline-none placeholder:text-mist focus-visible:border-lamp disabled:opacity-60"
          />
        </label>
        <Button type="submit" className="self-start" disabled={busy}>
          {busy ? "Đang kiểm tra…" : "Tạo agent"}
        </Button>
        {note ? <p className="text-sm leading-6 text-paper">{note}</p> : null}
      </form>
      {!started ? <p className="text-sm leading-6 text-mist">Bấm Bắt đầu ở Phòng để mở khung chat của các AI trên trình duyệt.</p> : null}
      <ul className="flex flex-col gap-3">
        {agents.map((agent) => (
          <li key={agent.id} className="rounded-lg border border-line bg-ink-2 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{agent.name}</h2>
                <p className="mt-1 font-mono text-xs text-mist">
                  {agent.provider === "browser" ? "Trình duyệt · Google" : `${vendorLabel(agent.provider)} · ${agent.model}`}
                  {agent.apiKey ? ` · ${keyHint(agent.apiKey)}` : ""} · {agent.worktree}
                </p>
              </div>
              <Button variant={agent.paused ? "solid" : "line"} onClick={() => toggleAgent(agent.id)}>
                {agent.paused ? "Bật lại" : "Tạm dừng"}
              </Button>
            </div>
            {agent.task ? <p className="mt-3 text-sm leading-6 text-paper">{agent.task}</p> : null}
            <form
              className="mt-4 flex flex-col gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                setTask(agent.id, tasks[agent.id] ?? agent.task)
              }}
            >
              <label className="flex flex-col gap-2 text-sm">
                Đổi nhiệm vụ
                <input
                  value={tasks[agent.id] ?? agent.task}
                  onChange={(event) => setTasks((prev) => ({ ...prev, [agent.id]: event.target.value }))}
                  placeholder="Nhiệm vụ"
                  className="h-11 rounded-md border border-line bg-ink px-3 text-sm text-paper outline-none focus-visible:border-lamp"
                />
              </label>
              <Button type="submit" variant="line" className="self-start">
                Lưu nhiệm vụ
              </Button>
            </form>
            <form
              className="mt-4 flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault()
                setWorktree(agent.id, drafts[agent.id] ?? agent.worktree)
              }}
            >
              <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
                Worktree
                <input
                  value={drafts[agent.id] ?? agent.worktree}
                  onChange={(event) => setDrafts((prev) => ({ ...prev, [agent.id]: event.target.value }))}
                  className="h-11 rounded-md border border-line bg-ink px-3 font-mono text-sm text-paper outline-none focus-visible:border-lamp"
                />
              </label>
              <Button type="submit" variant="line" className="sm:self-end">
                Gán
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}
