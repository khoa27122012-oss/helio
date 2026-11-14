import { useEffect, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { aiStatus } from "@/lib/gateway/ask"
import { INSTALLED, STRATEGIES } from "@/lib/gateway/catalog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/cn"
import { useStudio } from "@/lib/studio/store"

export const Route = createFileRoute("/gateway")({
  component: GatewayPage,
  head: () => ({ meta: [{ title: "Cổng · Helio" }] }),
})

const TIERS = [
  { n: "1", title: "Thuê bao", text: "Grok 4.5. Đầu combo của OmniRoute, tầng đầu của 9Router." },
  { n: "2", title: "Thử lại", text: "Chỉ khi máy chủ lỗi. Cùng model, không đổi sang bản kém hơn." },
  { n: "3", title: "Trong phòng", text: "Kế hoạch cục bộ. Không tốn token. Lệnh shell luôn ở tầng này." },
]

function GatewayPage() {
  const enabled = useStudio((s) => s.enabled)
  const strategy = useStudio((s) => s.strategy)
  const toggleSkill = useStudio((s) => s.toggleSkill)
  const setStrategy = useStudio((s) => s.setStrategy)
  const [ready, setReady] = useState<boolean | null>(null)

  useEffect(() => {
    let live = true
    void aiStatus()
      .then((status) => {
        if (live) setReady(status.ready)
      })
      .catch(() => {
        if (live) setReady(false)
      })
    return () => {
      live = false
    }
  }, [])

  const plugins = INSTALLED.filter((item) => item.kind === "plugin")
  const skills = INSTALLED.filter((item) => item.kind === "skill")

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cổng</h1>
          <p className="mt-1 max-w-xl text-sm leading-6 text-mist">
            Ponytail, Taste, Playwright CLI, Graphify và các skill đã nằm trong phòng. OmniRoute chọn Grok 4.5 làm
            đầu combo. 9Router rơi ba tầng. Prompt chỉ mang một dòng mỗi skill.
          </p>
        </div>
        <span className="rounded-md bg-lamp-soft px-3 py-2 font-mono text-xs text-lamp">
          {ready === null ? "Đang hỏi phòng…" : ready ? "Grok 4.5 sẵn sàng" : "Grok chưa sẵn — dùng kế hoạch phòng"}
        </span>
      </div>

      <section>
        <h2 className="text-sm font-medium">Tuyến</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {STRATEGIES.map((item) => {
            const on = strategy === item.id
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={on}
                onClick={() => setStrategy(item.id)}
                className={cn(
                  "min-h-11 rounded-lg border p-3 text-left",
                  on ? "border-lamp bg-lamp-soft" : "border-line bg-ink-2",
                )}
              >
                <span className="block text-sm font-medium text-paper">{item.name}</span>
                <span className="mt-1 block text-sm leading-6 text-mist">{item.detail}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium">Ba tầng 9Router</h2>
        <ol className="mt-3 flex flex-col gap-2">
          {TIERS.map((tier) => (
            <li key={tier.n} className="flex gap-3 rounded-lg border border-line bg-ink-2 p-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-panel font-mono text-sm text-lamp">
                {tier.n}
              </span>
              <span>
                <span className="block text-sm font-medium">{tier.title}</span>
                <span className="mt-1 block text-sm leading-6 text-mist">{tier.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <SkillList title="Plugin" items={plugins} enabled={enabled} onToggle={toggleSkill} />
      <SkillList title="Skill" items={skills} enabled={enabled} onToggle={toggleSkill} />
    </div>
  )
}

function SkillList({
  title,
  items,
  enabled,
  onToggle,
}: {
  title: string
  items: typeof INSTALLED
  enabled: string[]
  onToggle: (id: string) => void
}) {
  return (
    <section>
      <h2 className="text-sm font-medium">{title}</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {items.map((item) => {
          const on = enabled.includes(item.id)
          return (
            <li key={item.id} className="rounded-lg border border-line bg-ink-2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <p className="mt-1 font-mono text-xs text-mist">
                    {item.source}
                    {item.shield ? " · tiết kiệm token" : ""}
                  </p>
                </div>
                <Button variant={on ? "solid" : "line"} aria-pressed={on} onClick={() => onToggle(item.id)}>
                  {on ? "Đang bật" : "Đang tắt"}
                </Button>
              </div>
              <p className="mt-3 text-sm leading-6 text-paper">{item.blurb}</p>
              {item.id === "heretic" ? (
                <p className="mt-2 text-sm leading-6 text-mist">
                  Không chạy ablation trong Helio và không gửi các bước gỡ từ chối cho Grok. Bật cũng chỉ là một dòng
                  nhắc giữ hàng rào.
                </p>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
