import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { useStudio } from "@/lib/studio/store"

export const Route = createFileRoute("/lenh")({
  component: LenhPage,
  head: () => ({ meta: [{ title: "File lệnh · Holine" }] }),
})

function LenhPage() {
  const agents = useStudio((s) => s.agents)
  const setAgentDirective = useStudio((s) => s.setAgentDirective)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6">
      <div>
        <Link to="/" className="inline-flex h-11 items-center gap-2 text-sm text-mist hover:text-paper">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Về phòng
        </Link>
        <h1 className="mt-2 font-mono text-2xl font-semibold tracking-tight">lenh.md</h1>
        <p className="mt-1 max-w-xl text-sm leading-6 text-mist">
          Mỗi agent một file. File chỉ đi kèm câu của agent đó, sau hàng rào. Hàng rào vẫn cấm rm -rf, sudo, reset --hard, force-push và xóa database.
        </p>
      </div>
      {agents.length === 0 ? (
        <p className="text-sm leading-6 text-mist">Chưa có agent. Bấm Bắt đầu ở Phòng, hoặc thêm agent.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {agents.map((agent) => (
            <li key={agent.id} id={`lenh-${agent.id}`} className="rounded-lg border border-line bg-ink-2 p-4">
              <label className="flex flex-col gap-2">
                <span className="text-base font-semibold">{agent.name}</span>
                <span className="font-mono text-xs text-mist">
                  lenh.md · {(agent.directive ?? "").length}/4000 · {agent.worktree}
                </span>
                <textarea
                  value={agent.directive ?? ""}
                  onChange={(event) => setAgentDirective(agent.id, event.target.value)}
                  aria-label={`lenh.md của ${agent.name}`}
                  spellCheck={false}
                  placeholder={`Lệnh riêng cho ${agent.name}.`}
                  className="min-h-40 w-full rounded-lg border border-line bg-ink p-3 font-mono text-sm leading-6 text-paper outline-none placeholder:text-mist focus-visible:border-lamp"
                />
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
