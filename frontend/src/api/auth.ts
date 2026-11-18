import api from "./api"

export type User = {
    id: number; 
    username: string;
    email: string;
    created_at: string;
}

export type Token = {
    access_token: string;
    token_type: string;
}

export const register = (data: {username: string; email: string; password: string}) => 
    api.post<User>("/auth/register", data).then((r) => r.data)

export const login = (data: {identifier: string; password: string}) =>
    api.post<Token>("/auth/login", data).then((r) => r.data)

export const getMe = () => api.get<User>("/users/me").then((r) => r.data)