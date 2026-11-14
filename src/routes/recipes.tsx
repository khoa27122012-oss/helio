import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { useStudio } from "@/lib/studio/store"

export const Route = createFileRoute("/recipes")({
  component: RecipesPage,
  head: () => ({ meta: [{ title: "Công thức · Holine" }] }),
})

function RecipesPage() {
  const recipes = useStudio((s) => s.recipes)
  const submit = useStudio((s) => s.submit)
  const focusId = useStudio((s) => s.focusId)
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Công thức</h1>
        <p className="mt-1 text-sm leading-6 text-mist">
          Câu đã viết sẵn, gửi vào pane đang chọn. Hàng rào vẫn áp dụng nếu câu chứa lệnh cấm.
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {recipes.map((recipe) => (
          <li key={recipe.id} className="rounded-lg border border-line bg-ink-2 p-4">
            <h2 className="text-lg font-semibold">{recipe.title}</h2>
            <p className="mt-2 text-sm leading-6 text-paper">{recipe.detail}</p>
            <p className="mt-3 font-mono text-xs text-mist">{recipe.prompt}</p>
            <p className="mt-2 text-sm text-lamp">{recipe.safety}</p>
            <Button
              className="mt-4"
              onClick={() => {
                submit(focusId, recipe.prompt)
                void navigate({ to: "/" })
              }}
            >
              Chạy trong phòng
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
