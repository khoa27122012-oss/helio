import { Link, createFileRoute } from "@tanstack/react-router"
import { Mark } from "@/components/mark"
import { Room } from "@/components/room"
import { Button } from "@/components/ui/button"
import { INSTALLED } from "@/lib/gateway/catalog"
import { useStudio } from "@/lib/studio/store"

function Home() {
  const started = useStudio((s) => s.started)
  const begin = useStudio((s) => s.begin)
  if (!started) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-12">
        <Mark className="size-36" />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Holine</h1>
        <p className="mt-2 text-center text-sm leading-6 text-mist">
          Bắt đầu mở phòng. Mỗi AI một khung chat và một worktree.
        </p>
        <ul className="mt-6 flex flex-wrap justify-center gap-2">
          {INSTALLED.map((item) => (
            <li key={item.id} className="rounded-md border border-line bg-ink-2 px-3 py-2 text-sm">
              {item.name}
            </li>
          ))}
        </ul>
        <Button className="mt-8" onClick={() => begin()}>
          Bắt đầu
        </Button>
        <Link to="/noi" className="mt-4 inline-flex h-11 items-center text-sm text-lamp">
          Nối Stitch, Figma và dịch vụ khác
        </Link>
      </div>
    )
  }
  return <Room />
}

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({ meta: [{ title: "Phòng · Holine" }] }),
})
