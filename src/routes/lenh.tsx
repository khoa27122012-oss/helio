import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStudio } from "@/lib/studio/store"

export const Route = createFileRoute("/lenh")({
  component: LenhPage,
  head: () => ({ meta: [{ title: "File lệnh · Holine" }] }),
})

const TEMPLATES = [
  {
    label: "Chỉ lập khung",
    text: "Bạn chỉ được lập khung cho ứng dụng. Không viết code triển khai, không bịa file đã sửa.",
  },
  {
    label: "Khóa viết code",
    text: "Khóa viết code. Chỉ nêu file cần đụng, việc gì, và rủi ro. Không in cả file.",
  },
  {
    label: "Chỉ rà soát",
    text: "Chỉ rà soát. Nêu lỗi đúng chỗ. Không đề xuất lệnh xóa hay force-push.",
  },
]

function LenhPage() {
  const directive = useStudio((s) => s.directive)
  const setDirective = useStudio((s) => s.setDirective)

  function insert(text: string) {
    const current = directive.trim()
    setDirective(current ? `${current}\n${text}` : text)
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6">
      <div>
        <Link to="/" className="inline-flex h-11 items-center gap-2 text-sm text-mist hover:text-paper">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Về phòng
        </Link>
        <h1 className="mt-2 font-mono text-2xl font-semibold tracking-tight">lenh.md</h1>
        <p className="mt-1 max-w-xl text-sm leading-6 text-mist">
          File này đi kèm mỗi câu hỏi, sau hàng rào. Hàng rào vẫn cấm rm -rf, sudo, reset --hard, force-push và xóa database. File lệnh không nới được các lệnh đó.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TEMPLATES.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => insert(item.text)}
            className="h-11 rounded-md border border-line px-3 text-sm text-paper hover:border-lamp"
          >
            {item.label}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-xs text-mist">lenh.md · {directive.length}/4000</span>
        <textarea
          value={directive}
          onChange={(event) => setDirective(event.target.value)}
          aria-label="Nội dung file lệnh"
          spellCheck={false}
          placeholder="Viết việc model được phép làm."
          className="min-h-64 w-full rounded-lg border border-line bg-ink-2 p-3 font-mono text-sm leading-6 text-paper outline-none placeholder:text-mist focus-visible:border-lamp"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="line" onClick={() => setDirective("")} disabled={!directive}>
          Xóa file
        </Button>
        <p className="text-sm text-mist">Lưu ngay trong phòng. Ô trống nghĩa là không thêm chỉ thị.</p>
      </div>
    </div>
  )
}
