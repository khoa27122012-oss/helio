import { Link, createFileRoute } from "@tanstack/react-router"
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client"
import { useCurrentUserState } from "@/lib/auth/use-current-user"

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Đăng nhập · Holine" }] }),
})

function LoginPage() {
  const { user, isPending } = useCurrentUserState()
  const google = GROK_PROVIDERS.find((item) => item.idp === "google")

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 md:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Đăng nhập Google</h1>
      <p className="text-sm leading-6 text-mist">
        Bắt buộc để nhắn các AI trên trình duyệt. Không cần khóa API. Khóa riêng đặt trong mục Agent.
      </p>
      {isPending ? <p className="text-sm text-mist">Đang kiểm tra…</p> : null}
      {!isPending && user ? (
        <p className="text-sm leading-6 text-paper">
          Đã đăng nhập{user.displayName ? ` · ${user.displayName}` : ""}.{" "}
          <Link to="/" className="text-lamp">
            Về phòng
          </Link>
        </p>
      ) : null}
      {!isPending && !user && authEnabled && google ? (
        <button
          type="button"
          onClick={() => signIn(google.providerId, { callbackURL: "/" })}
          className="inline-flex h-11 items-center justify-center rounded-md bg-lamp px-4 text-sm font-medium text-ink"
        >
          Đăng nhập Google
        </button>
      ) : null}
      {!isPending && !user && !authEnabled ? <p className="text-sm text-mist">Đăng nhập đang tắt.</p> : null}
    </div>
  )
}
