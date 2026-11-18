import api from "./api";

export type Skill = {
    id: number
    title: string
    description: string
    content: string
    current_version: number;
    parent_skill_id: number | null
    user_id: number
    category_id: number
    is_public: boolean
    average_rating: number | null
    created_at: string
    updated_at: string
}

export type SkillList = { 
    data: Skill[]; 
    page: number;
    limit: number;
    total: number
}

export const getSkills = (params?: { limit?: number; page?: number }) => 
    api.get<SkillList>("/skills", { params }).then((r) => r.data)
