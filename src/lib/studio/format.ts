export function compact(n: number) {
  if (n >= 1000) {
    const v = n / 1000
    const text = v >= 10 ? v.toFixed(0) : v.toFixed(1)
    return `${text.replace(".0", "")}k`
  }
  return String(n)
}
