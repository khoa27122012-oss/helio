import { useEffect, useRef, useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/cn"
import type { Line, Pane } from "@/lib/studio/types"
import { useStudio } from "@/lib/studio/store"

const CHIPS = [
  { label: "Trạng thái git", run: "git status" },
  { label: "Rà soát PR", run: "rà soát pull request đang mở" },
  { label: "Lệnh nguy hiểm", run: "rm -rf /" },
]

const TONE: Record<Line["kind"], string> = {
  in: "text-paper",
  out: "text-paper",
  sys: "text-mist",
  ok: "text-lamp",
  block: "text-lamp",
}

function visiblePanes(panes: Pane[], focusId: string, layout: number) {
  const focus = panes.find((pane) => pane.id === focusId) ?? panes[0]
  const rest = panes.filter((pane) => pane.id !== focus?.id)
  return [focus, ...rest].filter((pane): pane is Pane => Boolean(pane)).slice(0, layout)
}

function Term({ pane }: { pane: Pane }) {
  const submit = useStudio((s) => s.submit)
  const focus = useStudio((s) => s.focus)
  const closePane = useStudio((s) => s.closePane)
  const focusId = useStudio((s) => s.focusId)
  const [draft, setDraft] = useState("")
  const scroller = useRef<HTMLDivElement>(null)
  const shown = pane.lines.filter((line) => !line.hidden).length
  const active = pane.id === focusId

  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = el.scrollHeight
  }, [shown])

  return (
    <article
      className={cn(
        "h-80 min-w-0 flex-col overflow-hidden rounded-lg border bg-ink-2 md:h-full md:min-h-96",
        active ? "flex border-lamp" : "hidden border-line md:flex",
      )}
      onClick={() => focus(pane.id)}
    >
      <header className="flex items-center gap-2 border-b border-line px-3">
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            pane.status === "running" && "animate-pulse bg-lamp",
            pane.status === "idle" && "bg-mist",
            pane.status === "waiting" && "bg-lamp-dim",
            pane.status === "blocked" && "bg-lamp",
          )}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1 py-2">
          <div className="truncate text-sm font-medium">{pane.title}</div>
          <div className="truncate font-mono text-xs text-mist">
            {pane.branch} · {pane.status === "blocked" ? "đã chặn" : pane.status === "running" ? "đang nói" : pane.status === "waiting" ? "đang chờ" : "rảnh"}
          </div>
        </div>
        <button
          type="button"
          aria-label={`Đóng ${pane.title}`}
          onClick={(event) => {
            event.stopPropagation()
            closePane(pane.id)
          }}
          className="flex size-11 items-center justify-center rounded-md text-mist hover:bg-panel hover:text-paper"
        >
          <X className="size-4" />
        </button>
      </header>
      <div ref={scroller} className="min-h-0 flex-1 overflow-auto px-3 py-3 font-mono text-sm leading-6" aria-live="polite">
        {pane.lines
          .filter((line) => !line.hidden)
          .map((line) => (
            <div key={line.id} className={cn("whitespace-pre-wrap break-words", TONE[line.kind])}>
              {line.kind === "in" ? "❯ " : ""}
              {line.text}
            </div>
          ))}
      </div>
      <form
        className="flex items-center gap-2 border-t border-line px-3"
        onSubmit={(event) => {
          event.preventDefault()
          submit(pane.id, draft)
          setDraft("")
          focus(pane.id)
        }}
      >
        <span className="font-mono text-sm text-lamp" aria-hidden="true">
          ❯
        </span>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label={`Lệnh cho ${pane.title}`}
          placeholder="Lệnh hoặc một câu tiếng Việt"
          autoComplete="off"
          spellCheck={false}
          className="h-12 min-w-0 flex-1 bg-transparent font-mono text-sm text-paper outline-none placeholder:text-mist"
        />
      </form>
    </article>
  )
}

