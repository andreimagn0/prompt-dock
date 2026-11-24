import api from "./api"
import type { User } from "./auth"
import type { SkillList } from "./skills";

export type PublicUser = { id: number; username: string; created_at: string }

export type UpdateUserData = {
    current_password: string
    username?: string
    email?: string
}

export const updateMe = (data: UpdateUserData) => 
    api.put<User>("/users/me", data).then((res) => res.data)

export const deleteMe = () => api.delete("/users/me")

export const getUser = (id: string) =>
    api.get<PublicUser>(`/users/${id}`).then((r) => r.data)

export const getUserSkills = (
    id: number | string, 
    params?: { limit?: number }
) =>  api.get<SkillList>(`/users/${id}/skills`, {params }).then((r) => r.data)