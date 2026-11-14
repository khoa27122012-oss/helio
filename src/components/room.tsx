import { useEffect, useRef, useState } from "react"
import { Link, useRouter } from "@tanstack/react-router"
import { ArrowLeft, Maximize2, Plus, SquareTerminal, X } from "lucide-react"
import { SignedOut } from "@/lib/auth/gates"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/cn"
import { strategyName } from "@/lib/gateway/catalog"
import { serviceLabel } from "@/lib/gateway/services"
import { vendorLabel } from "@/lib/gateway/vendors"
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

function Term({ pane, onOpen }: { pane: Pane; onOpen: () => void }) {
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
        "flex h-80 min-w-0 flex-col overflow-hidden rounded-lg border bg-ink-2 md:min-h-80",
        active ? "border-lamp" : "border-line",
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
          aria-label={`Mở chat ${pane.title}`}
          onClick={(event) => {
            event.stopPropagation()
            onOpen()
          }}
          className="flex size-11 items-center justify-center rounded-md text-mist hover:bg-panel hover:text-paper"
        >
          <Maximize2 className="size-4" />
        </button>
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
          placeholder={`Nhắn ${pane.title}`}
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
  const strategy = useStudio((s) => s.strategy)
  const enabled = useStudio((s) => s.enabled)
  const extraSkills = useStudio((s) => s.extraSkills)
  const links = useStudio((s) => s.links ?? [])
  const setAgentDirective = useStudio((s) => s.setAgentDirective)
  const focus = useStudio((s) => s.focus)
  const setLayout = useStudio((s) => s.setLayout)
  const addPane = useStudio((s) => s.addPane)
  const addAgent = useStudio((s) => s.addAgent)
  const toggleAgent = useStudio((s) => s.toggleAgent)
  const submit = useStudio((s) => s.submit)
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)
  const [zoom, setZoom] = useState(false)
  const [agentName, setAgentName] = useState("")
  const current = panes.find((pane) => pane.id === focusId) ?? panes[0]
  const shown = zoom && current ? [current] : panes
  const focusedAgent = agents.find((agent) => agent.id === current?.agentId)
  const connected = agents.filter((agent) => agent.apiKey)

  function openNamed(agentId: string) {
    const pane = [...panes].reverse().find((item) => item.agentId === agentId)
    setZoom(false)
    if (pane) {
      focus(pane.id)
      return
    }
    addPane(agentId)
  }

  function back() {
    if (zoom) {
      setZoom(false)
      return
    }
    if (router.history.canGoBack()) router.history.back()
  }

  return (
    <div className="flex flex-col">
      <SignedOut>
        <p className="mx-3 mt-3 rounded-md border border-line bg-ink-2 px-3 py-3 text-sm leading-6 text-paper">
          Đăng nhập Google để nhắn các AI trên trình duyệt. Không cần khóa API.{" "}
          <Link to="/login" className="text-lamp">
            Đăng nhập
          </Link>
        </p>
      </SignedOut>
      <div className="flex flex-wrap items-center gap-2 px-3 pt-3">
        <button
          type="button"
          onClick={back}
          className="inline-flex h-11 items-center gap-2 rounded-md border border-line px-3 text-sm text-paper hover:border-lamp"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Quay lại
        </button>
        <button
          type="button"
          onClick={() => {
            setAddOpen(false)
            const form = document.getElementById("them-agent")
            form?.scrollIntoView({ block: "nearest" })
            document.getElementById("ten-agent")?.focus()
          }}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-lamp px-3 text-sm font-medium text-ink"
        >
          <Plus className="size-4" aria-hidden="true" />
          Thêm agent
        </button>
        <button
          type="button"
          onClick={() => addPane()}
          className="inline-flex h-11 items-center gap-2 rounded-md border border-line px-3 text-sm text-paper hover:border-lamp"
        >
          <SquareTerminal className="size-4" aria-hidden="true" />
          Shell
        </button>
        <div className="flex gap-1" role="group" aria-label="Tách pane">
          {([1, 2, 3] as const).map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => {
                setZoom(false)
                setLayout(count)
              }}
              className={cn(
                "size-11 rounded-md font-mono text-sm",
                !zoom && layout === count ? "bg-lamp text-ink" : "bg-panel text-paper",
              )}
              aria-pressed={!zoom && layout === count}
              aria-label={count === 1 ? "Một cột" : count === 2 ? "Hai cột" : "Ba cột"}
            >
              {count}
            </button>
          ))}
        </div>
        {focusedAgent ? (
          <Button variant="line" onClick={() => toggleAgent(focusedAgent.id)}>
            {focusedAgent.paused ? "Bật lại" : "Tạm dừng"}
          </Button>
        ) : null}
        <Link to="/recipes" className="inline-flex h-11 items-center rounded-md border border-line px-3 text-sm text-paper hover:border-lamp">
          Công thức
        </Link>
        <Link to="/gateway" className="inline-flex h-11 items-center rounded-md border border-line px-3 text-sm text-paper hover:border-lamp">
          Tìm skill
        </Link>
        <Link to="/lenh" className="inline-flex h-11 items-center rounded-md border border-line px-3 text-sm text-paper hover:border-lamp">
          File lệnh
        </Link>
        <div className="relative">
          <Button variant="line" onClick={() => setAddOpen((value) => !value)} className="px-3">
            <Plus className="size-4" aria-hidden="true" />
            Pane có sẵn
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
      <form
        id="them-agent"
        className="flex gap-2 px-3 pt-3"
        onSubmit={(event) => {
          event.preventDefault()
          addAgent(agentName)
          setAgentName("")
          setZoom(false)
        }}
      >
        <label className="sr-only" htmlFor="ten-agent">
          Tên agent
        </label>
        <input
          id="ten-agent"
          value={agentName}
          onChange={(event) => setAgentName(event.target.value)}
          placeholder="Tên agent mới"
          className="h-11 min-w-0 flex-1 rounded-md border border-line bg-ink-2 px-3 text-sm text-paper outline-none placeholder:text-mist focus-visible:border-lamp"
        />
        <Button type="submit">Thêm</Button>
      </form>
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
      {connected.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto px-3 pt-3" aria-label="AI đã kết nối">
          <span className="flex h-11 shrink-0 items-center text-xs text-mist">Đã nối</span>
          {connected.map((agent) => {
            const open = current?.agentId === agent.id
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => openNamed(agent.id)}
                className={cn(
                  "h-11 shrink-0 rounded-md px-3 text-sm font-medium",
                  open ? "bg-lamp text-ink" : "bg-panel text-paper",
                )}
              >
                {agent.name}
              </button>
            )
          })}
        </div>
      ) : null}
      <div className={cn("flex min-h-0 flex-1 flex-col", layout !== 3 && "xl:flex-row")}>
        <div
          className={cn(
            "grid min-h-0 flex-1 grid-cols-1 gap-3 p-3",
            layout >= 2 && "md:grid-cols-2",
            layout === 3 && "xl:grid-cols-3",
          )}
        >
          {shown.map((pane) => (
            <Term
              key={pane.id}
              pane={pane}
              onOpen={() => {
                focus(pane.id)
                setZoom(true)
              }}
            />
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
            <h3 className="mt-5 text-sm font-medium">Skill</h3>
            <p className="mt-2 text-sm leading-6 text-paper">
              {strategyName(strategy)} · {enabled.length} plugin bật · {extraSkills.length} skill đưa vào
            </p>
            <Link to="/gateway" className="mt-2 inline-flex h-11 items-center text-sm text-lamp">
              Tìm skill
            </Link>
            <Link to="/lenh" className="inline-flex h-11 items-center text-sm text-lamp">
              {focusedAgent ? `lenh.md · ${focusedAgent.name}` : "lenh.md"}
              {focusedAgent?.directive?.trim() ? " · đang có" : ""}
            </Link>
            {focusedAgent ? (
              <label className="mt-2 flex flex-col gap-2">
                <span className="font-mono text-xs text-mist">lenh.md · {(focusedAgent.directive ?? "").length}/4000</span>
                <textarea
                  value={focusedAgent.directive ?? ""}
                  onChange={(event) => setAgentDirective(focusedAgent.id, event.target.value)}
                  aria-label={`lenh.md của ${focusedAgent.name}`}
                  spellCheck={false}
                  placeholder={`Lệnh riêng cho ${focusedAgent.name}.`}
                  className="min-h-28 w-full rounded-md border border-line bg-ink p-3 font-mono text-sm leading-6 text-paper outline-none placeholder:text-mist focus-visible:border-lamp"
                />
              </label>
            ) : (
              <p className="mt-2 text-sm leading-6 text-mist">Pane shell không có file lệnh.</p>
            )}
            <h3 className="mt-5 text-sm font-medium">AI đã kết nối</h3>
            {connected.length === 0 ? (
              <p className="mt-2 text-sm leading-6 text-paper">
                Chưa có khóa nào được chấp nhận. Ở mục Agent, dán khóa rồi đặt tên. Phòng hiện đúng tên đó.
              </p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {connected.map((agent) => (
                  <li key={agent.id}>
                    <button type="button" onClick={() => openNamed(agent.id)} className="text-left text-sm font-medium text-paper">
                      {agent.name}
                    </button>
                    <p className="font-mono text-xs text-mist">
                      {vendorLabel(agent.provider)}
                      {agent.task ? ` · ${agent.task}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/agents" className="inline-flex h-11 items-center text-sm text-lamp">
              Mục Agent
            </Link>
            <h3 className="mt-5 text-sm font-medium">Dịch vụ đã nối</h3>
            {links.length === 0 ? (
              <p className="mt-2 text-sm leading-6 text-paper">
                Stitch, Figma và các dịch vụ khác ở mục Nối. Chỉ hiện khi chính dịch vụ chấp nhận khóa.
              </p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.id} className="text-sm text-paper">
                    {serviceLabel(link.service)} · {link.account}
                  </li>
                ))}
              </ul>
            )}
            <Link to="/noi" className="inline-flex h-11 items-center text-sm text-lamp">
              Mục Nối
            </Link>
            <h3 className="mt-5 text-sm font-medium">Hàng rào</h3>
            <ul className="mt-2 flex flex-col gap-2 text-sm leading-6 text-mist">
              <li>Không đụng nhánh main của pane khác.</li>
              <li>{blocked} lệnh nguy hiểm đã bị chặn trong phòng này.</li>
            </ul>
          </aside>
        ) : null}
      </div>
    </div>
  )
}
