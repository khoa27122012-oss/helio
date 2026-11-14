export type StrategyId = "bridge" | "shield" | "local"

export type LineKind = "in" | "out" | "sys" | "ok" | "block"

export type Line = {
  id: string
  kind: LineKind
  text: string
  hidden?: boolean
}

export type PaneStatus = "idle" | "running" | "waiting" | "blocked"

export type Pane = {
  id: string
  kind: "agent" | "shell"
  agentId?: string
  title: string
  cwd: string
  branch: string
  status: PaneStatus
  hold: PaneStatus
  plan: string[]
  lines: Line[]
}

export type Agent = {
  id: string
  name: string
  cli: string
  model: string
  tokens: number
  paused: boolean
  worktree: string
  note: string
}

export type RepoFile = { path: string; lang: string; code: string }

export type Commit = { hash: string; title: string; author: string; time: string }

export type Repo = {
  slug: string
  name: string
  description: string
  language: string
  stars: number
  starred: boolean
  updated: string
  branch: string
  files: RepoFile[]
  commits: Commit[]
}

export type Issue = {
  id: string
  repo: string
  title: string
  body: string
  labels: string[]
  urgent: boolean
  time: string
  open: boolean
}

export type Check = { name: string; state: "pass" | "fail" | "pending" }

export type Comment = { id: string; author: string; text: string }

export type Pull = {
  id: string
  repo: string
  title: string
  body: string
  author: string
  agentId?: string
  branch: string
  state: "open" | "merged" | "draft"
  time: string
  checks: Check[]
  patch: string
  comments: Comment[]
}

export type Machine = {
  id: string
  name: string
  os: string
  host: string
  latency: string
  online: boolean
  role: string
  files: string[]
}

export type Recipe = {
  id: string
  title: string
  detail: string
  prompt: string
  safety: string
}

export type Activity = { id: string; text: string; time: string }

export type Point = { day: string; tokens: number }

export type ExtraSkill = { id: string; name: string; source: string; text: string }

export type StudioData = {
  panes: Pane[]
  focusId: string
  layout: 1 | 2 | 3
  repos: Repo[]
  issues: Issue[]
  pulls: Pull[]
  agents: Agent[]
  machines: Machine[]
  recipes: Recipe[]
  activity: Activity[]
  series: Point[]
  heatmap: number[]
  blocked: number
  started: boolean
  enabled: string[]
  strategy: StrategyId
  catalogRev: number
  directive: string
  extraSkills: ExtraSkill[]
}
