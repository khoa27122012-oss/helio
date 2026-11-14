import type { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/cn"

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "ghost" | "line"
}

const styles = {
  solid: "bg-lamp text-ink hover:bg-lamp-deep",
  ghost: "text-paper hover:bg-panel",
  line: "border border-line bg-ink text-paper hover:border-lamp",
}

export function Button({ variant = "solid", className, type = "button", ...props }: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lamp",
        styles[variant],
        className,
      )}
      {...props}
    />
  )
}
