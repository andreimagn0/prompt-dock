import api from "./api"

export type Category = { 
    id: number; 
    name: string;
    description: string | null 
}

export const getCategories = () =>
  api.get<Category[]>("/categories").then((r) => r.data)