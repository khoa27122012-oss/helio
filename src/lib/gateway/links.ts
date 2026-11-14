import { createServerFn } from "@tanstack/react-start"
import { authMiddleware } from "@/lib/auth/middleware"
import { cleanKey } from "./key"
import { probeService } from "./link-probe"
import { isService } from "./services"

export const checkLink = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { service?: string; apiKey?: string }) => {
    if (!isService(input?.service)) throw new Error("Không có dịch vụ này.")
    const apiKey = cleanKey(input?.apiKey)
    if (apiKey === null) throw new Error("Dán khóa, không dán file JSON.")
    if (!apiKey) throw new Error("Nhập khóa trước.")
    return { service: input.service, apiKey }
  })
  .handler(async ({ data }) => probeService(data.service, data.apiKey))
