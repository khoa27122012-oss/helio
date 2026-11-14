import type { StrategyId } from "@/lib/studio/types"

export type SkillKind = "plugin" | "skill"

export type Installed = {
  id: string
  name: string
  kind: SkillKind
  source: string
  shield: boolean
  defaultOn: boolean
  blurb: string
  digest: string
  match?: RegExp
}

/** One-line digests only. Full SKILL.md stays on disk and is never sent to the model. */
export const INSTALLED: Installed[] = [
  {
    id: "plain",
    name: "Giọng thường",
    kind: "plugin",
    source: "Holine",
    shield: false,
    defaultOn: true,
    blurb: "Cắt câu mở đầu, emoji và cụm sáo trước khi hiện chữ. Ý trả lời giữ nguyên.",
    digest: "Giọng thường: không chào, không 'chắc chắn rồi', không emoji, không gạch ngang. Nói thẳng việc.",
  },
  {
    id: "concrete",
    name: "Nói đúng việc",
    kind: "plugin",
    source: "Holine",
    shield: false,
    defaultOn: true,
    blurb: "Bắt model gọi tên nhánh, PR và file có trong phòng. Không bài luận chung.",
    digest: "Nói đúng việc: nêu nhánh, PR, file có trong ngữ cảnh. Không bài luận chung. Không câu 'hy vọng điều này giúp'.",
  },
  {
    id: "ponytail",
    name: "Ponytail",
    kind: "plugin",
    source: "DietrichGebert/ponytail",
    shield: true,
    defaultOn: true,
    blurb: "Việc nhỏ nhất vẫn xong hết. Nêu phần bỏ qua và rủi ro. Không thêm tính năng không được hỏi.",
    digest: "Ponytail: giải quyết hết việc bằng thay đổi nhỏ nhất. Một dòng việc đã bỏ và rủi ro. Không thêm lựa chọn thừa.",
  },
  {
    id: "token-shield",
    name: "Token shield",
    kind: "plugin",
    source: "Holine",
    shield: true,
    defaultOn: true,
    blurb: "Prompt chỉ mang digest một dòng mỗi skill. Cùng một model. Không cắt ý, không nới hàng rào.",
    digest: "Token shield: bỏ lời dẫn và ví dụ thừa. Giữ đủ điều kiện, rủi ro và bước cần làm. Không làm câu trả lời cụt.",
  },
  {
    id: "on-demand",
    name: "Skill theo câu",
    kind: "plugin",
    source: "Holine",
    shield: true,
    defaultOn: false,
    blurb: "Chỉ nạp skill khớp câu hỏi. Hàng rào vẫn luôn có. Không bỏ bước cần làm.",
    digest: "Skill theo câu: chỉ nêu skill liên quan tới câu hỏi. Không bỏ điều kiện an toàn.",
  },
  {
    id: "diff-only",
    name: "Ngữ cảnh ngắn",
    kind: "plugin",
    source: "Holine",
    shield: true,
    defaultOn: false,
    blurb: "Chỉ gửi nhánh, pull request và máy. Không kể lại cả phiên. Ý trả lời không bị cắt.",
    digest: "Ngữ cảnh ngắn: nhánh, pull request, máy. Không nhắc lại lịch sử pane.",
  },
  {
    id: "prefix-cache",
    name: "Nhớ phần mở",
    kind: "plugin",
    source: "Holine",
    shield: true,
    defaultOn: false,
    blurb: "Không gửi lại phần hướng dẫn lặp. Luật an toàn vẫn nằm trong mỗi lần gọi.",
    digest: "Nhớ phần mở: giữ luật, không nhắc lại ví dụ đã biết.",
  },
  {
    id: "agent-skills",
    name: "Agent Skills",
    kind: "plugin",
    source: "agentskills.io",
    shield: true,
    defaultOn: true,
    blurb: "Mỗi skill một việc. Phòng chỉ nạp skill đang bật, không nhét cả tài liệu vào mỗi câu.",
    digest: "Agent Skills: chỉ dùng skill đang bật. Một skill một việc. Không trộn hướng dẫn không liên quan.",
  },
  {
    id: "taste",
    name: "Taste",
    kind: "skill",
    source: "Leonxlnx/taste-skill",
    shield: false,
    defaultOn: true,
    blurb: "Giao diện có quyết định riêng: một hệ, một accent, chữ rõ, không trang trung bình.",
    digest: "Taste: một hệ nhìn, một accent, chữ rõ, không emoji làm icon, không gradient trang trí, không ba thẻ giống hệt.",
    match: /giao diện|ui|trang|thiết kế|css|màu|taste/i,
  },
  {
    id: "web-design-guidelines",
    name: "Web design guidelines",
    kind: "skill",
    source: "vercel-labs/agent-skills",
    shield: false,
    defaultOn: true,
    blurb: "Rà giao diện: nhãn, focus, form, chuyển động, ảnh, chạm. Nói lỗi ngắn, đúng chỗ.",
    digest: "Web guidelines: nhãn, focus thấy được, form, reduced-motion, alt, không tràn ngang, đích chạm đủ lớn.",
    match: /a11y|truy cập|focus|form|guideline|rà soát giao diện/i,
  },
]

export const STRATEGIES: { id: StrategyId; name: string; detail: string }[] = [
  {
    id: "bridge",
    name: "Grok",
    detail: "Grok 4.5. Máy chủ lỗi thì gọi lại một lần, cùng model. Không được thì phòng trả lời.",
  },
  {
    id: "shield",
    name: "Gọi ngắn",
    detail: "Một lần gọi, prompt đã nén. Vẫn Grok 4.5.",
  },
  {
    id: "local",
    name: "Không gọi",
    detail: "Không gọi model. Lệnh và câu tiếng Việt do phòng trả lời.",
  },
]

export function defaultEnabled() {
  return INSTALLED.map((item) => item.id)
}

export function skillDigest(enabled: string[], prompt = "") {
  const on = new Set(enabled)
  const picky = on.has("on-demand")
  const lines = INSTALLED.filter((item) => on.has(item.id))
    .filter((item) => !picky || !item.match || item.match.test(prompt))
    .map((item) => item.digest)
  if (!lines.length) return "Không bật skill nào. Vẫn giữ hàng rào."
  return lines.join("\n").slice(0, 1400)
}

export function strategyName(id: StrategyId) {
  return STRATEGIES.find((item) => item.id === id)?.name ?? id
}
