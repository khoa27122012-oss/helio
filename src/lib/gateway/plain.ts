const OPENER =
  /^(chắc chắn rồi|tuyệt vời|câu hỏi hay|dưới đây là|đây là|tất nhiên rồi|tất nhiên|hy vọng|great question|certainly|absolutely|of course)[!,.:\s]*/i

const FILLER = [
  /không chỉ [^.\n]{0,80} mà còn /gi,
  /(giải pháp toàn diện|trải nghiệm người dùng|mượt mà|đột phá|thế giới ngày nay|hãy nhớ rằng|tóm lại[,:]?|nhìn chung[,:]?)/gi,
  /hy vọng điều này giúp[^.\n]*/gi,
  /nếu bạn cần thêm[^.\n]*/gi,
  /đừng ngần ngại[^.\n]*/gi,
  /[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu,
]

function scrubLine(line: string) {
  let next = line
  for (let i = 0; i < 4; i++) {
    const stripped = next.replace(OPENER, "").replace(/^[,.\-]+/, "").trim()
    if (stripped === next) break
    next = stripped
  }
  return next.replace(/[ ]{2,}/g, " ").replace(/\s+,/g, ",").replace(/^[,.\-]+|[,.\-]+$/g, "").trim()
}

export function plainText(input: string) {
  let text = input.replace(/\u2014/g, ", ").replace(/\u2013/g, "-")
  for (const rule of FILLER) text = text.replace(rule, "")
  return text
    .split("\n")
    .map(scrubLine)
    .filter((line) => line && !/^[,.\-]+$/.test(line))
    .join("\n")
    .trim()
}
