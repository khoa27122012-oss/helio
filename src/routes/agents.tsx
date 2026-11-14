import { useState } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cleanKey, keyHint } from "@/lib/gateway/key"
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
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [tasks, setTasks] = useState<Record<string, string>>({})
  const [apiKey, setApiKey] = useState("")
  const [name, setName] = useState("")
  const [task, setTaskDraft] = useState("")
  const [provider, setProvider] = useState<"grok" | "gemini">("grok")
  const [show, setShow] = useState(false)
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
        AI trên trình duyệt dùng đăng nhập Google, không cần khóa. Khóa riêng thì nhập ở đây, đặt tên, rồi giao nhiệm vụ.
      </p>
      <form
        className="flex flex-col gap-3 rounded-lg border border-line bg-ink-2 p-4"
        onSubmit={(event) => {
          event.preventDefault()
          const key = cleanKey(apiKey)
          if (key === null) {
            setNote("Dán khóa API, không dán file JSON.")
            return
          }
          if (!key) {
            setNote("Nhập khóa trước.")
            return
          }
          if (!name.trim()) {
            setNote("Đặt tên cho agent.")
            return
          }
          if (task.trim().length < 2) {
            setNote("Viết nhiệm vụ.")
            return
          }
          const ok = addKeyed({ name, apiKey: key, task, provider })
          if (!ok) {
            setNote("Chưa tạo được.")
            return
          }
          setApiKey("")
          setName("")
          setTaskDraft("")
          setNote("Đã thêm. Khung chat nằm trong phòng.")
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
            placeholder={provider === "gemini" ? "Khóa Gemini" : "Khóa xAI"}
            className="h-11 rounded-md border border-line bg-ink px-3 font-mono text-sm text-paper outline-none placeholder:text-mist focus-visible:border-lamp"
          />
        </label>
        <div className="flex gap-2" role="radiogroup" aria-label="Loại khóa">
          {(
            [
              ["grok", "Grok"],
              ["gemini", "Gemini"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={provider === id}
              onClick={() => setProvider(id)}
              className={
                provider === id
                  ? "h-11 rounded-md bg-lamp px-3 text-sm font-medium text-ink"
                  : "h-11 rounded-md border border-line px-3 text-sm text-paper"
              }
            >
              {label}
            </button>
          ))}
          <button type="button" onClick={() => setShow((value) => !value)} className="h-11 rounded-md border border-line px-3 text-sm text-paper">
            {show ? "Ẩn" : "Hiện"}
          </button>
        </div>
        <label className="flex flex-col gap-2 text-sm">
          Tên
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Tên agent"
            className="h-11 rounded-md border border-line bg-ink px-3 text-sm text-paper outline-none placeholder:text-mist focus-visible:border-lamp"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Nhiệm vụ
          <textarea
            value={task}
            onChange={(event) => setTaskDraft(event.target.value)}
            placeholder="Ví dụ: chỉ lập khung, không viết code triển khai."
            rows={3}
            className="rounded-md border border-line bg-ink px-3 py-2 text-sm leading-6 text-paper outline-none placeholder:text-mist focus-visible:border-lamp"
          />
        </label>
        <Button type="submit" className="self-start">
          Tạo agent
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
                  {agent.provider === "browser" ? "Trình duyệt · Google" : agent.model}
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
