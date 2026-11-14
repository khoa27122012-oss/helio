import type { LineKind, PaneStatus, Pull } from "./types"

export type ReplyLine = { kind: LineKind; text: string }

export type Reply = {
  status: PaneStatus
  plan: string[]
  lines: ReplyLine[]
}

export type ReplyCtx = {
  branch: string
  cwd: string
  pulls: Pull[]
  machines: { name: string; online: boolean }[]
}

const RULES: { re: RegExp; why: string }[] = [
  { re: /\brm\s+-[a-z]*r[a-z]*f\b/i, why: "Xóa đệ quy bị cấm. Nó không biết đâu là worktree." },
  { re: /\bsudo\b/i, why: "sudo cần một người duyệt, không chạy từ pane." },
  { re: /git\s+push\b.*(?:--force|\s-f\b)/i, why: "Force-push có thể phá lịch sử dùng chung." },
  { re: /git\s+reset\s+--hard\b/i, why: "reset --hard xóa phần việc chưa commit." },
  { re: /\bdrop\s+(database|table)\b/i, why: "Lệnh phá dữ liệu không chạy trong phòng này." },
  { re: /\bmkfs\b|\bdd\s+if=/i, why: "Lệnh đĩa thô bị chặn." },
]

function blocked(input: string): Reply | null {
  for (const rule of RULES) {
    if (rule.re.test(input)) {
      return {
        status: "blocked",
        plan: ["Dừng.", rule.why, "Viết lại lệnh hẹp hơn hoặc xin duyệt trên mục Duyệt."],
        lines: [
          { kind: "block", text: `Đã chặn · ${rule.why}` },
          { kind: "sys", text: "Không có gì được chạy. Sửa lệnh, hoặc để người duyệt quyết trên Duyệt." },
        ],
      }
    }
  }
  return null
}

function command(input: string, ctx: ReplyCtx): Reply | null {
  if (/^help$/i.test(input)) {
    return {
      status: "idle",
      plan: ["Liệt kê lệnh phòng nhận."],
      lines: [
        { kind: "sys", text: "Lệnh phòng nhận" },
        { kind: "out", text: "git status · git log · git push · git worktree · ls · pwd · npm test · ssh · help" },
        { kind: "out", text: "Hoặc một câu: rà soát pull request đang mở" },
        { kind: "sys", text: "rm -rf, sudo, reset --hard và push --force sẽ bị chặn." },
      ],
    }
  }
  if (/^pwd$/i.test(input)) {
    return {
      status: "idle",
      plan: ["In thư mục của pane, không đổi gì."],
      lines: [{ kind: "out", text: ctx.cwd }],
    }
  }
  if (/^whoami$/i.test(input)) {
    return {
      status: "idle",
      plan: ["Phiên cục bộ, không phải root."],
      lines: [{ kind: "out", text: "khoa  (không phải root)" }],
    }
  }
  if (/^ls\b/i.test(input)) {
    return {
      status: "idle",
      plan: ["Liệt kê gốc repo, không đệ quy vào worktree."],
      lines: [
        { kind: "out", text: "README.md" },
        { kind: "out", text: "package.json" },
        { kind: "out", text: "src/" },
        { kind: "out", text: "public/" },
      ],
    }
  }
  if (/^git status\b/i.test(input)) {
    return {
      status: "idle",
      plan: ["Đọc cây làm việc.", "Không stage nếu chưa được bảo."],
      lines: [
        { kind: "out", text: `On branch ${ctx.branch}` },
        { kind: "out", text: "Your branch is ahead of main by 2 commits." },
        { kind: "out", text: "modified:   src/safety/rail.ts" },
        { kind: "out", text: "modified:   src/room/pane.tsx" },
      ],
    }
  }
  if (/^git log\b/i.test(input)) {
    return {
      status: "idle",
      plan: ["Đọc lịch sử nhánh của pane."],
      lines: [
        { kind: "out", text: "a1c3e90  Chặn force-push và reset --hard" },
        { kind: "out", text: "b90d11a  Tách worktree cho từng agent" },
        { kind: "out", text: "c44aa02  Thanh token gộp theo tài khoản" },
      ],
    }
  }
  if (/^git worktree\b/i.test(input)) {
    return {
      status: "idle",
      plan: ["Liệt kê worktree. Không thêm, không xóa."],
      lines: [
        { kind: "out", text: "~/holine              a1c3e90 [main]" },
        { kind: "out", text: "../wt/grok-safety    a1c3e90 [wt/grok-safety]" },
        { kind: "out", text: "../wt/claude-review  b90d11a [wt/claude-review]" },
        { kind: "sys", text: "Mỗi agent một thư mục. Shell ở lại ~/holine." },
      ],
    }
  }
  if (/^git push\b/i.test(input)) {
    return {
      status: "waiting",
      plan: ["Push thường cần bạn xác nhận.", "Phòng không đẩy remote."],
      lines: [
        { kind: "sys", text: "Chưa đẩy lên remote." },
        { kind: "out", text: `Nhánh sẽ đẩy: ${ctx.branch}` },
        { kind: "ok", text: "Không có --force. An toàn để bạn tự duyệt." },
      ],
    }
  }
  if (/^npm (test|run test)\b/i.test(input)) {
    return {
      status: "idle",
      plan: ["Báo kết quả test Tide và Holine."],
      lines: [
        { kind: "out", text: "rail.test.ts      đạt" },
        { kind: "out", text: "worktree.test.ts  đạt" },
        { kind: "ok", text: "42 việc đạt, 0 lỗi" },
      ],
    }
  }
  if (/^ssh\b/i.test(input)) {
    const online = ctx.machines.filter((m) => m.online).map((m) => m.name)
    const offline = ctx.machines.filter((m) => !m.online).map((m) => m.name)
    return {
      status: "idle",
      plan: ["Chỉ vào máy đang bật.", "Phiên SSH đầy đủ nằm ở mục Máy."],
      lines: [
        { kind: "sys", text: "SSH mở từ mục Máy, không từ một lệnh mù." },
        { kind: "out", text: online.length ? `Đang mở: ${online.join(", ")}` : "Không có máy nào đang mở." },
        { kind: "out", text: offline.length ? `Đang tắt: ${offline.join(", ")}` : "Mọi máy đều mở." },
      ],
    }
  }
  if (/^(cd|cat|ps|echo|pnpm|git)\b/i.test(input)) {
    return {
      status: "idle",
      plan: ["Phòng chưa có lệnh này."],
      lines: [
        { kind: "sys", text: "Phòng chưa chạy lệnh này." },
        { kind: "out", text: "Thử git status, git log, ls, npm test, ssh, help." },
        { kind: "out", text: "Hoặc nói tiếng Việt, ví dụ: rà soát pull request đang mở." },
      ],
    }
  }
  return null
}

