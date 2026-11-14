import { useState } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  const addAgent = useStudio((s) => s.addAgent)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [name, setName] = useState("")

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
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          addAgent(name)
          setName("")
        }}
      >
        <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
          Tên agent
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Tên mới"
            className="h-11 rounded-md border border-line bg-ink px-3 text-sm text-paper outline-none focus-visible:border-lamp"
          />
        </label>
        <Button type="submit" className="sm:self-end">
          Thêm agent
        </Button>
      </form>
      {!started ? <p className="text-sm leading-6 text-mist">Bấm Bắt đầu ở Phòng để mở khung chat.</p> : null}
      <ul className="flex flex-col gap-3">
        {agents.map((agent) => (
          <li key={agent.id} className="rounded-lg border border-line bg-ink-2 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{agent.name}</h2>
                <p className="mt-1 font-mono text-xs text-mist">
                  {agent.cli} · {agent.model} · {agent.worktree}
                </p>
              </div>
              <Button variant={agent.paused ? "solid" : "line"} onClick={() => toggleAgent(agent.id)}>
                {agent.paused ? "Bật lại" : "Tạm dừng"}
              </Button>
            </div>
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
