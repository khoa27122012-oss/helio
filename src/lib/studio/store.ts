import { create } from "zustand"
import { persist } from "zustand/middleware"
import { askHelio } from "@/lib/gateway/ask"
import { INSTALLED, skillDigest } from "@/lib/gateway/catalog"
import { needsModel, planReply, type Reply } from "./reply"
import { demoData } from "./seed"
import type { Pane, PaneStatus, StudioData, StrategyId } from "./types"

type Actions = {
  tick: () => void
  submit: (paneId: string, text: string) => void
  focus: (id: string) => void
  setLayout: (layout: 1 | 2 | 3) => void
  addPane: (agentId?: string) => void
  closePane: (id: string) => void
  toggleStar: (slug: string) => void
  addIssue: (input: { repo: string; title: string; body: string }) => void
  closeIssue: (id: string) => void
  commentPull: (id: string, text: string) => void
  mergePull: (id: string) => void
  toggleAgent: (id: string) => void
  setWorktree: (id: string, worktree: string) => void
  toggleMachine: (id: string) => void
  toggleSkill: (id: string) => void
  setStrategy: (strategy: StrategyId) => void
  reset: () => void
}

export type Studio = StudioData & Actions & { inflight: Record<string, string> }

let seq = 0
function nid(prefix: string) {
  seq += 1
  return `${prefix}-${Date.now().toString(36)}-${seq}`
}

function finish(lines: { hidden?: boolean; kind: string }[], hold: PaneStatus): PaneStatus {
  if (lines.some((line) => line.hidden)) return "running"
  if (lines.some((line) => line.kind === "block")) return "blocked"
  return hold
}

function dropKey(map: Record<string, string>, id: string) {
  const next = { ...map }
  delete next[id]
  return next
}

function roomContext(state: StudioData, pane: Pane) {
  const open = state.pulls.filter((pull) => pull.state !== "merged").slice(0, 4)
  const short = state.enabled.includes("diff-only")
  const pr = open.length
    ? `PR: ${open.map((pull) => (short ? pull.title : `${pull.repo} · ${pull.title} (${pull.state})`)).join("; ")}`
    : "Không có PR mở."
  const lines = [`Pane ${pane.title}, nhánh ${pane.branch}.`, pr]
  if (!short) {
    const off = state.machines.filter((machine) => !machine.online).map((machine) => machine.name)
    lines.push(off.length ? `Máy tắt: ${off.join(", ")}` : "Mọi máy đang mở.")
  }
  return lines.join("\n")
}

const KNOWN = new Set(INSTALLED.map((item) => item.id))

function reconcileEnabled(saved: string[] | undefined, fresh: string[], rev: number | undefined) {
  const base = (saved?.length ? saved : fresh).filter((id) => KNOWN.has(id))
  if ((rev ?? 1) >= 2) return base
  const next = [...base]
  for (const id of ["plain", "concrete"]) {
    if (!next.includes(id)) next.push(id)
  }
  return next
}

