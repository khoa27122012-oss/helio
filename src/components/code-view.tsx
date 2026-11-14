const KEYS = new Set(
  "const let return function if else import from export type interface class new await async true false fn func package".split(
    " ",
  ),
)

export function paint(line: string) {
  if (/^\s*(\/\/|#)/.test(line)) return <span className="text-mist">{line || " "}</span>
  const parts = line.split(/(\s+|[(){}[\].,:;]|".*?"|'.*?'|`.*?`)/g)
  return parts.map((part, index) => {
    if (!part) return null
    if (/^["'`]/.test(part))
      return (
        <span key={index} className="text-lamp">
          {part}
        </span>
      )
    if (KEYS.has(part))
      return (
        <span key={index} className="text-lamp">
          {part}
        </span>
      )
    return <span key={index}>{part}</span>
  })
}

export function CodeBlock({ code }: { code: string }) {
  const lines = code.replace(/\n$/, "").split("\n")
  return (
    <pre className="overflow-x-auto font-mono text-sm leading-6 text-paper">
      {lines.map((line, index) => (
        <div key={index} className="grid grid-cols-[2.5rem_1fr] hover:bg-panel">
          <span className="pr-3 text-right text-mist select-none">{index + 1}</span>
          <span className="pr-4 whitespace-pre">{paint(line) || " "}</span>
        </div>
      ))}
    </pre>
  )
}

export function Markdown({ text }: { text: string }) {
  return (
    <div className="flex max-w-2xl flex-col gap-3 p-5">
      {text.split("\n").map((raw, index) => {
        if (raw.startsWith("# "))
          return (
            <h2 key={index} className="text-2xl font-semibold tracking-tight text-paper">
              {raw.slice(2)}
            </h2>
          )
        if (raw.startsWith("## "))
          return (
            <h3 key={index} className="text-lg font-semibold text-paper">
              {raw.slice(3)}
            </h3>
          )
        if (raw.startsWith("- "))
          return (
            <p key={index} className="text-base leading-6 text-paper">
              · {raw.slice(2)}
            </p>
          )
        if (/^\d+\.\s/.test(raw))
          return (
            <p key={index} className="text-base leading-6 text-paper">
              {raw}
            </p>
          )
        if (!raw.trim()) return <div key={index} className="h-1" />
        return (
          <p key={index} className="text-base leading-6 text-paper">
            {raw}
          </p>
        )
      })}
    </div>
  )
}

export function DiffView({ patch }: { patch: string }) {
  return (
    <pre className="overflow-x-auto font-mono text-xs leading-6">
      {patch.split("\n").map((line, index) => {
        const add = line.startsWith("+") && !line.startsWith("+++")
        const del = line.startsWith("-") && !line.startsWith("---")
        const hunk = line.startsWith("@@")
        return (
          <div
            key={index}
            className={
              add ? "bg-lamp-soft px-3 text-paper" : del ? "px-3 text-mist" : hunk ? "px-3 text-lamp" : "px-3 text-paper"
            }
          >
            {line || " "}
          </div>
        )
      })}
    </pre>
  )
}
