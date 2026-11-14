export type PublicSkill = {
  name: string
  source: string
  agents: string
  blurb: string
  url: string
}

const blob = (path: string) => `https://github.com/anthropics/skills/blob/main/skills/${path}/SKILL.md`

/** Real SKILL.md files. Checked against raw.githubusercontent.com, not invented. */
export const PUBLIC_SKILLS: PublicSkill[] = [
  { name: "frontend-design", source: "anthropics/skills", agents: "Claude", blurb: "Làm giao diện.", url: blob("frontend-design") },
  { name: "webapp-testing", source: "anthropics/skills", agents: "Claude", blurb: "Test ứng dụng web.", url: blob("webapp-testing") },
  { name: "mcp-builder", source: "anthropics/skills", agents: "Claude", blurb: "Dựng máy chủ MCP.", url: blob("mcp-builder") },
  { name: "skill-creator", source: "anthropics/skills", agents: "Claude", blurb: "Viết một skill mới.", url: blob("skill-creator") },
  { name: "pdf", source: "anthropics/skills", agents: "Claude", blurb: "Đọc và tạo PDF.", url: blob("pdf") },
  { name: "docx", source: "anthropics/skills", agents: "Claude", blurb: "Tài liệu Word.", url: blob("docx") },
  { name: "pptx", source: "anthropics/skills", agents: "Claude", blurb: "Bản chiếu.", url: blob("pptx") },
  { name: "xlsx", source: "anthropics/skills", agents: "Claude", blurb: "Bảng tính.", url: blob("xlsx") },
  { name: "algorithmic-art", source: "anthropics/skills", agents: "Claude", blurb: "Ảnh sinh bằng p5.js.", url: blob("algorithmic-art") },
  { name: "canvas-design", source: "anthropics/skills", agents: "Claude", blurb: "Poster và ảnh.", url: blob("canvas-design") },
  { name: "brand-guidelines", source: "anthropics/skills", agents: "Claude", blurb: "Màu và chữ theo brand.", url: blob("brand-guidelines") },
  { name: "theme-factory", source: "anthropics/skills", agents: "Claude", blurb: "Chọn theme cho trang.", url: blob("theme-factory") },
  { name: "slack-gif-creator", source: "anthropics/skills", agents: "Claude", blurb: "Tạo GIF cho Slack.", url: blob("slack-gif-creator") },
  { name: "internal-comms", source: "anthropics/skills", agents: "Claude", blurb: "Thông báo nội bộ.", url: blob("internal-comms") },
]
