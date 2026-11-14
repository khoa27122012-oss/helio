import { useEffect, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { compact } from "@/lib/studio/format"
import { useStudio } from "@/lib/studio/store"
import { cn } from "@/lib/cn"

export const Route = createFileRoute("/insights")({
  component: InsightsPage,
  head: () => ({ meta: [{ title: "Nhịp · Helio" }] }),
})

const HEAT = ["bg-panel", "bg-lamp-soft", "bg-lamp-dim", "bg-lamp-deep", "bg-lamp"]

function Chart({ data }: { data: { day: string; tokens: number }[] }) {
  const [charts, setCharts] = useState<typeof import("recharts") | null>(null)
  useEffect(() => {
    let live = true
    void import("recharts").then((mod) => {
      if (live) setCharts(mod)
    })
    return () => {
      live = false
    }
  }, [])
  if (!charts) return <div className="flex h-48 items-center text-sm text-mist">Đang vẽ nhịp…</div>
  const { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } = charts
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <XAxis dataKey="day" tick={{ fill: "var(--color-mist)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: "var(--color-ink-2)",
              border: "1px solid var(--color-line)",
              borderRadius: 8,
              color: "var(--color-paper)",
            }}
          />
          <Area dataKey="tokens" stroke="var(--color-lamp)" fill="var(--color-lamp)" fillOpacity={0.2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function InsightsPage() {
  const series = useStudio((s) => s.series)
  const heatmap = useStudio((s) => s.heatmap)
  const activity = useStudio((s) => s.activity)
  const blocked = useStudio((s) => s.blocked)
  const pulls = useStudio((s) => s.pulls)
  const agents = useStudio((s) => s.agents)
  const merged = pulls.filter((pull) => pull.state === "merged").length
  const tokens = agents.reduce((sum, agent) => sum + agent.tokens, 0)

  const stats = [
    { label: "Token các agent", value: compact(tokens) },
    { label: "Lệnh đã chặn", value: String(blocked) },
    { label: "PR đã merge", value: String(merged) },
    { label: "Agent đang mở", value: String(agents.filter((agent) => !agent.paused).length) },
  ]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nhịp</h1>
        <p className="mt-1 max-w-xl text-sm leading-6 text-mist">
          Token, việc đã chặn, và 16 tuần có mặt. Gõ trong phòng rồi quay lại, cột cuối sẽ nhích.
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <li key={stat.label} className="rounded-lg border border-line bg-ink-2 p-4">
            <p className="text-xs text-mist">{stat.label}</p>
            <p className="mt-2 font-mono text-2xl text-paper">{stat.value}</p>
          </li>
        ))}
      </ul>
      <section className="rounded-lg border border-line bg-ink-2 p-4">
        <h2 className="text-sm font-medium">Token 14 ngày</h2>
        <div className="mt-3">
          <Chart data={series} />
        </div>
      </section>
      <section className="rounded-lg border border-line bg-ink-2 p-4">
        <h2 className="text-sm font-medium">16 tuần</h2>
        <p className="mt-1 text-sm text-mist">Mỗi cột là một tuần. Đèn đậm là ngày có nhiều việc.</p>
        <div className="mt-4 overflow-x-auto">
          <div className="grid w-max grid-flow-col grid-rows-7 gap-1" role="img" aria-label="Hoạt động 16 tuần">
            {heatmap.map((value, index) => (
              <div key={index} className={cn("size-3 rounded-sm", HEAT[Math.min(value, 4)])} />
            ))}
          </div>
        </div>
      </section>
      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-ink-2 p-4">
          <h2 className="text-sm font-medium">Vừa xảy ra</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {activity.map((item) => (
              <li key={item.id} className="text-sm leading-6">
                <span className="text-paper">{item.text}</span>
                <span className="mt-1 block font-mono text-xs text-mist">{item.time}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-line bg-ink-2 p-4">
          <h2 className="text-sm font-medium">Cùng một mặt bàn</h2>
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr className="text-mist">
                <th className="py-2 font-medium">Việc</th>
                <th className="py-2 font-medium">GitHub</th>
                <th className="py-2 font-medium">Helio</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Kho, file, sao", "Có", "Có, cạnh terminal"],
                ["Nhiều agent một lúc", "Không", "Pane và worktree riêng"],
                ["Hàng rào lệnh", "Không", "Chặn trước khi chạy"],
                ["SSH và SFTP", "Không", "Trong mục Máy"],
                ["Duyệt diff", "Trang riêng", "Ngay trong Duyệt"],
              ].map((row) => (
                <tr key={row[0]} className="border-t border-line">
                  {row.map((cell) => (
                    <td key={cell} className="py-2 pr-3 text-paper">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
