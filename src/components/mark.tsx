import { cn } from "@/lib/cn"

export function Mark({ className }: { className?: string }) {
  return <img src="/logo.png" alt="" className={cn("size-8 rounded-full object-cover", className)} />
}
