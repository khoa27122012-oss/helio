import type { Line, StudioData } from "./types"
import { defaultEnabled } from "@/lib/gateway/catalog"

function line(id: string, kind: Line["kind"], text: string): Line {
  return { id, kind, text }
}

function heat() {
  const out: number[] = []
  let x = 23
  for (let i = 0; i < 112; i++) {
    x = (x * 37 + 11) % 97
    out.push(x % 6 === 0 ? 0 : x % 5)
  }
  return out
}

const rail = `const DANGEROUS = [
  /\\brm\\s+-[a-z]*r[a-z]*f\\b/i,
  /git\\s+push\\b.*(?:--force|\\s-f\\b)/,
  /git\\s+reset\\s+--hard\\b/,
]

export function review(command: string) {
  const hit = DANGEROUS.find((rule) => rule.test(command))
  if (!hit) return { ok: true as const }
  return { ok: false as const, reason: "Lệnh có thể phá việc dùng chung." }
}
`

const pane = `type PaneProps = {
  title: string
  branch: string
  status: "idle" | "running" | "waiting" | "blocked"
}

export function Pane({ title, branch, status }: PaneProps) {
  return (
    <section aria-label={title}>
      <header>
        <span>{status}</span>
        <strong>{title}</strong>
        <code>{branch}</code>
      </header>
    </section>
  )
}
`

const readme = `# Helio

Phòng điều khiển cho agent và kho mã.

- Mỗi agent một worktree, không đụng main của nhau
- Câu tiếng Việt hoặc lệnh thường, cùng một ô
- Lệnh nguy hiểm bị chặn trước khi chạy
- Duyệt pull request ngay cạnh terminal

## Chạy thử

Gõ "rà soát pull request đang mở" trong pane Grok.
`

