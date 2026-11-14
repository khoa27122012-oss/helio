import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useStudio } from "@/lib/studio/store"
import { cn } from "@/lib/cn"

type Item = { id: string; group: string; label: string; hint: string; run: () => void }

export function Palette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const repos = useStudio((s) => s.repos)
  const recipes = useStudio((s) => s.recipes)
  const agents = useStudio((s) => s.agents)
  const reset = useStudio((s) => s.reset)
  const submit = useStudio((s) => s.submit)
  const focusId = useStudio((s) => s.focusId)
  const [query, setQuery] = useState("")
  const [cursor, setCursor] = useState(0)

  const items = useMemo<Item[]>(() => {
    const go = (to: string) => () => {
      void navigate({ to })
      onClose()
    }
    const base: Item[] = [
      { id: "room", group: "Đi tới", label: "Phòng điều khiển", hint: "Pane, agent, shell", run: go("/") },
      { id: "repos", group: "Đi tới", label: "Kho mã", hint: "File, commit, sao", run: go("/repos") },
      { id: "flow", group: "Đi tới", label: "Duyệt", hint: "Việc và pull request", run: go("/flow") },
      { id: "agents", group: "Đi tới", label: "Agent", hint: "Khóa tự nhận, tên, nhiệm vụ", run: go("/agents") },
      { id: "machines", group: "Đi tới", label: "Máy", hint: "SSH và SFTP", run: go("/machines") },
      { id: "recipes", group: "Đi tới", label: "Công thức", hint: "Câu lệnh đã lưu", run: go("/recipes") },
      { id: "insights", group: "Đi tới", label: "Nhịp", hint: "Token và hoạt động", run: go("/insights") },
      { id: "gateway", group: "Đi tới", label: "Skill", hint: "Tìm trên GitHub, Claude, Codex, Gemini", run: go("/gateway") },
      { id: "lenh", group: "Đi tới", label: "File lệnh", hint: "Lập khung, khóa viết code, rà soát", run: go("/lenh") },
      ...repos.map((repo) => ({
        id: `repo-${repo.slug}`,
        group: "Kho",
        label: repo.name,
        hint: repo.description,
        run: go(`/repos/${repo.slug}`),
      })),
      ...recipes.map((recipe) => ({
        id: `recipe-${recipe.id}`,
        group: "Công thức",
        label: recipe.title,
        hint: recipe.safety,
        run: () => {
          submit(focusId, recipe.prompt)
          void navigate({ to: "/" })
          onClose()
        },
      })),
      ...agents.map((agent) => ({
        id: `agent-${agent.id}`,
        group: "Agent",
        label: agent.name,
        hint: agent.paused ? "Đang tạm dừng" : agent.worktree,
        run: go("/agents"),
      })),
      {
        id: "danger",
        group: "Thử",
        label: "Chạy thử lệnh nguy hiểm",
        hint: "rm -rf / sẽ bị chặn",
        run: () => {
          submit(focusId, "rm -rf /")
          void navigate({ to: "/" })
          onClose()
        },
      },
      {
        id: "reset",
        group: "Thử",
        label: "Đặt lại dữ liệu mẫu",
        hint: "Xóa sao, việc và pane bạn đã thêm",
        run: () => {
          reset()
          onClose()
        },
      },
    ]
    const q = query.trim().toLowerCase()
    if (!q) return base
    return base.filter((item) => `${item.label} ${item.hint} ${item.group}`.toLowerCase().includes(q))
  }, [agents, focusId, navigate, onClose, query, recipes, repos, reset, submit])

  useEffect(() => {
    setCursor(0)
  }, [query, open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null
  const active = items[Math.min(cursor, Math.max(items.length - 1, 0))]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/80 px-4 pt-16 md:pt-24" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Bảng lệnh"
        className="w-full max-w-lg overflow-hidden rounded-lg border border-line bg-ink-2"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault()
              setCursor((value) => Math.min(value + 1, items.length - 1))
            } else if (event.key === "ArrowUp") {
              event.preventDefault()
              setCursor((value) => Math.max(value - 1, 0))
            } else if (event.key === "Enter" && active) {
              event.preventDefault()
              active.run()
            }
          }}
          placeholder="Tìm kho, agent, công thức…"
          className="h-12 w-full border-b border-line bg-transparent px-4 text-base text-paper outline-none placeholder:text-mist"
        />
        <ul className="max-h-80 overflow-auto py-1">
          {items.length === 0 ? (
            <li className="px-4 py-6 text-sm text-mist">Không thấy gì khớp.</li>
          ) : (
            items.slice(0, 12).map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  onMouseEnter={() => setCursor(index)}
                  onClick={item.run}
                  className={cn(
                    "flex h-14 w-full items-center justify-between gap-3 px-4 text-left",
                    index === cursor ? "bg-panel" : "",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-paper">{item.label}</span>
                    <span className="block truncate text-xs text-mist">{item.hint}</span>
                  </span>
                  <span className="shrink-0 text-xs text-mist">{item.group}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
