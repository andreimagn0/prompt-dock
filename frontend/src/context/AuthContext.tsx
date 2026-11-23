"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { getMe, login as loginRequest, type User } from '@/api/auth'
import { TOKEN_KEY } from '@/api/api'

type AuthContextType = {
    user: User | null
    loading: boolean
    login: (identifier: string, password: string) => Promise<void>;
    logout: () => void;
    setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    // On page load if a token is saved, find out who it belongs to
    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY)
        const request = token ? getMe() : Promise.resolve(null)
        
        request
            .then(setUser)
            .catch(() => localStorage.removeItem(TOKEN_KEY)) // token expired or invalid
            .finally(() => setLoading(false))
    }, [])

    async function login(identifier: string, password: string) {
        const { access_token } = await loginRequest({ identifier, password })
        localStorage.setItem(TOKEN_KEY, access_token)
        setUser(await getMe())
    }

    function logout() {
        localStorage.removeItem(TOKEN_KEY)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}