export function demoData(): StudioData {
  return {
    focusId: "p-grok",
    layout: 2,
    blocked: 3,
    panes: [
      {
        id: "p-grok",
        kind: "agent",
        agentId: "grok",
        title: "Grok",
        cwd: "~/helio",
        branch: "wt/grok-safety",
        status: "idle",
        hold: "idle",
        plan: [
          "Chỉ dọn file trong worktree của pane.",
          "Chặn rm -rf, sudo và push --force.",
          "Xin duyệt trên Duyệt trước khi merge.",
        ],
        lines: [
          line("g1", "sys", "Grok · grok-4.5 · worktree wt/grok-safety"),
          line("g2", "in", "kiểm tra hàng rào trước khi agent chạy git clean"),
          line("g3", "ok", "An toàn · lệnh hẹp trong worktree, không đụng main"),
          line("g4", "out", "1. git clean chỉ được trong thư mục wt/*"),
          line("g5", "out", "2. Chặn rm -rf, sudo, reset --hard, push --force"),
          line("g6", "out", "3. Lý do chặn hiện trong pane và được đếm ở thanh trên"),
          line("g7", "sys", "Sẵn sàng. Câu tiếng Việt đi qua Grok 4.5. Lệnh shell ở lại phòng."),
        ],
      },
      {
        id: "p-claude",
        kind: "agent",
        agentId: "claude",
        title: "Claude",
        cwd: "~/helio",
        branch: "wt/claude-review",
        status: "waiting",
        hold: "waiting",
        plan: [
          "Đọc PR đang mở.",
          "Không merge khi CI lỗi hoặc còn là bản nháp.",
          "Chờ bạn duyệt trên mục Duyệt.",
        ],
        lines: [
          line("c1", "sys", "Claude · opus · wt/claude-review"),
          line("c2", "in", "rà soát pull request đang mở"),
          line("c3", "ok", "Hai PR mở. Một bản nháp đang chờ CI."),
          line("c4", "out", "helio · feat: mỗi agent một worktree — kiểm tra đạt"),
          line("c5", "out", "helio · fix: chặn force-push — kiểm tra đạt, diff ngắn"),
          line("c6", "sys", "Mình không merge cho đến khi bạn bấm trên Duyệt."),
        ],
      },
      {
        id: "p-shell",
        kind: "shell",
        title: "Shell",
        cwd: "~/helio",
        branch: "main",
        status: "idle",
        hold: "idle",
        plan: ["Shell thường ở gốc repo.", "Agent làm việc ở worktree riêng."],
        lines: [
          line("s1", "sys", "shell · ~/helio · main"),
          line("s2", "in", "git status"),
          line("s3", "out", "On branch main"),
          line("s4", "out", "nothing to commit, working tree clean"),
          line("s5", "sys", "Worktree của agent nằm cạnh repo, không chung thư mục."),
        ],
      },
    ],
    agents: [
      {
        id: "grok",
        name: "Grok",
        cli: "grok",
        model: "grok-4.5",
        tokens: 18420,
        paused: false,
        worktree: "wt/grok-safety",
        note: "Hàng rào lệnh, worktree, và Grok 4.5 khi câu không phải lệnh shell.",
      },
      {
        id: "claude",
        name: "Claude",
        cli: "claude",
        model: "opus",
        tokens: 24110,
        paused: false,
        worktree: "wt/claude-review",
        note: "Đọc diff, viết nhận xét, không tự merge.",
      },
      {
        id: "codex",
        name: "Codex",
        cli: "codex",
        model: "gpt",
        tokens: 9640,
        paused: false,
        worktree: "wt/codex-tests",
        note: "Sinh test cho diff đang mở.",
      },
      {
        id: "gemini",
        name: "Gemini",
        cli: "gemini",
        model: "gemini",
        tokens: 4280,
        paused: true,
        worktree: "wt/gemini-docs",
        note: "Tạm dừng · đang viết tài liệu Moss.",
      },
      {
        id: "qwen",
        name: "Qwen",
        cli: "qwen",
        model: "qwen",
        tokens: 3110,
        paused: false,
        worktree: "wt/qwen-ui",
        note: "Chỉnh Lantern, token nhẹ.",
      },
    ],
    repos: [
      {
        slug: "helio",
        name: "helio",
        description: "Phòng điều khiển agent, terminal và kho mã trên cùng một mặt bàn.",
        language: "TypeScript",
        stars: 1284,
        starred: true,
        updated: "hôm nay",
        branch: "main",
        files: [
          { path: "README.md", lang: "md", code: readme },
          { path: "src/safety/rail.ts", lang: "ts", code: rail },
          { path: "src/room/pane.tsx", lang: "tsx", code: pane },
        ],
        commits: [
          { hash: "a1c3e90", title: "Chặn force-push và reset --hard", author: "Grok", time: "2 giờ trước" },
          { hash: "b90d11a", title: "Tách worktree cho từng agent", author: "Claude", time: "hôm qua" },
          { hash: "c44aa02", title: "Thanh token gộp theo tài khoản", author: "Khoa", time: "2 ngày trước" },
        ],
      },
      {
        slug: "lantern",
        name: "lantern",
        description: "Hệ chữ, màu và nút dùng chung. Một accent, không cầu vồng.",
        language: "TypeScript",
        stars: 640,
        starred: false,
        updated: "hôm qua",
        branch: "main",
        files: [
          {
            path: "README.md",
            lang: "md",
            code: "# Lantern\n\nMàu giấy trên mực, đèn amber chỉ cho hành động chính.\n\n- Không thêm màu trạng thái mới nếu mực và đèn đủ nói\n- Nút cao ít nhất 44px\n",
          },
          {
            path: "src/tokens.css",
            lang: "css",
            code: "@theme {\n  --color-ink: #101412;\n  --color-paper: #e7e4da;\n  --color-lamp: #e0a04a;\n}\n",
          },
        ],
        commits: [
          { hash: "d11e004", title: "Đưa nút về một chiều cao chạm", author: "Qwen", time: "hôm qua" },
          { hash: "e20ab19", title: "Bỏ tím khỏi bảng màu", author: "Khoa", time: "4 ngày trước" },
        ],
      },
      {
        slug: "tide",
        name: "tide",
        description: "Hàng đợi việc cho agent. Mỗi việc một nhánh, chết thì việc không mất.",
        language: "Rust",
        stars: 402,
        starred: false,
        updated: "3 ngày trước",
        branch: "main",
        files: [
          {
            path: "README.md",
            lang: "md",
            code: "# Tide\n\nWorker nhận việc từ phòng điều khiển.\n\n- Một agent không chiếm việc của agent khác\n- Việc fail được trả lại hàng đợi\n",
          },
          {
            path: "src/main.rs",
            lang: "rust",
            code: "fn main() {\n    println!(\"tide listening\");\n}\n\nfn claim(owner: &str, job: &str) -> bool {\n    owner != \"main\" && !job.is_empty()\n}\n",
          },
        ],
        commits: [
          { hash: "f33c881", title: "Trả việc về hàng đợi khi agent dừng", author: "Codex", time: "3 ngày trước" },
        ],
      },
      {
        slug: "moss",
        name: "moss",
        description: "Tài liệu ngắn. Viết như người đang ngồi cạnh, không viết như brochure.",
        language: "Markdown",
        stars: 88,
        starred: false,
        updated: "tuần trước",
        branch: "main",
        files: [
          {
            path: "guide.md",
            lang: "md",
            code: "# Cách ngồi vào phòng\n\n1. Mở một pane agent.\n2. Nói việc bằng tiếng Việt.\n3. Đọc kế hoạch trước khi bảo chạy.\n4. Duyệt PR ở mục Duyệt, không duyệt trong terminal.\n",
          },
        ],
        commits: [
          { hash: "a9b1002", title: "Viết lại hướng dẫn ngồi vào phòng", author: "Gemini", time: "tuần trước" },
        ],
      },
      {
        slug: "quay",
        name: "quay",
        description: "Danh sách máy, độ trễ và cây file SFTP. Cùng cửa sổ với agent.",
        language: "Go",
        stars: 231,
        starred: true,
        updated: "5 ngày trước",
        branch: "main",
        files: [
          {
            path: "cmd/quay/main.go",
            lang: "go",
            code: "package main\n\nimport \"fmt\"\n\nfunc main() {\n    fmt.Println(\"quay: studio-mac, build-01, edge-sin\")\n}\n",
          },
        ],
        commits: [
          { hash: "bb01992", title: "Hiện máy đang tắt thay vì giấu", author: "Khoa", time: "5 ngày trước" },
        ],
      },
    ],
    issues: [
      {
        id: "i1",
        repo: "helio",
        title: "Hàng rào chặn nhầm git clean trong worktree",
        body: "git clean -fd trong wt/grok-safety bị coi là rm. Cần cho phép khi đường dẫn nằm trong worktree và không phải -rf ngoài gốc.",
        labels: ["an toàn"],
        urgent: true,
        time: "4 giờ trước",
        open: true,
      },
      {
        id: "i2",
        repo: "helio",
        title: "Ô lệnh trên điện thoại bị bàn phím che",
        body: "Khi bàn phím mở, nút gửi phải còn trong vùng nhìn. Pane nên cuộn tới dòng cuối.",
        labels: ["ui"],
        urgent: false,
        time: "hôm qua",
        open: true,
      },
      {
        id: "i3",
        repo: "lantern",
        title: "Token meter cần một dòng cho mỗi tài khoản",
        body: "Đang cộng dồn. Khi có hai tài khoản Claude, không biết đốt của ai.",
        labels: ["agent"],
        urgent: false,
        time: "3 ngày trước",
        open: true,
      },
    ],
    pulls: [
      {
        id: "p1",
        repo: "helio",
        title: "Mỗi agent một worktree",
        body: "Shell ở gốc repo. Agent nhận thư mục riêng để một lệnh checkout không phá pane bên cạnh.",
        author: "Claude",
        agentId: "claude",
        branch: "wt/claude-review",
        state: "open",
        time: "hôm qua",
        checks: [
          { name: "build", state: "pass" },
          { name: "test", state: "pass" },
          { name: "an toàn", state: "pass" },
        ],
        patch: `diff --git a/src/room/pane.tsx b/src/room/pane.tsx
@@ -4,6 +4,10 @@ export function openPane(agent: Agent) {
-  cwd: repo.root,
+  cwd: repo.worktree(agent.id),
+  branch: agent.worktree,
 }
+
+// Shell panes stay at the repo root.
+export const shellCwd = repo.root`,
        comments: [
          { id: "n1", author: "Khoa", text: "Nhớ đừng để pane shell nhảy theo worktree." },
        ],
      },
      {
        id: "p2",
        repo: "helio",
        title: "Chặn force-push trước khi tới remote",
        body: "push --force và -f dừng trong pane, kèm lý do. Push thường chỉ được nhắc, không tự chạy.",
        author: "Grok",
        agentId: "grok",
        branch: "wt/grok-safety",
        state: "open",
        time: "2 giờ trước",
        checks: [
          { name: "build", state: "pass" },
          { name: "test", state: "pass" },
          { name: "an toàn", state: "pass" },
        ],
        patch: `diff --git a/src/safety/rail.ts b/src/safety/rail.ts
@@ -1,3 +1,8 @@
 export function review(command: string) {
-  if (command.includes("rm")) return { ok: false }
+  if (/git\\s+push\\b.*--force/.test(command)) {
+    return { ok: false, reason: "Force-push phá lịch sử dùng chung." }
+  }
+  return { ok: true }
 }`,
        comments: [],
      },
      {
        id: "p3",
        repo: "quay",
        title: "SFTP trong cùng cửa sổ với agent",
        body: "Cây file của máy đang chọn. Bản nháp, CI còn thiếu máy gpu-box.",
        author: "Codex",
        agentId: "codex",
        branch: "wt/codex-tests",
        state: "draft",
        time: "5 giờ trước",
        checks: [
          { name: "build", state: "pass" },
          { name: "test", state: "fail" },
          { name: "an toàn", state: "pending" },
        ],
        patch: `diff --git a/cmd/quay/main.go b/cmd/quay/main.go
@@ -3,3 +3,6 @@ import "fmt"
 func main() {
-    fmt.Println("quay")
+    fmt.Println("quay: list, pull, push")
+    // TODO: refuse paths outside the session root
 }`,
        comments: [
          { id: "n2", author: "Grok", text: "Test fail vì gpu-box đang tắt, không phải vì diff." },
        ],
      },
      {
        id: "p4",
        repo: "lantern",
        title: "Một accent amber cho hành động chính",
        body: "Bỏ tím. Đèn chỉ nằm trên nút chính và pane đang chọn.",
        author: "Qwen",
        agentId: "qwen",
        branch: "wt/qwen-ui",
        state: "merged",
        time: "4 ngày trước",
        checks: [
          { name: "build", state: "pass" },
          { name: "test", state: "pass" },
          { name: "an toàn", state: "pass" },
        ],
        patch: `diff --git a/src/tokens.css b/src/tokens.css
@@ -1,3 +1,3 @@
-  --color-accent: #7c3aed;
+  --color-lamp: #e0a04a;
`,
        comments: [{ id: "n3", author: "Khoa", text: "Merge. Đừng dùng đèn cho chữ thường." }],
      },
    ],
    machines: [
      {
        id: "mac",
        name: "studio-mac",
        os: "macOS",
        host: "local",
        latency: "12 ms",
        online: true,
        role: "Máy bạn đang ngồi",
        files: ["~/helio/README.md", "~/helio/src/safety/rail.ts", "~/wt/grok-safety"],
      },
      {
        id: "build",
        name: "build-01",
        os: "Linux",
        host: "10.0.4.12",
        latency: "48 ms",
        online: true,
        role: "CI và hàng đợi Tide",
        files: ["/srv/tide/jobs", "/var/log/helio/build.log", "/home/ci/.ssh"],
      },
      {
        id: "edge",
        name: "edge-sin",
        os: "Linux",
        host: "edge.studio",
        latency: "110 ms",
        online: true,
        role: "Cửa SSH cho điện thoại",
        files: ["/opt/quay/sessions", "/opt/quay/keys"],
      },
      {
        id: "gpu",
        name: "gpu-box",
        os: "Linux",
        host: "10.0.8.4",
        latency: "—",
        online: false,
        role: "Model cục bộ, đang tắt",
        files: ["/models/qwen", "/models/embed"],
      },
    ],
    recipes: [
      {
        id: "r1",
        title: "Rà soát pull request",
        detail: "Đọc PR đang mở, nói PR nào được merge và PR nào phải chờ.",
        prompt: "rà soát pull request đang mở",
        safety: "Chỉ đọc. Không merge.",
      },
      {
        id: "r2",
        title: "Giải thích diff",
        detail: "Tóm tắt diff worktree mà không đề xuất lệnh phá.",
        prompt: "giải thích diff trong worktree hiện tại",
        safety: "Không checkout, không reset.",
      },
      {
        id: "r3",
        title: "Mở worktree mới",
        detail: "Kế hoạch tách thư mục cho một agent, shell ở lại gốc.",
        prompt: "tạo worktree mới cho agent, đừng đụng main",
        safety: "Không xóa worktree cũ.",
      },
      {
        id: "r4",
        title: "Đọc log CI",
        detail: "Nói bước nào đạt, bước nào lỗi, có phải do máy tắt không.",
        prompt: "đọc log CI của pull request quay",
        safety: "Không chạy lại job phá dữ liệu.",
      },
      {
        id: "r5",
        title: "Hỏi hàng rào",
        detail: "Giải thích lệnh nào bị chặn và vì sao.",
        prompt: "giải thích hàng rào an toàn đang chặn những gì",
        safety: "Không nới rule trong câu trả lời.",
      },
    ],
    activity: [
      { id: "a1", text: "Grok chặn một lần push --force trên wt/grok-safety", time: "2 giờ trước" },
      { id: "a2", text: "Claude mở nhận xét trên PR worktree", time: "hôm qua" },
      { id: "a3", text: "build-01 chạy test Tide, 42 việc đạt", time: "hôm qua" },
      { id: "a4", text: "Qwen merge palette amber vào Lantern", time: "4 ngày trước" },
    ],
    series: [12, 18, 14, 22, 19, 30, 28, 24, 33, 29, 41, 36, 38, 44].map((n, i) => ({
      day: String(i + 1),
      tokens: n * 100,
    })),
    heatmap: heat(),
    enabled: defaultEnabled(),
    strategy: "bridge",
  }
}
