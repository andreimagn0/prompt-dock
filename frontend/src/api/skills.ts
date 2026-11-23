import api from "./api"

export type Skill = {
  id: number
  title: string
  description: string
  content: string
  current_version: number
  parent_skill_id: number | null
  user_id: number
  category_id: number
  is_public: boolean
  average_rating: number | null
  created_at: string
  updated_at: string
}

export type SkillList = {
  data: Skill[]
  page: number
  limit: number
  total: number
}

// "rating" and "trending" exist in the API spec but the backend rejects them for now
export type SkillSort = "newest" | "oldest" | "title"

export type SkillQueryParams = {
  search?: string
  category_id?: number
  sort?: SkillSort
  page?: number
  limit?: number
}

// Drop empty values so only filters that are actually set reach the API
function buildSkillParams(params: SkillQueryParams): SkillQueryParams {
  const query: SkillQueryParams = {}
  const search = params.search?.trim()

  if (search) query.search = search
  if (params.category_id !== undefined) query.category_id = params.category_id
  if (params.sort) query.sort = params.sort
  if (params.page !== undefined) query.page = params.page
  if (params.limit !== undefined) query.limit = params.limit

  return query
}

export const getSkills = (
  params: SkillQueryParams = {},
  options: { signal?: AbortSignal } = {}
) =>
  api
    .get<SkillList>("/skills", {
      params: buildSkillParams(params),
      signal: options.signal,
    })
    .then((r) => r.data)

// GET /skills/{id}. The shared client adds the JWT when one is saved, so owners
// can load their private skills; everyone else gets a 404 for those.
export const getSkill = (
  skillId: number,
  options: { signal?: AbortSignal } = {}
) =>
  api
    .get<Skill>(`/skills/${skillId}`, { signal: options.signal })
    .then((r) => r.data)
