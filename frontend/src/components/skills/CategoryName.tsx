"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { getCategories } from "@/api/categories"

type Props = { categoryId: number }

// Category label for a skill. Shows the ID until (or if) the name can't be loaded.
export function CategoryName({ categoryId }: Props) {
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    getCategories({ signal: controller.signal })
      .then((categories) => {
        setName(categories.find((c) => c.id === categoryId)?.name ?? null)
      })
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return
        // Keep the fallback label
      })
    return () => controller.abort()
  }, [categoryId])

  return <>{name ?? `Category #${categoryId}`}</>
}
