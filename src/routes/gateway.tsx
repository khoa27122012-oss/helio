import { useEffect, useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { aiStatus } from "@/lib/gateway/ask"
import { INSTALLED, STRATEGIES } from "@/lib/gateway/catalog"
import { ANDROID_BUILD, ANDROID_SDK, CONNECTORS, TOOLS } from "@/lib/gateway/market"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/cn"
import { useStudio } from "@/lib/studio/store"
import type { StrategyId } from "@/lib/studio/types"

export const Route = createFileRoute("/gateway")({
  component: GatewayPage,
  head: () => ({ meta: [{ title: "Tải · Helio" }] }),
})

function GatewayPage() {
  const enabled = useStudio((s) => s.enabled)
  const strategy = useStudio((s) => s.strategy)
  const tools = useStudio((s) => s.tools)
  const connectors = useStudio((s) => s.connectors)
  const stitches = useStudio((s) => s.stitches)
  const toggleSkill = useStudio((s) => s.toggleSkill)
  const setStrategy = useStudio((s) => s.setStrategy)
  const installTools = useStudio((s) => s.installTools)
  const removeTool = useStudio((s) => s.removeTool)
  const setConnector = useStudio((s) => s.setConnector)
  const addStitch = useStudio((s) => s.addStitch)
  const removeStitch = useStudio((s) => s.removeStitch)
  const buildTry = useStudio((s) => s.buildTry)
  const preview = useStudio((s) => s.preview)
  const submit = useStudio((s) => s.submit)
  const focusId = useStudio((s) => s.focusId)
  const [ready, setReady] = useState<boolean | null>(null)
  const [query, setQuery] = useState("")
  const [ask, setAsk] = useState<string | null>(null)
  const [picked, setPicked] = useState<string[]>([])

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

  const q = query.trim().toLowerCase()
  const show = (name: string, extra = "") => !q || `${name} ${extra}`.toLowerCase().includes(q)
  const toolState = (id: string) => tools.find((tool) => tool.id === id)
  const linked = connectors.filter((item) => item.on).map((item) => item.id)
  const asking = CONNECTORS.find((item) => item.id === ask)
  const missingBuild = ANDROID_BUILD.filter((id) => toolState(id)?.state !== "ready")
  const groups = useMemo(() => ["Android SDK", "Biên dịch", "Đóng gói"] as const, [])

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tải</h1>
        <p className="mt-1 max-w-xl text-sm leading-6 text-mist">
          Plugin, skill, connector và bộ biên dịch cho phòng này. Tách pane vẫn ở Phòng. Lệnh phá vẫn bị chặn trước.
        </p>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm plugin, connector, gói…"
          aria-label="Tìm trong kho tải"
          className="mt-4 h-11 w-full rounded-md border border-line bg-ink px-3 text-sm text-paper outline-none placeholder:text-mist focus-visible:border-lamp"
        />
      </div>

      <section className="rounded-lg border border-lamp bg-ink-2 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Android SDK</h2>
            <p className="mt-1 text-sm leading-6 text-mist">
              Command-line tools, Platform-tools, Build-tools 35, Platform android-35, Emulator, NDK. Rồi JDK và Gradle để build thử.
            </p>
          </div>
          <Button onClick={() => installTools([...ANDROID_SDK, ...ANDROID_BUILD])}>Cài đủ để build</Button>
        </div>
        <p className="mt-3 text-sm text-paper">
          {missingBuild.length ? `Còn thiếu ${missingBuild.length} gói trước khi build.` : "Đủ gói. Build sẽ chạy trong pane đang chọn."}
        </p>
        <Button variant="line" className="mt-3" onClick={() => buildTry()}>
          Build thử
        </Button>
        {preview ? (
          <div className="mt-4 w-44 rounded-lg border border-line bg-ink p-2">
            <div className="rounded-md border border-line bg-panel p-3">
              <p className="text-sm font-semibold">Helio</p>
              <p className="mt-2 text-xs leading-5 text-mist">Bản debug đã đóng gói.</p>
              <p className="mt-4 font-mono text-xs text-lamp">{preview.apk}</p>
            </div>
            <p className="mt-2 text-center font-mono text-xs text-mist">{preview.device}</p>
          </div>
        ) : null}
        <p className="mt-3 text-xs leading-5 text-mist">
          Bản xem trước đóng gói trong phòng và hiện khung máy. Không cài SDK lên máy của bạn.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Plugin giảm token</h2>
        <p className="text-sm leading-6 text-mist">Cùng Grok 4.5. Chỉ bớt chữ lặp và skill không dính câu. Không đổi sang model kém hơn.</p>
        <ul className="flex flex-col gap-3">
          {INSTALLED.filter((item) => item.kind === "plugin" && show(item.name, item.blurb)).map((item) => {
            const on = enabled.includes(item.id)
            return (
              <li key={item.id} className="rounded-lg border border-line bg-ink-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold">{item.name}</h3>
                    <p className="mt-1 font-mono text-xs text-mist">{item.source}</p>
                  </div>
                  <Button variant={on ? "line" : "solid"} onClick={() => toggleSkill(item.id)} aria-pressed={on}>
                    {on ? "Gỡ" : "Tải"}
                  </Button>
                </div>
                <p className="mt-3 text-sm leading-6 text-paper">{item.blurb}</p>
                {item.shield ? <p className="mt-2 text-xs text-lamp">Ít token hơn, không giảm độ thông minh</p> : null}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Skill</h2>
        <ul className="flex flex-col gap-3">
          {INSTALLED.filter((item) => item.kind === "skill" && show(item.name, item.blurb)).map((item) => {
            const on = enabled.includes(item.id)
            return (
              <li key={item.id} className="rounded-lg border border-line bg-ink-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">{item.name}</h3>
                    <p className="mt-1 font-mono text-xs text-mist">{item.source}</p>
                  </div>
                  <Button variant={on ? "line" : "solid"} onClick={() => toggleSkill(item.id)} aria-pressed={on}>
                    {on ? "Gỡ" : "Tải"}
                  </Button>
                </div>
                <p className="mt-3 text-sm leading-6 text-paper">{item.blurb}</p>
                {item.id === "heretic" ? (
                  <p className="mt-2 text-xs leading-5 text-mist">Nghiên cứu thôi. Không gửi bước gỡ an toàn vào Grok.</p>
                ) : null}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Connector</h2>
        <p className="text-sm leading-6 text-mist">
          Những chỗ Gemini, Claude và ChatGPT nối được, cộng Stitch. Bấm Nối để cho phép trong phòng.
          {ready === false ? " Grok chưa sẵn, câu tiếng Việt dùng kế hoạch cục bộ." : " Grok đang trả lời thật."}
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {CONNECTORS.filter((item) => show(item.name, item.detail)).map((item) => {
            const on = connectors.find((row) => row.id === item.id)?.on
            return (
              <li key={item.id} className="flex flex-col rounded-lg border border-line bg-ink-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">{item.name}</h3>
                    <p className="mt-1 text-xs text-mist">{item.group}</p>
                  </div>
                  <span className={cn("font-mono text-xs", on ? "text-lamp" : "text-mist")}>{on ? "Đã nối" : "Chưa nối"}</span>
                </div>
                <p className="mt-3 flex-1 text-sm leading-6 text-paper">{item.detail}</p>
                <div className="mt-3 flex gap-2">
                  {on && item.id !== "grok" ? (
                    <Button variant="line" onClick={() => setConnector(item.id, false)}>
                      Ngắt
                    </Button>
                  ) : null}
                  {!on ? (
                    <Button onClick={() => setAsk(item.id)}>Nối</Button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Ghép</h2>
        <p className="text-sm leading-6 text-mist">Chọn ít nhất hai connector đã nối, rồi ghép thành một đường vào pane.</p>
        <ul className="flex flex-col gap-2">
          {CONNECTORS.filter((item) => linked.includes(item.id)).map((item) => {
            const on = picked.includes(item.id)
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPicked((prev) => (prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]))}
                  className={cn(
                    "flex h-11 w-full items-center rounded-md border px-3 text-left text-sm",
                    on ? "border-lamp bg-lamp-soft text-lamp" : "border-line text-paper",
                  )}
                >
                  {item.name}
                </button>
              </li>
            )
          })}
        </ul>
        <Button
          onClick={() => {
            addStitch(picked)
            setPicked([])
          }}
        >
          Ghép đã chọn
        </Button>
        <ul className="flex flex-col gap-3">
          {stitches.map((item) => (
            <li key={item.id} className="rounded-lg border border-line bg-ink-2 p-4">
              <h3 className="text-base font-semibold">{item.title}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="line"
                  onClick={() => {
                    submit(focusId, `dùng ghép ${item.title} để xem việc đang mở`)
                  }}
                >
                  Hỏi pane
                </Button>
                <Button variant="ghost" onClick={() => removeStitch(item.id)}>
                  Gỡ ghép
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Bộ biên dịch và đóng gói</h2>
        {groups.map((group) => (
          <div key={group} className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-mist">{group}</h3>
            <ul className="flex flex-col gap-3">
              {TOOLS.filter((tool) => tool.group === group && show(tool.name, tool.detail)).map((tool) => {
                const row = toolState(tool.id)
                const state = row?.state ?? "absent"
                return (
                  <li key={tool.id} className="rounded-lg border border-line bg-ink-2 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-semibold">{tool.name}</h4>
                        <p className="mt-1 font-mono text-xs text-mist">{tool.size}</p>
                      </div>
                      {state === "ready" ? (
                        <Button variant="line" onClick={() => removeTool(tool.id)}>
                          Gỡ
                        </Button>
                      ) : (
                        <Button disabled={state === "installing"} onClick={() => installTools([tool.id])}>
                          {state === "installing" ? "Đang tải" : "Tải"}
                        </Button>
                      )}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-paper">{tool.detail}</p>
                    {state === "installing" ? (
                      <div className="mt-3 h-2 rounded-full bg-panel" aria-hidden="true">
                        <div className="h-2 rounded-full bg-lamp" style={{ width: `${row?.progress ?? 0}%` }} />
                      </div>
                    ) : null}
                    {state === "ready" ? <p className="mt-2 text-xs text-lamp">Sẵn trong phòng</p> : null}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Tuyến</h2>
        <div className="grid gap-3">
          {STRATEGIES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={strategy === item.id}
              onClick={() => setStrategy(item.id as StrategyId)}
              className={cn(
                "rounded-lg border p-4 text-left",
                strategy === item.id ? "border-lamp bg-lamp-soft" : "border-line bg-ink-2",
              )}
            >
              <span className="block text-base font-semibold">{item.name}</span>
              <span className="mt-1 block text-sm leading-6 text-mist">{item.detail}</span>
            </button>
          ))}
        </div>
      </section>

      {asking ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/80 p-4 sm:items-center" onClick={() => setAsk(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="connect-title"
            className="w-full max-w-md rounded-lg border border-line bg-ink-2 p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="connect-title" className="text-lg font-semibold">
              Nối {asking.name}
            </h2>
            <p className="mt-2 text-sm leading-6 text-mist">
              Cho phép trong phòng này. Grok biết tên connector khi trả lời. Không đọc hộp thư, Drive hay Slack thật.
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {asking.scopes.map((scope) => (
                <li key={scope} className="text-sm text-paper">
                  {scope}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => {
                  setConnector(asking.id, true)
                  setAsk(null)
                }}
              >
                Cho phép
              </Button>
              <Button variant="line" onClick={() => setAsk(null)}>
                Để sau
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
