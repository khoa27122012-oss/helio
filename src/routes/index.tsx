import { createFileRoute } from "@tanstack/react-router"
import { Room } from "@/components/room"

export const Route = createFileRoute("/")({
  component: Room,
  head: () => ({ meta: [{ title: "Phòng · Helio" }] }),
})
