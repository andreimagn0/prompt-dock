import api from "./api"

export type User = {
    id: number; 
    username: string;
    email: string;
    created_at: boolean;
}

export type Token = {
    access_token: string;
    token_type: string;
}

export const register = (data: {username: string; email: string; password: string}) => 
    api.post("/auth/register", data).then((r) => r.data)

export const login = (data: {identifier: string; password: string}) =>
    api.post<Token>("/auth/login", data).then((r) => r.data)

export const getMe = () => api.get<User>("/auth/me").then((r) => r.data)