import { vendorLabel } from "@/lib/gateway/vendors"
import type { Agent, Pane } from "./types"

export const ROSTER: Omit<Agent, "tokens" | "paused" | "note" | "apiKey" | "task" | "directive" | "provider">[] = [
  { id: "grok", name: "Grok", cli: "grok", model: "grok-4.5", worktree: "wt/grok" },
  { id: "claude", name: "Claude", cli: "claude", model: "opus", worktree: "wt/claude" },
  { id: "codex", name: "Codex", cli: "codex", model: "gpt", worktree: "wt/codex" },
  { id: "gemini", name: "Gemini", cli: "gemini", model: "gemini", worktree: "wt/gemini" },
  { id: "qwen", name: "Qwen", cli: "qwen", model: "qwen", worktree: "wt/qwen" },
]

export function roomAgent(row: (typeof ROSTER)[number]): Agent {
  return { ...row, tokens: 0, paused: false, note: "", apiKey: "", task: "", directive: "", provider: "browser" }
}

export function agentHello(agent: Agent) {
  if (agent.apiKey) {
    const house = vendorLabel(agent.provider)
    return house
      ? `${agent.name} đã kết nối · ${house}. Nhiệm vụ: ${agent.task}`
      : `${agent.name} đã kết nối. Nhiệm vụ: ${agent.task}`
  }
  if (agent.model === "grok-4.5") return `${agent.name} · ${agent.model}. Đăng nhập Google, không cần khóa.`
  return `${agent.name} · ${agent.model}. Câu chữ đi qua Grok 4.5 sau khi đăng nhập Google.`
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
    plan: agent.apiKey
      ? [`${agent.name} đã kết nối.`, agent.task]
      : ["Khung chat trống.", `${agent.name} · ${agent.worktree}.`],
    lines: [
      {
        id: `hi-${id}`,
        kind: "sys",
        text: agentHello(agent),
      },
    ],
  }
}
