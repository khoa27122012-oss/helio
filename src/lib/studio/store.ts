import { create } from "zustand"
import { persist } from "zustand/middleware"
import { planReply } from "./reply"
import { demoData } from "./seed"
import type { Pane, PaneStatus, StudioData } from "./types"

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
  reset: () => void
}

export type Studio = StudioData & Actions

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

export const useStudio = create<Studio>()(
  persist(
    (set, get) => ({
      ...demoData(),
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
        if (changed) set({ panes })
      },
      submit: (paneId, text) => {
        const input = text.trim()
        if (!input) return
        const state = get()
        const pane = state.panes.find((item) => item.id === paneId)
        if (!pane) return
        const agent = state.agents.find((item) => item.id === pane.agentId)
        const echo = { id: nid("in"), kind: "in" as const, text: input }
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
        const reply = planReply(input, {
          branch: pane.branch,
          cwd: pane.cwd,
          pulls: state.pulls,
          machines: state.machines.map((machine) => ({ name: machine.name, online: machine.online })),
        })
        const rest = reply.lines.map((line) => ({ ...line, id: nid("out"), hidden: true }))
        const burn = pane.kind === "agent" ? 80 + input.length * 2 : 0
        set({
          blocked: state.blocked + (reply.status === "blocked" ? 1 : 0),
          activity: [
            { id: nid("act"), text: `${pane.title} · ${input.slice(0, 72)}`, time: "vừa xong" },
            ...state.activity,
          ].slice(0, 8),
          agents: state.agents.map((item) =>
            item.id === pane.agentId ? { ...item, tokens: item.tokens + burn } : item,
          ),
          series: state.series.map((point, index) =>
            index === state.series.length - 1 ? { ...point, tokens: point.tokens + burn } : point,
          ),
          panes: state.panes.map((item) =>
            item.id === paneId
              ? {
                  ...item,
                  plan: reply.plan,
                  hold: reply.status,
                  status: rest.length ? "running" : reply.status,
                  lines: [...item.lines, echo, ...rest].slice(-80),
                }
              : item,
          ),
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
      reset: () => set(demoData()),
    }),
    { name: "helio-studio-v1", skipHydration: true },
  ),
)
