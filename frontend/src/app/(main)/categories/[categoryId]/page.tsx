import { notFound } from "next/navigation"
import { CategoryDetail } from "@/components/categories/CategoryDetail"

// Accept only positive whole numbers; anything else can't be a category ID
function parseCategoryId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export default async function CategoryDetailPage({
  params,
}: PageProps<"/categories/[categoryId]">) {
  const { categoryId } = await params
  const id = parseCategoryId(categoryId)

  if (id === null) notFound()

  // key remounts the client component so state resets between categories
  return <CategoryDetail key={id} categoryId={id} />
}
