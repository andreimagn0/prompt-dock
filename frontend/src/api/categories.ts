import api from "./api"
import type { Skill } from "./skills"

export type Category = {
  id: number
  name: string
  description: string | null
}

// GET /categories/{id} returns the category plus its public skills
export type CategoryDetail = Category & {
  skills: Skill[]
}

export const getCategories = (options: { signal?: AbortSignal } = {}) =>
  api
    .get<Category[]>("/categories", { signal: options.signal })
    .then((r) => r.data)

export const getCategory = (
  categoryId: number,
  options: { signal?: AbortSignal } = {}
) =>
  api
    .get<CategoryDetail>(`/categories/${categoryId}`, {
      signal: options.signal,
    })
    .then((r) => r.data)
