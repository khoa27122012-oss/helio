import { useEffect, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { aiStatus } from "@/lib/gateway/ask"
import { INSTALLED, STRATEGIES, type Installed } from "@/lib/gateway/catalog"
import { Button } from "@/components/ui/button"
import { useStudio } from "@/lib/studio/store"
import type { StrategyId } from "@/lib/studio/types"

export const Route = createFileRoute("/gateway")({
  component: GatewayPage,
  head: () => ({ meta: [{ title: "Plugin · Helio" }] }),
})

function Row({ item, on, toggle }: { item: Installed; on: boolean; toggle: () => void }) {
  return (
    <li className="rounded-lg border border-line bg-ink-2 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold">{item.name}</h3>
          <p className="mt-1 font-mono text-xs text-mist">{item.source}</p>
        </div>
        <Button variant={on ? "line" : "solid"} onClick={toggle} aria-pressed={on}>
          {on ? "Tắt" : "Bật"}
        </Button>
      </div>
      <p className="mt-3 text-sm leading-6 text-paper">{item.blurb}</p>
    </li>
  )
}

function GatewayPage() {
  const enabled = useStudio((s) => s.enabled)
  const strategy = useStudio((s) => s.strategy)
  const toggleSkill = useStudio((s) => s.toggleSkill)
  const setStrategy = useStudio((s) => s.setStrategy)
  const [ready, setReady] = useState<boolean | null>(null)
  const [query, setQuery] = useState("")

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

  const needle = query.trim().toLowerCase()
  const show = (item: Installed) =>
    !needle || `${item.name} ${item.blurb} ${item.source}`.toLowerCase().includes(needle)
  const plugins = INSTALLED.filter((item) => item.kind === "plugin" && show(item))
  const skills = INSTALLED.filter((item) => item.kind === "skill" && show(item))
  const voice = ready === null ? "Đang kiểm tra Grok." : ready ? "Grok 4.5 đang mở." : "Grok chưa có trong bản này."

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Plugin</h1>
        <p className="mt-1 max-w-xl text-sm leading-6 text-mist">
          Bật những thứ đổi câu gửi đi và câu trả về. {voice}
        </p>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm plugin hoặc skill"
          aria-label="Tìm plugin"
          className="mt-4 h-12 w-full rounded-md border border-line bg-ink-2 px-3 text-sm text-paper outline-none placeholder:text-mist"
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Cách gọi</h2>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Cách gọi">
          {STRATEGIES.map((item) => {
            const on = strategy === item.id
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setStrategy(item.id as StrategyId)}
                className={
                  on
                    ? "rounded-lg border border-lamp bg-ink-2 p-4 text-left"
                    : "rounded-lg border border-line bg-ink-2 p-4 text-left"
                }
              >
                <span className="text-base font-semibold">{item.name}</span>
                <span className="mt-1 block text-sm leading-6 text-mist">{item.detail}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Plugin</h2>
        <ul className="flex flex-col gap-3">
          {plugins.map((item) => (
            <Row key={item.id} item={item} on={enabled.includes(item.id)} toggle={() => toggleSkill(item.id)} />
          ))}
        </ul>
        {plugins.length === 0 ? <p className="text-sm text-mist">Không có plugin khớp.</p> : null}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Skill</h2>
        <ul className="flex flex-col gap-3">
          {skills.map((item) => (
            <Row key={item.id} item={item} on={enabled.includes(item.id)} toggle={() => toggleSkill(item.id)} />
          ))}
        </ul>
        {skills.length === 0 ? <p className="text-sm text-mist">Không có skill khớp.</p> : null}
      </section>
    </div>
  )
}