export const useStudio = create<Studio>()(
  persist(
    (set, get) => ({
      ...demoData(),
      inflight: {},
      tick: () => {
        const state = get()
        let changed = false
        const panes = state.panes.map((pane) => {
          const idx = pane.lines.findIndex((line) => line.hidden)
          if (idx === -1) {
            if (pane.status === "running") {
              changed = true
              return { ...pane, status: pane.hold }
            }
            return pane
          }
          changed = true
          const lines = pane.lines.map((line, i) => (i === idx ? { ...line, hidden: false } : line))
          return { ...pane, lines, status: finish(lines, pane.hold) }
        })
        if (!changed) return
        set({ panes })
      },
      submit: (paneId, text) => {
        const input = text.trim()
        if (!input) return
        const state = get()
        const pane = state.panes.find((item) => item.id === paneId)
        if (!pane) return
        const agent = state.agents.find((item) => item.id === pane.agentId)
        const echo = { id: nid("in"), kind: "in" as const, text: input }
        const ctx = {
          branch: pane.branch,
          cwd: pane.cwd,
          pulls: state.pulls,
          machines: state.machines.map((machine) => ({ name: machine.name, online: machine.online })),
        }

        const apply = (
          reply: Reply,
          burn: number,
          lead: { kind: "sys" | "ok" | "out" | "block"; text: string }[] = [],
          withEcho = true,
          clearFlight = true,
        ) => {
          const now = get()
          const rest = [...lead, ...reply.lines].map((line) => ({ ...line, id: nid("out"), hidden: true }))
          set({
            blocked: now.blocked + (reply.status === "blocked" ? 1 : 0),
            inflight: clearFlight ? dropKey(now.inflight, paneId) : now.inflight,
            activity: [
              { id: nid("act"), text: `${pane.title} · ${input.slice(0, 72)}`, time: "vừa xong" },
              ...now.activity,
            ].slice(0, 8),
            agents: now.agents.map((item) =>
              item.id === pane.agentId ? { ...item, tokens: item.tokens + burn } : item,
            ),
            series: now.series.map((point, index) =>
              index === now.series.length - 1 ? { ...point, tokens: point.tokens + burn } : point,
            ),
            panes: now.panes.map((item) =>
              item.id === paneId
                ? {
                    ...item,
                    plan: reply.plan,
                    hold: reply.status,
                    status: rest.length ? "running" : reply.status,
                    lines: [...item.lines, ...(withEcho ? [echo] : []), ...rest].slice(-80),
                  }
                : item,
            ),
          })
        }

        if (agent?.paused) {
          set({
            panes: state.panes.map((item) =>
              item.id === paneId
                ? {
                    ...item,
                    status: "waiting" as const,
                    hold: "waiting" as const,
                    lines: [
                      ...item.lines,
                      echo,
                      {
                        id: nid("sys"),
                        kind: "sys" as const,
                        text: `${agent.name} đang tạm dừng. Bật lại trong mục Agent.`,
                      },
                    ].slice(-80),
                  }
                : item,
            ),
          })
          return
        }

        const reply = planReply(input, ctx)
        const talk = needsModel(input, ctx) && state.strategy !== "local"
        if (!talk) {
          const burn = pane.kind === "agent" && reply.status !== "blocked" ? 80 + input.length * 2 : 0
          apply(reply, burn, [], true, false)
          return
        }
        if (state.inflight[paneId]) {
          set({
            panes: state.panes.map((item) =>
              item.id === paneId
                ? {
                    ...item,
                    lines: [
                      ...item.lines,
                      echo,
                      { id: nid("sys"), kind: "sys" as const, text: "Câu trước vẫn đang đi qua Grok. Đợi một nhịp." },
                    ].slice(-80),
                  }
                : item,
            ),
          })
          return
        }

        const ticket = nid("ask")
        const via = state.strategy === "shield" ? "Gọi ngắn · Grok" : "Đang hỏi Grok"
        set({
          inflight: { ...state.inflight, [paneId]: ticket },
          panes: state.panes.map((item) =>
            item.id === paneId
              ? {
                  ...item,
                  status: "waiting" as const,
                  plan: ["Hàng rào đã cho qua.", via],
                  lines: [...item.lines, echo, { id: nid("sys"), kind: "sys" as const, text: via }].slice(-80),
                }
              : item,
          ),
        })

        void askHelio({
          data: {
            prompt: input,
            skills: skillDigest(state.enabled, input),
            context: roomContext(state, pane),
            route: state.strategy === "shield" ? "shield" : "bridge",
            tight: state.enabled.some((id) => id === "token-shield" || id === "prefix-cache" || id === "on-demand"),
            plain: state.enabled.includes("plain"),
          },
        })
          .then((result) => {
            if (get().inflight[paneId] !== ticket) return
            if (!get().panes.some((item) => item.id === paneId)) {
              set({ inflight: dropKey(get().inflight, paneId) })
              return
            }
            if (!result.ok) {
              const local = planReply(input, ctx)
              apply(local, 0, [
                { kind: "sys", text: result.error },
                { kind: "sys", text: "Phòng trả lời thay." },
              ], false)
              return
            }
            const answer = result.text
              .split(/\n+/)
              .map((line) => line.trim())
              .filter(Boolean)
              .slice(0, 14)
            const done: Reply = {
              status: "idle",
              plan: [`${result.tokens} token · Grok 4.5`],
              lines: [
                { kind: "ok", text: `${result.tokens} token` },
                ...answer.map((line) => ({ kind: "out" as const, text: line })),
              ],
            }
            const now = get()
            const rest = done.lines.map((line) => ({ ...line, id: nid("out"), hidden: true }))
            set({
              inflight: dropKey(now.inflight, paneId),
              activity: [
                { id: nid("act"), text: `${pane.title} · ${input.slice(0, 72)}`, time: "vừa xong" },
                ...now.activity,
              ].slice(0, 8),
              agents: now.agents.map((item) =>
                item.id === pane.agentId ? { ...item, tokens: item.tokens + result.tokens } : item,
              ),
              series: now.series.map((point, index) =>
                index === now.series.length - 1 ? { ...point, tokens: point.tokens + result.tokens } : point,
              ),
              panes: now.panes.map((item) =>
                item.id === paneId
                  ? {
                      ...item,
                      plan: done.plan,
                      hold: "idle",
                      status: "running",
                      lines: [...item.lines, ...rest].slice(-80),
                    }
                  : item,
              ),
            })
          })
          .catch(() => {
            if (get().inflight[paneId] !== ticket) return
            apply(planReply(input, ctx), 0, [
              { kind: "sys", text: "Không nối được Grok." },
              { kind: "sys", text: "Phòng trả lời thay." },
            ], false)
          })
      },
      focus: (id) => set({ focusId: id }),
      setLayout: (layout) => set({ layout }),
      addPane: (agentId) => {
        const state = get()
        const agent = state.agents.find((item) => item.id === agentId)
        const id = nid("pane")
        const pane: Pane = agent
          ? {
              id,
              kind: "agent",
              agentId: agent.id,
              title: agent.name,
              cwd: "~/helio",
              branch: agent.worktree,
              status: "idle",
              hold: "idle",
              plan: [`${agent.name} trong ${agent.worktree}.`, agent.note],
              lines: [
                {
                  id: nid("sys"),
                  kind: "sys",
                  text: `${agent.name} · ${agent.model} · ${agent.worktree}`,
                },
              ],
            }
          : {
              id,
              kind: "shell",
              title: "Shell",
              cwd: "~/helio",
              branch: "main",
              status: "idle",
              hold: "idle",
              plan: ["Shell ở gốc repo."],
              lines: [{ id: nid("sys"), kind: "sys", text: "shell · ~/helio · main" }],
            }
        const panes = [...state.panes, pane].slice(-6)
        set({
          panes,
          focusId: id,
          layout: state.layout === 1 ? 2 : state.layout,
        })
      },
      closePane: (id) => {
        const state = get()
        if (state.panes.length <= 1) return
        const panes = state.panes.filter((pane) => pane.id !== id)
        set({
          panes,
          focusId: state.focusId === id ? panes[0].id : state.focusId,
        })
      },
      toggleStar: (slug) =>
        set({
          repos: get().repos.map((repo) =>
            repo.slug === slug
              ? { ...repo, starred: !repo.starred, stars: repo.stars + (repo.starred ? -1 : 1) }
              : repo,
          ),
        }),
      addIssue: ({ repo, title, body }) => {
        const clean = title.trim()
        if (!clean) return
        set({
          issues: [
            {
              id: nid("issue"),
              repo,
              title: clean,
              body: body.trim() || "Chưa có mô tả.",
              labels: ["mới"],
              urgent: false,
              time: "vừa xong",
              open: true,
            },
            ...get().issues,
          ],
        })
      },
      closeIssue: (id) =>
        set({
          issues: get().issues.map((issue) => (issue.id === id ? { ...issue, open: false } : issue)),
        }),
      commentPull: (id, text) => {
        const clean = text.trim()
        if (!clean) return
        set({
          pulls: get().pulls.map((pull) =>
            pull.id === id
              ? { ...pull, comments: [...pull.comments, { id: nid("note"), author: "Bạn", text: clean }] }
              : pull,
          ),
        })
      },
      mergePull: (id) => {
        const pull = get().pulls.find((item) => item.id === id)
        if (!pull || pull.state !== "open") return
        if (pull.checks.some((check) => check.state !== "pass")) return
        set({
          pulls: get().pulls.map((item) => (item.id === id ? { ...item, state: "merged" } : item)),
          activity: [
            { id: nid("act"), text: `Đã merge ${pull.repo} · ${pull.title}`, time: "vừa xong" },
            ...get().activity,
          ].slice(0, 8),
        })
      },
      toggleAgent: (id) =>
        set({
          agents: get().agents.map((agent) => (agent.id === id ? { ...agent, paused: !agent.paused } : agent)),
        }),
      setWorktree: (id, worktree) => {
        const name = worktree.trim()
        if (!name) return
        set({
          agents: get().agents.map((agent) => (agent.id === id ? { ...agent, worktree: name } : agent)),
          panes: get().panes.map((pane) => (pane.agentId === id ? { ...pane, branch: name } : pane)),
        })
      },
      toggleMachine: (id) =>
        set({
          machines: get().machines.map((machine) =>
            machine.id === id
              ? { ...machine, online: !machine.online, latency: machine.online ? "—" : "40 ms" }
              : machine,
          ),
        }),
      toggleSkill: (id) => {
        const enabled = get().enabled
        set({ enabled: enabled.includes(id) ? enabled.filter((item) => item !== id) : [...enabled, id] })
      },
      setStrategy: (strategy) => set({ strategy }),
      reset: () => set({ ...demoData(), inflight: {} }),
    }),
    {
      name: "helio-studio-v2",
      skipHydration: true,
      partialize: (state) => ({
        panes: state.panes,
        focusId: state.focusId,
        layout: state.layout,
        repos: state.repos,
        issues: state.issues,
        pulls: state.pulls,
        agents: state.agents,
        machines: state.machines,
        recipes: state.recipes,
        activity: state.activity,
        series: state.series,
        heatmap: state.heatmap,
        blocked: state.blocked,
        enabled: state.enabled,
        strategy: state.strategy,
        catalogRev: state.catalogRev,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<StudioData>
        return {
          ...current,
          ...saved,
          enabled: reconcileEnabled(saved.enabled, current.enabled, saved.catalogRev),
          strategy: saved.strategy ?? current.strategy,
          catalogRev: 2,
          inflight: {},
        }
      },
    },
  ),
)
