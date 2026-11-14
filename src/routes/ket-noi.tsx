import { useEffect, useState } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { probeModel } from "@/lib/gateway/ask"
import { cleanKey, keyHint, type KeyName } from "@/lib/gateway/key"
import { useStudio } from "@/lib/studio/store"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/ket-noi")({
  component: ConnectPage,
  head: () => ({ meta: [{ title: "Kết nối · Holine" }] }),
})

function ConnectPage() {
  const saved = useStudio((s) => s.keys)
  const setKey = useStudio((s) => s.setKey)
  const [xai, setXai] = useState(saved.xai)
  const [gemini, setGemini] = useState(saved.gemini)
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState<KeyName | "">("")
  const [note, setNote] = useState("")

  useEffect(() => {
    setXai(saved.xai)
    setGemini(saved.gemini)
  }, [saved.xai, saved.gemini])

  async function check(which: KeyName) {
    const raw = which === "gemini" ? gemini : xai
    const key = cleanKey(raw)
    if (key === null) {
      setNote("Dán khóa API, không dán file JSON của service account.")
      return
    }
    if (which === "gemini" && !key) {
      setNote("Chưa có khóa Gemini. Đăng nhập Google AI Studio rồi dán khóa.")
      return
    }
    setKey(which, key)
    setBusy(which)
    setNote("")
    try {
      const result = await probeModel({ data: { provider: which, apiKey: key } })
      setNote(result.ok ? result.detail : result.error)
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Không kiểm tra được.")
    } finally {
      setBusy("")
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kết nối</h1>
        <p className="mt-1 max-w-xl text-sm leading-6 text-mist">
          Dán khóa của bạn. Khóa nằm trên trình duyệt này. Máy chủ chỉ dùng để gọi, không lưu. Hàng rào vẫn chạy trước model.
        </p>
        <Link to="/" className="mt-3 inline-flex h-11 items-center text-sm text-lamp">
          Về phòng
        </Link>
      </div>

      <section className="flex flex-col gap-3 rounded-lg border border-line bg-ink-2 p-4">
        <h2 className="text-lg font-semibold">Grok</h2>
        <p className="text-sm leading-6 text-mist">
          Khóa API từ xAI. Để trống thì khung Grok dùng khóa của bản Holine, nếu bản đó có.
        </p>
        <a
          href="https://console.x.ai/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center text-sm text-lamp"
        >
          Mở console xAI
        </a>
        <label className="text-sm" htmlFor="khoa-xai">
          Khóa API xAI
        </label>
        <input
          id="khoa-xai"
          value={xai}
          onChange={(event) => setXai(event.target.value)}
          type={show ? "text" : "password"}
          autoComplete="off"
          spellCheck={false}
          placeholder="xai-…"
          className="h-12 rounded-md border border-line bg-ink px-3 font-mono text-sm text-paper outline-none placeholder:text-mist focus-visible:border-lamp"
        />
        <p className="font-mono text-xs text-mist">{saved.xai ? `Đã lưu ${keyHint(saved.xai)}` : "Chưa lưu khóa Grok."}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={busy !== ""} onClick={() => void check("xai")}>
            {busy === "xai" ? "Đang kiểm tra" : "Kiểm tra Grok"}
          </Button>
          <Button
            variant="line"
            type="button"
            onClick={() => {
              setXai("")
              setKey("xai", "")
              setNote("Đã xóa khóa Grok.")
            }}
          >
            Xóa
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-line bg-ink-2 p-4">
        <h2 className="text-lg font-semibold">Gemini qua tài khoản Google</h2>
        <p className="text-sm leading-6 text-paper">
          Đăng nhập tài khoản Google trên Google AI Studio, tạo khóa API, rồi dán vào đây. Khung Gemini gọi Gemini thật, không đi qua Grok.
        </p>
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center rounded-md bg-lamp px-4 text-sm font-medium text-ink"
        >
          Đăng nhập Google AI Studio
        </a>
        <label className="text-sm" htmlFor="khoa-gemini">
          Khóa API Gemini
        </label>
        <input
          id="khoa-gemini"
          value={gemini}
          onChange={(event) => setGemini(event.target.value)}
          type={show ? "text" : "password"}
          autoComplete="off"
          spellCheck={false}
          placeholder="Khóa từ AI Studio"
          className="h-12 rounded-md border border-line bg-ink px-3 font-mono text-sm text-paper outline-none placeholder:text-mist focus-visible:border-lamp"
        />
        <p className="font-mono text-xs text-mist">
          {saved.gemini ? `Đã lưu ${keyHint(saved.gemini)}` : "Chưa lưu khóa Gemini."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={busy !== ""} onClick={() => void check("gemini")}>
            {busy === "gemini" ? "Đang kiểm tra" : "Kiểm tra Gemini"}
          </Button>
          <Button
            variant="line"
            type="button"
            onClick={() => {
              setGemini("")
              setKey("gemini", "")
              setNote("Đã xóa khóa Gemini.")
            }}
          >
            Xóa
          </Button>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setShow((value) => !value)}
          className="h-11 rounded-md border border-line px-3 text-sm text-paper"
        >
          {show ? "Ẩn khóa" : "Hiện khóa"}
        </button>
        {note ? <p className="text-sm leading-6 text-paper">{note}</p> : null}
      </div>
    </div>
  )
}
