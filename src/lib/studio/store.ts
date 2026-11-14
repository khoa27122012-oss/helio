import { create } from "zustand"
import { persist } from "zustand/middleware"
import { askHelio } from "@/lib/gateway/ask"
import { INSTALLED, skillDigest } from "@/lib/gateway/catalog"
import { cleanKey } from "@/lib/gateway/key"
import { needsModel, planReply, type Reply } from "./reply"
import { demoData } from "./seed"
import { chatPane, ROSTER, roomAgent } from "./roster"
import type { Agent, AgentProvider, Pane, PaneStatus, StudioData, StrategyId } from "./types"

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
  setDirective: (text: string) => void
  addExtra: (skill: { name: string; source: string; text: string }) => void
  removeExtra: (id: string) => void
  addKeyed: (input: { name: string; apiKey: string; task: string; provider: "grok" | "gemini" }) => boolean
  setTask: (id: string, task: string) => void
  begin: () => void
  addAgent: (name: string) => void
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

function packSkills(state: StudioData, input: string) {
  const extra = state.extraSkills
    .slice(0, 8)
    .map((skill) => `${skill.name}: ${skill.text.replace(/\s+/g, " ").slice(0, 240)}`)
    .join("\n")
  return `${skillDigest(state.enabled, input)}\n${extra}`.trim().slice(0, 2200)
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

function reconcileEnabled() {
  return INSTALLED.map((item) => item.id)
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
                      { id: nid("sys"), kind: "sys" as const, text: "Câu trước chưa xong. Đợi một nhịp." },
                    ].slice(-80),
                  }
                : item,
            ),
          })
          return
        }

        const keyed = Boolean(agent?.apiKey)
        const provider = agent?.provider === "gemini" ? "gemini" : "grok"
        const via = keyed
          ? provider === "gemini"
            ? "Đang hỏi Gemini"
            : "Đang hỏi Grok · khóa của agent"
          : "Đang hỏi qua trình duyệt"
        const ticket = nid("ask")
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
            skills: packSkills(state, input),
            context: roomContext(state, pane),
            directive: [state.directive, agent?.task].filter(Boolean).join("\n"),
            route: state.strategy === "shield" ? "shield" : "bridge",
            tight: state.enabled.some((id) => id === "token-shield" || id === "prefix-cache" || id === "on-demand"),
            plain: state.enabled.includes("plain"),
            provider: keyed ? provider : "grok",
            apiKey: agent?.apiKey ?? "",
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
              plan: [`${result.tokens} token · ${result.tier === "gemini" ? "Gemini" : "Grok 4.5"}`],
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
          .catch((error) => {
            if (get().inflight[paneId] !== ticket) return
            const denied = error instanceof Error && error.message === "Unauthorized"
            apply(
              denied
                ? { status: "idle", plan: ["Cần đăng nhập Google."], lines: [] }
                : planReply(input, ctx),
              0,
              denied
                ? [{ kind: "sys", text: "Đăng nhập Google để dùng AI trên trình duyệt. Không cần khóa API." }]
                : [
                    { kind: "sys", text: "Không nối được model." },
                    { kind: "sys", text: "Phòng trả lời thay." },
                  ],
              false,
            )
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
              cwd: "~/holine",
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
              cwd: "~/holine",
              branch: "main",
              status: "idle",
              hold: "idle",
              plan: ["Shell ở gốc repo."],
              lines: [{ id: nid("sys"), kind: "sys", text: "shell · ~/holine · main" }],
            }
        const panes = [...state.panes, pane].slice(-12)
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
      toggleSkill: () => {
        set({ enabled: reconcileEnabled() })
      },
      setStrategy: (strategy) => set({ strategy }),
      setDirective: (text) => set({ directive: text.slice(0, 4000) }),
      addKeyed: (input) => {
        const key = cleanKey(input.apiKey)
        const name = input.name.trim().slice(0, 40)
        const task = input.task.trim().slice(0, 400)
        if (key === null || !key || !name || task.length < 2) return false
        const provider: AgentProvider = input.provider === "gemini" ? "gemini" : "grok"
        const id = nid("agent")
        const slug =
          name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "")
            .slice(0, 16) || "agent"
        const agent: Agent = {
          id,
          name,
          cli: slug,
          model: provider === "gemini" ? "gemini-3.8-flash" : "grok-4.5",
          tokens: 0,
          paused: false,
          worktree: `wt/${slug}`,
          note: task,
          apiKey: key,
          task,
          provider,
        }
        const pane = chatPane(agent, nid("pane"))
        const state = get()
        set({
          started: true,
          agents: [...state.agents, agent],
          panes: [...state.panes, pane].slice(-12),
          focusId: pane.id,
        })
        return true
      },
      setTask: (id, task) => {
        const text = task.trim().slice(0, 400)
        if (text.length < 2) return
        set({
          agents: get().agents.map((agent) => (agent.id === id ? { ...agent, task: text, note: text } : agent)),
        })
      },
      addExtra: (skill) => {
        const name = skill.name.trim().slice(0, 80)
        const text = skill.text.trim().slice(0, 4000)
        if (!name || text.length < 20) return
        const source = skill.source.trim().slice(0, 300)
        if (get().extraSkills.some((item) => item.source === source && source)) return
        set({
          extraSkills: [{ id: nid("skill"), name, source, text }, ...get().extraSkills].slice(0, 12),
        })
      },
      removeExtra: (id) => set({ extraSkills: get().extraSkills.filter((item) => item.id !== id) }),
      begin: () => {
        if (get().started && get().panes.length > 0) return
        const agents = ROSTER.map(roomAgent)
        const panes = agents.map((agent) => chatPane(agent))
        set({
          started: true,
          agents,
          panes,
          focusId: panes[0].id,
          layout: 3,
          enabled: reconcileEnabled(),
        })
      },
      addAgent: (name) => {
        const clean = name.trim()
        if (!clean) return
        const id = nid("agent")
        const slug = clean
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "")
          .slice(0, 16) || "agent"
        const agent: Agent = {
          id,
          name: clean,
          cli: slug,
          model: "grok-4.5",
          tokens: 0,
          paused: false,
          worktree: `wt/${slug}`,
          note: "",
          apiKey: "",
          task: "",
          provider: "browser",
        }
        const pane = chatPane(agent, nid("pane"))
        const state = get()
        set({
          started: true,
          agents: [...state.agents, agent],
          panes: [...state.panes, pane].slice(-12),
          focusId: pane.id,
        })
      },
      reset: () => set({ ...demoData(), inflight: {} }),
    }),
    {
      name: "holine-studio-v1",
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
        started: state.started,
        enabled: state.enabled,
        strategy: state.strategy,
        catalogRev: state.catalogRev,
        directive: state.directive,
        extraSkills: state.extraSkills,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<StudioData>
        return {
          ...current,
          ...saved,
          enabled: reconcileEnabled(),
          strategy: saved.strategy ?? current.strategy,
          started: Boolean(saved.started),
          directive: typeof saved.directive === "string" ? saved.directive : "",
          extraSkills: Array.isArray(saved.extraSkills) ? saved.extraSkills.slice(0, 12) : [],
          agents: Array.isArray(saved.agents)
            ? saved.agents.map((agent) => ({
                ...agent,
                apiKey: cleanKey(agent.apiKey) || "",
                task: typeof agent.task === "string" ? agent.task.slice(0, 400) : "",
                provider: agent.provider === "gemini" || agent.provider === "grok" ? agent.provider : "browser",
              }))
            : current.agents,
          catalogRev: 2,
          inflight: {},
        }
      },
    },
  ),
)
