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
}

/** One-line digests only. Full SKILL.md stays on disk and is never sent to the model. */
export const INSTALLED: Installed[] = [
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
    id: "playwright-cli",
    name: "Playwright CLI",
    kind: "plugin",
    source: "openai/skills · playwright",
    shield: true,
    defaultOn: true,
    blurb: "Duyệt web bằng lệnh: mở, snapshot, bấm theo ref, chụp. Không nhồi một danh sách tool dài.",
    digest: "Playwright CLI: tự động hóa trình duyệt bằng lệnh ngắn. Snapshot lấy ref rồi mới bấm. Không liệt kê tool thừa.",
  },
  {
    id: "token-shield",
    name: "Token shield",
    kind: "plugin",
    source: "Helio",
    shield: true,
    defaultOn: true,
    blurb: "Prompt chỉ mang digest một dòng mỗi skill. Cùng một model. Không cắt ý, không nới hàng rào.",
    digest: "Token shield: bỏ lời dẫn và ví dụ thừa. Giữ đủ điều kiện, rủi ro và bước cần làm. Không làm câu trả lời cụt.",
  },
  {
    id: "graphify",
    name: "Graphify",
    kind: "plugin",
    source: "Graphify-Labs/graphify",
    shield: false,
    defaultOn: true,
    blurb: "Đồ thị tri thức từ mã và tài liệu. Mỗi cạnh có lý do. Không bịa file không có trong ngữ cảnh.",
    digest: "Graphify: khi cần cấu trúc repo, nói quan hệ và lý do. Không bịa đường dẫn ngoài ngữ cảnh.",
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
  },
  {
    id: "heretic",
    name: "Heretic",
    kind: "skill",
    source: "akillness/jeo-skills",
    shield: false,
    defaultOn: false,
    blurb: "Ghi chú nghiên cứu trên model bạn có quyền sửa. Không chạy trong phòng, không đụng Grok.",
    digest: "Heretic chỉ là ghi chú nghiên cứu. Không gỡ từ chối, không jailbreak, không nới hàng rào của phòng.",
  },
]

export const STRATEGIES: { id: StrategyId; name: string; detail: string }[] = [
  {
    id: "bridge",
    name: "OmniRoute + 9Router",
    detail: "Grok 4.5 đứng đầu combo. Lỗi máy chủ thì thử lại một lần, cùng model. Hết thì kế hoạch trong phòng.",
  },
  {
    id: "shield",
    name: "Token shield",
    detail: "Một lần gọi, prompt đã nén, trần chữ thấp hơn. Vẫn Grok 4.5. Không đổi sang model kém hơn.",
  },
  {
    id: "local",
    name: "Chỉ trong phòng",
    detail: "Không gọi model. Lệnh và câu tiếng Việt do kế hoạch cục bộ trả lời.",
  },
]

export function defaultEnabled() {
  return INSTALLED.filter((item) => item.defaultOn).map((item) => item.id)
}

export function skillDigest(enabled: string[]) {
  const on = new Set(enabled)
  const lines = INSTALLED.filter((item) => on.has(item.id)).map((item) => item.digest)
  if (!lines.length) return "Không bật skill nào. Vẫn giữ hàng rào."
  return lines.join("\n").slice(0, 1400)
}

export function strategyName(id: StrategyId) {
  return STRATEGIES.find((item) => item.id === id)?.name ?? id
}
