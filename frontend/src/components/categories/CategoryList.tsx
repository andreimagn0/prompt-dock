"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import axios from "axios"
import { getCategories, type Category } from "@/api/categories"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { LoadingState } from "@/components/common/LoadingState"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    getCategories({ signal: controller.signal })
      .then((data) => {
        setCategories(data)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return
        setError(true)
        setLoading(false)
      })

    return () => controller.abort()
  }, [attempt])

  function retry() {
    setLoading(true)
    setError(false)
    setAttempt((n) => n + 1)
  }

  return (
    <section className="space-y-6" aria-labelledby="categories-heading">
      <h1 id="categories-heading" className="text-2xl font-semibold">
        Categories
      </h1>

      <div aria-live="polite" aria-busy={loading}>
        {loading && <LoadingState />}

        {!loading && error && (
          <ErrorState
            message="Categories couldn't be loaded. Please try again."
            onRetry={retry}
          />
        )}

        {!loading && !error && categories.length === 0 && (
          <EmptyState message="No categories are available yet." />
        )}

        {!loading && !error && categories.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/categories/${category.id}`}
                  className="block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Card className="h-full transition-colors hover:bg-muted/50">
                    <CardHeader>
                      <CardTitle>
                        <h2>{category.name}</h2>
                      </CardTitle>
                      {category.description && (
                        <CardDescription className="line-clamp-3">
                          {category.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
