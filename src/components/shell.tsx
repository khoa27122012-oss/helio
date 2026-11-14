import { useEffect, useState, type ReactNode } from "react"
import { Link, useNavigate, useRouterState } from "@tanstack/react-router"
import {
  Activity,
  Bot,
  Download,
  FolderGit2,
  GitPullRequest,
  LayoutGrid,
  Search,
  Server,
  Shield,
  Sparkles,
} from "lucide-react"
import { Mark } from "@/components/mark"
import { Palette } from "@/components/palette"
import { cn } from "@/lib/cn"
import { compact } from "@/lib/studio/format"
import { useStudio } from "@/lib/studio/store"

const NAV = [
  { to: "/", label: "Phòng", icon: LayoutGrid },
  { to: "/gateway", label: "Tải", icon: Download },
  { to: "/repos", label: "Kho", icon: FolderGit2 },
  { to: "/flow", label: "Duyệt", icon: GitPullRequest },
  { to: "/agents", label: "Agent", icon: Bot },
  { to: "/machines", label: "Máy", icon: Server },
  { to: "/recipes", label: "Công thức", icon: Sparkles },
  { to: "/insights", label: "Nhịp", icon: Activity },
]

function NavLink({
  to,
  label,
  icon: Icon,
  path,
  className,
}: {
  to: string
  label: string
  icon: typeof Bot
  path: string
  className?: string
}) {
  const on = to === "/" ? path === "/" : path.startsWith(to)
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center justify-center gap-1 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lamp",
        on ? "bg-panel text-lamp" : "text-mist hover:bg-panel hover:text-paper",
        className,
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
      {label}
    </Link>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname })
  const blocked = useStudio((s) => s.blocked)
  const tokens = useStudio((s) => s.agents.reduce((sum, agent) => sum + agent.tokens, 0))
  const tick = useStudio((s) => s.tick)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    void useStudio.persist.rehydrate()
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => tick(), 70)
    return () => window.clearInterval(timer)
  }, [tick])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen(true)
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        event.preventDefault()
        void navigate({ to: "/recipes" })
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [navigate])

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-ink font-sans text-paper">
      <div className="h-0.5 shrink-0 bg-lamp" />
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-3">
        <Link to="/" className="flex items-center gap-2">
          <Mark />
          <span className="text-base font-semibold tracking-tight">Helio</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hidden h-11 min-w-0 flex-1 items-center gap-3 rounded-md border border-line bg-ink-2 px-3 text-left text-sm text-mist md:flex md:max-w-md"
        >
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">Tìm kho, agent, công thức…</span>
          <kbd className="font-mono text-xs text-paper">⌘K</kbd>
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Mở bảng lệnh"
            className="flex size-11 items-center justify-center rounded-md text-paper hover:bg-panel md:hidden"
          >
            <Search className="size-5" />
          </button>
          <span className="hidden items-center gap-2 rounded-md border border-line px-3 py-2 font-mono text-xs text-mist sm:inline-flex">
            <Shield className="size-3.5 text-lamp" aria-hidden="true" />
            {blocked} đã chặn
          </span>
          <span className="rounded-md bg-lamp-soft px-3 py-2 font-mono text-xs text-lamp">{compact(tokens)} token</span>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <nav className="hidden w-24 shrink-0 flex-col overflow-y-auto border-r border-line md:flex" aria-label="Chính">
          {NAV.map((item) => (
            <NavLink key={item.to} {...item} path={path} className="h-16 w-full" />
          ))}
        </nav>
        <main className="min-h-0 min-w-0 flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto border-t border-line bg-ink-2 md:hidden"
        aria-label="Chính"
      >
        {NAV.map((item) => (
          <NavLink key={item.to} {...item} path={path} className="h-16 w-20 shrink-0" />
        ))}
      </nav>
      <Palette open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
