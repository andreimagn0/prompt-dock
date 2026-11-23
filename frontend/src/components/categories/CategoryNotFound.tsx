import { EmptyState } from "@/components/common/EmptyState"
import { BackToCategories } from "./BackToCategories"

// Shared by the route's not-found.tsx (malformed IDs) and CategoryDetail
// (well-formed IDs the API reports as missing).
export function CategoryNotFound() {
  return (
    <section className="space-y-6" aria-labelledby="category-heading">
      <BackToCategories />
      <h1 id="category-heading" className="text-2xl font-semibold">
        Category not found
      </h1>
      <EmptyState message="This category doesn't exist or may have been removed." />
    </section>
  )
}
