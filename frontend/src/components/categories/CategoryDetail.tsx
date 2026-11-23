"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { isNotFoundError } from "@/api/api"
import {
  getCategory,
  type CategoryDetail as CategoryDetailData,
} from "@/api/categories"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { LoadingState } from "@/components/common/LoadingState"
import { SkillGrid } from "@/components/skills/SkillGrid"
import { BackToCategories } from "./BackToCategories"
import { CategoryNotFound } from "./CategoryNotFound"

type Props = { categoryId: number }

type LoadError = "not-found" | "failed" | null

export function CategoryDetail({ categoryId }: Props) {
  const [category, setCategory] = useState<CategoryDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<LoadError>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    getCategory(categoryId, { signal: controller.signal })
      .then((data) => {
        setCategory(data)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return
        // Keep backend error text out of the UI; map to friendly states
        setError(isNotFoundError(err) ? "not-found" : "failed")
        setLoading(false)
      })

    return () => controller.abort()
  }, [categoryId, attempt])

  function retry() {
    setLoading(true)
    setError(null)
    setAttempt((n) => n + 1)
  }

  if (!loading && error === "not-found") return <CategoryNotFound />

  const skills = category?.skills ?? []

  return (
    <section className="space-y-6" aria-labelledby="category-heading">
      <BackToCategories />

      <div aria-live="polite" aria-busy={loading} className="space-y-6">
        {loading && <LoadingState />}

        {!loading && error === "failed" && (
          <>
            <h1 id="category-heading" className="text-2xl font-semibold">
              Category
            </h1>
            <ErrorState
              message="This category couldn't be loaded. Please try again."
              onRetry={retry}
            />
          </>
        )}

        {!loading && !error && category && (
          <>
            <header className="space-y-2">
              <h1 id="category-heading" className="text-2xl font-semibold">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-muted-foreground">{category.description}</p>
              )}
            </header>

            {skills.length === 0 ? (
              <EmptyState message="No public skills in this category yet." />
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {skills.length} {skills.length === 1 ? "skill" : "skills"}
                </p>
                <SkillGrid skills={skills} categories={[category]} />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
