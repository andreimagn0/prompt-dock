import api from "./api"
import type { Skill } from "./skills"

export type SavedSkill = {
    id: number
    user_id: number
    skill_id: number
    created_at: string
    skill: Skill
}

export const getSavedSkills = () => 
    api.get<SavedSkill[]>("/community/saved-skills").then((r) => r.data)