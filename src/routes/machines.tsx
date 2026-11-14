import { useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/cn"
import { useStudio } from "@/lib/studio/store"

export const Route = createFileRoute("/machines")({
  component: MachinesPage,
  head: () => ({ meta: [{ title: "Máy · Holine" }] }),
})

function MachinesPage() {
  const machines = useStudio((s) => s.machines)
  const toggleMachine = useStudio((s) => s.toggleMachine)
  const submit = useStudio((s) => s.submit)
  const focusId = useStudio((s) => s.focusId)
  const navigate = useNavigate()
  const [id, setId] = useState(machines[0]?.id ?? "")
  const current = machines.find((machine) => machine.id === id) ?? machines[0]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Máy</h1>
        <p className="mt-1 max-w-xl text-sm leading-6 text-mist">
          SSH và cây file nằm cùng chỗ với agent. Máy tắt thì hiện là tắt, không biến mất.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {machines.map((machine) => (
          <li key={machine.id}>
            <button
              type="button"
              onClick={() => setId(machine.id)}
              className={cn(
                "flex h-full w-full flex-col rounded-lg border p-4 text-left",
                current?.id === machine.id ? "border-lamp bg-ink-2" : "border-line bg-ink hover:border-lamp",
              )}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-lg font-semibold">{machine.name}</span>
                <span className={cn("font-mono text-xs", machine.online ? "text-lamp" : "text-mist")}>
                  {machine.online ? machine.latency : "tắt"}
                </span>
              </span>
              <span className="mt-2 text-sm text-paper">{machine.role}</span>
              <span className="mt-3 font-mono text-xs text-mist">
                {machine.os} · {machine.host}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {current ? (
        <section className="rounded-lg border border-line bg-ink-2 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{current.online ? "SFTP" : "Máy đang tắt"}</h2>
            <Button variant="line" onClick={() => toggleMachine(current.id)}>
              {current.online ? "Ngắt" : "Nối"}
            </Button>
          </div>
          {current.online ? (
            <ul className="mt-3 flex flex-col">
              {current.files.map((file) => (
                <li key={file} className="flex flex-wrap items-center justify-between gap-2 border-t border-line py-2">
                  <span className="font-mono text-sm text-paper">{file}</span>
                  <Button
                    variant="ghost"
                    className="px-3"
                    onClick={() => {
                      submit(focusId, `đọc ${file} trên ${current.name} và tóm tắt rủi ro`)
                      void navigate({ to: "/" })
                    }}
                  >
                    Nhờ agent xem
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-6 text-mist">Không liệt kê file khi máy tắt. Bấm Nối để mở lại phiên mẫu.</p>
          )}
        </section>
      ) : null}
    </div>
  )
}
