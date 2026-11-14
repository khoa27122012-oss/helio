import { useState } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { checkLink } from "@/lib/gateway/links"
import { keyHint, cleanKey } from "@/lib/gateway/key"
import { SERVICES, type ServiceId } from "@/lib/gateway/services"
import { useStudio } from "@/lib/studio/store"
import type { ServiceLink } from "@/lib/studio/types"

export const Route = createFileRoute("/noi")({
  component: NoiPage,
  head: () => ({ meta: [{ title: "Nối · Holine" }] }),
})

function NoiPage() {
  const links = useStudio((s) => s.links ?? [])
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/"
          className="inline-flex h-11 items-center gap-2 rounded-md border border-line px-3 text-sm text-paper hover:border-lamp"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Quay lại
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nối</h1>
      </div>
      <p className="max-w-xl text-sm leading-6 text-mist">
        Stitch, Figma và các dịch vụ bên dưới. Nút cũ chỉ ghi đã nối, không gọi được ai, nên đã gỡ. Giờ Holine chỉ ghi đã nối khi chính dịch vụ chấp nhận khóa. Khóa AI vẫn ở mục Agent.
      </p>
      <ul className="flex flex-col gap-3">
        {SERVICES.map((spec) => (
          <ServiceCard key={spec.id} spec={spec} link={links.find((item) => item.service === spec.id)} />
        ))}
      </ul>
      <p className="max-w-xl text-sm leading-6 text-mist">
        Canva không nhận khóa dán. Gmail, Lịch và Drive cũng không dán ở đây.
      </p>
    </div>
  )
}

function ServiceCard({
  spec,
  link,
}: {
  spec: (typeof SERVICES)[number]
  link?: ServiceLink
}) {
  const addLink = useStudio((s) => s.addLink)
  const removeLink = useStudio((s) => s.removeLink)
  const [apiKey, setApiKey] = useState("")
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState("")
  const [swap, setSwap] = useState(false)

  return (
    <li className="rounded-lg border border-line bg-ink-2 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{spec.label}</h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-mist">{spec.blurb}</p>
        </div>
        <a
          href={spec.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center text-sm text-lamp"
        >
          Lấy khóa
        </a>
      </div>
      {link && !swap ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-sm text-paper">
            Đã nối · {link.account}
            <span className="ml-2 font-mono text-xs text-mist">{keyHint(link.apiKey)}</span>
          </p>
          <Button type="button" variant="line" onClick={() => removeLink(spec.id)}>
            Gỡ
          </Button>
          <Button type="button" variant="line" onClick={() => setSwap(true)}>
            Đổi khóa
          </Button>
        </div>
      ) : (
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (busy) return
            const key = cleanKey(apiKey)
            if (key === null) {
              setNote("Dán khóa, không dán file JSON.")
              return
            }
            if (!key) {
              setNote("Nhập khóa trước.")
              return
            }
            setBusy(true)
            setNote("Đang kiểm tra…")
            void checkLink({ data: { service: spec.id, apiKey: key } })
              .then((found) => {
                if (!found.ok) {
                  setNote(found.error)
                  return
                }
                const saved = addLink({ service: found.service as ServiceId, account: found.account, apiKey: key })
                if (!saved) {
                  setNote("Chưa lưu được.")
                  return
                }
                setApiKey("")
                setNote("")
                setSwap(false)
              })
              .catch((error: unknown) => {
                const denied = error instanceof Error && error.message === "Unauthorized"
                setNote(denied ? "Đăng nhập Google trước khi kiểm tra khóa." : "Không kiểm tra được khóa.")
              })
              .finally(() => setBusy(false))
          }}
        >
          <label className="flex flex-col gap-2 text-sm">
            Khóa {spec.label}
            <input
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              type={show ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              disabled={busy}
              placeholder={`Dán khóa ${spec.label}`}
              className="h-11 rounded-md border border-line bg-ink px-3 font-mono text-sm text-paper outline-none placeholder:text-mist focus-visible:border-lamp disabled:opacity-60"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShow((value) => !value)}
              className="h-11 rounded-md border border-line px-3 text-sm text-paper"
            >
              {show ? "Ẩn" : "Hiện"}
            </button>
            <Button type="submit" disabled={busy}>
              {busy ? "Đang kiểm tra…" : "Nối"}
            </Button>
            {swap ? (
              <Button type="button" variant="line" onClick={() => setSwap(false)} disabled={busy}>
                Hủy
              </Button>
            ) : null}
          </div>
          {note ? <p className="text-sm leading-6 text-paper">{note}</p> : null}
        </form>
      )}
    </li>
  )
}
