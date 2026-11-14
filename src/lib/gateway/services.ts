export const SERVICES = [
  {
    id: "stitch",
    label: "Stitch",
    blurb: "Khóa tạo trong Stitch settings. Holine chỉ gọi list_projects, không tạo màn hình.",
    href: "https://stitch.withgoogle.com/docs/mcp/setup",
  },
  {
    id: "figma",
    label: "Figma",
    blurb: "Personal access token. Holine gọi /v1/me.",
    href: "https://www.figma.com/developers/api",
  },
  {
    id: "github",
    label: "GitHub",
    blurb: "PAT classic hoặc fine-grained, quyền đọc tài khoản.",
    href: "https://github.com/settings/tokens",
  },
  {
    id: "notion",
    label: "Notion",
    blurb: "Internal integration token.",
    href: "https://www.notion.so/my-integrations",
  },
  {
    id: "linear",
    label: "Linear",
    blurb: "Personal API key.",
    href: "https://linear.app/settings/api",
  },
  {
    id: "slack",
    label: "Slack",
    blurb: "Bot token. Holine chỉ gọi auth.test.",
    href: "https://api.slack.com/authentication/token-types",
  },
  {
    id: "vercel",
    label: "Vercel",
    blurb: "Access token.",
    href: "https://vercel.com/account/tokens",
  },
] as const

export type ServiceId = (typeof SERVICES)[number]["id"]

export function isService(value: unknown): value is ServiceId {
  return SERVICES.some((item) => item.id === value)
}

export function serviceLabel(id: string) {
  return SERVICES.find((item) => item.id === id)?.label ?? id
}
