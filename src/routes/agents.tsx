import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { compact } from "@/lib/studio/format"
import { useStudio } from "@/lib/studio/store"

export const Route = createFileRoute("/agents")({
  component: AgentsPage,
  head: () => ({ meta: [{ title: "Agent · Helio" }] }),
})

function AgentsPage() {
  const agents = useStudio((s) => s.agents)
  const toggleAgent = useStudio((s) => s.toggleAgent)
  const setWorktree = useStudio((s) => s.setWorktree)
  const max = Math.max(...agents.map((agent) => agent.tokens), 1)
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agent</h1>
        <p className="mt-1 text-sm leading-6 text-mist">
          Mỗi người một worktree. Tạm dừng thì pane của họ từ chối lệnh, không giả vờ đang chạy.
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {agents.map((agent) => (
          <li key={agent.id} className="rounded-lg border border-line bg-ink-2 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{agent.name}</h2>
                <p className="mt-1 font-mono text-xs text-mist">
                  {agent.cli} · {agent.model}
                </p>
              </div>
              <Button variant={agent.paused ? "solid" : "line"} onClick={() => toggleAgent(agent.id)}>
                {agent.paused ? "Bật lại" : "Tạm dừng"}
              </Button>
            </div>
            <p className="mt-3 text-sm leading-6 text-paper">{agent.note}</p>
            <div className="mt-4">
              <div className="flex items-center justify-between font-mono text-xs text-mist">
                <span>Token hôm nay</span>
                <span>{compact(agent.tokens)}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-panel">
                <div className="h-2 rounded-full bg-lamp" style={{ width: `${Math.max(8, (agent.tokens / max) * 100)}%` }} />
              </div>
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
