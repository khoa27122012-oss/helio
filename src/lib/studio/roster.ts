import type { Agent, Pane } from "./types"

export const ROSTER: Omit<Agent, "tokens" | "paused" | "note" | "apiKey" | "task" | "provider">[] = [
  { id: "grok", name: "Grok", cli: "grok", model: "grok-4.5", worktree: "wt/grok" },
  { id: "claude", name: "Claude", cli: "claude", model: "opus", worktree: "wt/claude" },
  { id: "codex", name: "Codex", cli: "codex", model: "gpt", worktree: "wt/codex" },
  { id: "gemini", name: "Gemini", cli: "gemini", model: "gemini", worktree: "wt/gemini" },
  { id: "qwen", name: "Qwen", cli: "qwen", model: "qwen", worktree: "wt/qwen" },
]

export function roomAgent(row: (typeof ROSTER)[number]): Agent {
  return { ...row, tokens: 0, paused: false, note: "", apiKey: "", task: "", provider: "browser" }
}

export function chatPane(agent: Agent, id = `p-${agent.id}`): Pane {
  return {
    id,
    kind: "agent",
    agentId: agent.id,
    title: agent.name,
    cwd: "~/holine",
    branch: agent.worktree,
    status: "idle",
    hold: "idle",
    plan: ["Khung chat trống.", `${agent.name} · ${agent.worktree}.`],
    lines: [
      {
        id: `hi-${agent.id}`,
        kind: "sys",
        text: agent.apiKey
          ? `${agent.name} · ${agent.provider === "gemini" ? "Gemini" : "Grok"}. Nhiệm vụ: ${agent.task}`
          : agent.model === "grok-4.5"
            ? `${agent.name} · ${agent.model}. Đăng nhập Google, không cần khóa.`
            : `${agent.name} · ${agent.model}. Câu chữ đi qua Grok 4.5 sau khi đăng nhập Google.`,
      },
    ],
  }
}
