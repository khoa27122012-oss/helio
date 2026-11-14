import { cn } from "@/lib/cn"

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-ink-2" />
      <rect x="7" y="13" width="18" height="11" rx="2" className="fill-lamp" />
      <rect x="13" y="7" width="6" height="7" rx="1" className="fill-paper" />
    </svg>
  )
}