function natural(input: string, ctx: ReplyCtx): Reply {
  const open = ctx.pulls.filter((p) => p.state === "open" || p.state === "draft")
  const plan = [
    "Giữ main yên. Làm trong worktree của pane này.",
    "Đọc ngữ cảnh trước khi đề xuất lệnh.",
    "Dừng nếu gặp lệnh phá dữ liệu hoặc force-push.",
  ]
  const lines: ReplyLine[] = [
    { kind: "ok", text: "Đã hiểu · không chạy gì trên main" },
    { kind: "sys", text: "Kế hoạch" },
    ...plan.map((step) => ({ kind: "out" as const, text: step })),
  ]

  if (/rà soát|review|pull request|pull/i.test(input)) {
    lines.push({ kind: "sys", text: "Pull request đang mở hoặc nháp" })
    if (!open.length) lines.push({ kind: "out", text: "Không còn PR cần xem." })
    for (const pull of open) {
      const bad = pull.checks.some((c) => c.state === "fail")
      const wait = pull.checks.some((c) => c.state === "pending") || pull.state === "draft"
      const note = bad ? "CI lỗi, chưa merge" : wait ? "còn chờ, chưa merge" : "kiểm tra đạt, chờ bạn duyệt"
      lines.push({ kind: "out", text: `${pull.repo} · ${pull.title} — ${note}` })
    }
  } else if (/worktree/i.test(input)) {
    lines.push({ kind: "out", text: "git worktree add ../wt/agent -b wt/agent" })
    lines.push({ kind: "sys", text: "Shell ở lại gốc. Không xóa worktree đang có người." })
  } else if (/log|ci|kiểm tra/i.test(input)) {
    lines.push({ kind: "out", text: "holine build · đạt" })
    lines.push({ kind: "out", text: "holine test · đạt" })
    lines.push({ kind: "out", text: "quay test · lỗi vì gpu-box đang tắt, không phải vì diff" })
  } else if (/hàng rào|an toàn|chặn/i.test(input)) {
    lines.push({ kind: "out", text: "Chặn: rm -rf, sudo, git reset --hard, git push --force, mkfs" })
    lines.push({ kind: "out", text: "Cho qua: git status, git log, npm test, câu tiếng Việt" })
  } else if (/diff|giải thích|đọc /i.test(input)) {
    lines.push({ kind: "out", text: `Đang nhìn ${ctx.branch} trong ${ctx.cwd}.` })
    lines.push({ kind: "out", text: "Diff đụng hàng rào và đường dẫn worktree. Không thấy lệnh xóa." })
    lines.push({ kind: "sys", text: "Muốn chữ đầy đủ thì mở mục Duyệt, diff nằm cạnh nhận xét." })
  } else {
    lines.push({ kind: "sys", text: `Mình giữ nguyên câu: “${input.slice(0, 80)}”.` })
    lines.push({ kind: "out", text: "Bảo mình chạy bước nào, hoặc gõ một lệnh trực tiếp." })
  }

  return { status: "idle", plan, lines }
}

function unwrap(raw: string) {
  let input = raw.trim()
  if (/^mx\s+/i.test(input)) input = input.replace(/^mx\s+/i, "")
  return input
}

export function planReply(raw: string, ctx: ReplyCtx): Reply {
  const input = unwrap(raw)
  const stop = blocked(input)
  if (stop) return stop
  const known = command(input, ctx)
  if (known) return known
  return natural(input, ctx)
}

export function needsModel(raw: string, ctx: ReplyCtx) {
  const input = unwrap(raw)
  if (blocked(input)) return false
  if (command(input, ctx)) return false
  return true
}
