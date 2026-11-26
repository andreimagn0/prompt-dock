
import api from "./api"
import type { Skill } from "./skills"

export type SavedSkill = {
  id: number
  user_id: number
  skill_id: number
  created_at: string
  skill: Skill
}

export type Comment = {
  id: number
  skill_id: number
  user_id: number
  content: string
  created_at: string
  updated_at: string
}

export type CommentInput = {
  content: string
}

export type RatingInput = {
  value: number
}

export type Rating = {
  id: number
  skill_id: number
  user_id: number
  value: number
  created_at: string
  updated_at: string
}

export type SkillVersion = {
  id: number
  skill_id: number
  version_number: number
  title: string
  description: string | null
  content: string | null
  created_by: number
  created_at: string
}

export type SkillVersionInput = {
  version_number: number
  title: string
  description: string | null
  content: string | null
}

export type ForkInput = {
  original_skill_id: number
  forked_skill_id: number
}

export type Fork = {
  id: number
  original_skill_id: number
  forked_skill_id: number
  user_id: number
  created_at: string
}

export const getSavedSkills = () =>
  api.get<SavedSkill[]>("/community/saved-skills").then((r) => r.data)

export const saveSkill = (skillId: number) =>
  api
    .post<SavedSkill>(`/community/skills/${skillId}/save`)
    .then((r) => r.data)

export const unsaveSkill = (skillId: number) =>
  api.delete(`/community/skills/${skillId}/save`)

export const rateSkill = (skillId: number, data: RatingInput) =>
  api
    .put<Rating>(`/community/skills/${skillId}/rating`, data)
    .then((r) => r.data)

export const getVersions = (skillId: number) =>
  api
    .get<SkillVersion[]>(`/community/skills/${skillId}/versions`)
    .then((r) => r.data)

export const createVersion = (skillId: number, data: SkillVersionInput) =>
  api
    .post<SkillVersion>(`/community/skills/${skillId}/versions`, data)
    .then((r) => r.data)

export const createFork = (data: ForkInput) =>
  api.post<Fork>("/community/forks", data).then((r) => r.data)

export const getComments = (skillId: number) =>
  api
    .get<Comment[]>(`/community/skills/${skillId}/comments`)
    .then((r) => r.data)

export const createComment = (skillId: number, data: CommentInput) =>
  api
    .post<Comment>(`/community/skills/${skillId}/comments`, data)
    .then((r) => r.data)

export const updateComment = (commentId: number, data: CommentInput) =>
  api
    .put<Comment>(`/community/comments/${commentId}`, data)
    .then((r) => r.data)

export const deleteComment = (commentId: number) =>
  api.delete(`/community/comments/${commentId}`)
