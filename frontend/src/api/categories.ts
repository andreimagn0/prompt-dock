import api from "./api"

export type Category = {
  id: number
  name: string
  description: string | null
}

export const getCategories = (options: { signal?: AbortSignal } = {}) =>
  api
    .get<Category[]>("/categories", { signal: options.signal })
    .then((r) => r.data)