export function Room() {
  const panes = useStudio((s) => s.panes)
  const focusId = useStudio((s) => s.focusId)
  const layout = useStudio((s) => s.layout)
  const agents = useStudio((s) => s.agents)
  const blocked = useStudio((s) => s.blocked)
  const focus = useStudio((s) => s.focus)
  const setLayout = useStudio((s) => s.setLayout)
  const addPane = useStudio((s) => s.addPane)
  const submit = useStudio((s) => s.submit)
  const [addOpen, setAddOpen] = useState(false)
  const shown = visiblePanes(panes, focusId, layout)
  const current = panes.find((pane) => pane.id === focusId) ?? panes[0]

  return (
    <div className="flex flex-col md:h-full md:overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 px-3 pt-3">
        <p className="mr-auto text-sm text-mist">Ba việc một lúc: agent, shell, và hàng rào trước khi lệnh chạy.</p>
        <div className="flex gap-1" role="group" aria-label="Số pane">
          {([1, 2, 3] as const).map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setLayout(count)}
              className={cn(
                "size-11 rounded-md font-mono text-sm",
                layout === count ? "bg-lamp text-ink" : "bg-panel text-paper",
              )}
              aria-pressed={layout === count}
            >
              {count}
            </button>
          ))}
        </div>
        <div className="relative">
          <Button variant="line" onClick={() => setAddOpen((value) => !value)} className="px-3">
            <Plus className="size-4" aria-hidden="true" />
            Thêm pane
          </Button>
          {addOpen ? (
            <>
              <button type="button" aria-label="Đóng menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setAddOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-md border border-line bg-ink-2 p-1">
                <button
                  type="button"
                  className="flex h-11 w-full items-center rounded-md px-3 text-left text-sm hover:bg-panel"
                  onClick={() => {
                    addPane()
                    setAddOpen(false)
                  }}
                >
                  Shell
                </button>
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    className="flex h-11 w-full items-center justify-between rounded-md px-3 text-left text-sm hover:bg-panel"
                    onClick={() => {
                      addPane(agent.id)
                      setAddOpen(false)
                    }}
                  >
                    <span>{agent.name}</span>
                    <span className="font-mono text-xs text-mist">{agent.paused ? "dừng" : agent.model}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto px-3 pt-3">
        {panes.map((pane) => (
          <button
            key={pane.id}
            type="button"
            onClick={() => focus(pane.id)}
            className={cn(
              "h-11 shrink-0 rounded-md px-3 text-sm",
              pane.id === focusId ? "bg-lamp text-ink" : "bg-panel text-paper",
            )}
          >
            {pane.title}
          </button>
        ))}
        {CHIPS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => submit(focusId, chip.run)}
            className="h-11 shrink-0 rounded-md border border-line px-3 text-sm text-mist hover:border-lamp hover:text-paper"
          >
            {chip.label}
          </button>
        ))}
      </div>
      <div className={cn("flex min-h-0 flex-1 flex-col", layout !== 3 && "xl:flex-row")}>
        <div
          className={cn(
            "grid min-h-0 flex-1 grid-cols-1 gap-3 p-3",
            layout >= 2 && "md:grid-cols-2",
            layout === 3 && "xl:grid-cols-3",
          )}
        >
          {shown.map((pane) => (
            <Term key={pane.id} pane={pane} />
          ))}
        </div>
        {current ? (
          <aside className={cn("border-t border-line p-4", layout !== 3 && "xl:w-80 xl:shrink-0 xl:border-t-0 xl:border-l")}>
            <p className="text-xs tracking-wide text-mist uppercase">Phiên đang chọn</p>
            <h2 className="mt-1 text-lg font-semibold">{current.title}</h2>
            <p className="mt-1 font-mono text-xs text-mist">
              {current.cwd} · {current.branch}
            </p>
            <h3 className="mt-5 text-sm font-medium">Kế hoạch</h3>
            <ol className="mt-2 flex flex-col gap-2">
              {current.plan.map((step) => (
                <li key={step} className="text-sm leading-6 text-paper">
                  {step}
                </li>
              ))}
            </ol>
            <h3 className="mt-5 text-sm font-medium">Hàng rào</h3>
            <ul className="mt-2 flex flex-col gap-2 text-sm leading-6 text-mist">
              <li>Không đụng nhánh main của pane khác.</li>
              <li>{blocked} lệnh nguy hiểm đã bị chặn trong phòng này.</li>
              <li>Đây là mô phỏng. Không có lệnh nào chạy trên máy của bạn.</li>
            </ul>
          </aside>
        ) : null}
      </div>
    </div>
  )
}
