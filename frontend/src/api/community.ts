
import api from "./api"
import type { Skill } from "./skills"

// -------------------- Saved Skills --------------------

export type SavedSkill = {
  id: number
  user_id: number
  skill_id: number
  created_at: string
  skill: Skill
}

export const getSavedSkills = () =>
  api.get<SavedSkill[]>("/community/saved-skills").then((r) => r.data)

// -------------------- Comments --------------------

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

// GET: Retrieve all comments for a skill
export const getComments = (skillId: number) =>
  api
    .get<Comment[]>(`/community/skills/${skillId}/comments`)
    .then((r) => r.data)

// POST: Create a new comment
export const createComment = (skillId: number, data: CommentInput) =>
  api
    .post<Comment>(`/community/skills/${skillId}/comments`, data)
    .then((r) => r.data)

// PUT: Update an existing comment
export const updateComment = (commentId: number, data: CommentInput) =>
  api
    .put<Comment>(`/community/comments/${commentId}`, data)
    .then((r) => r.data)

// DELETE: Delete an existing comment
export const deleteComment = (commentId: number) =>
  api.delete(`/community/comments/${commentId}`)
