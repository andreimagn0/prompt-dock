"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { getMe, login as loginRequest, logout as logoutRequest, type User } from '@/api/auth'

type AuthContextType = {
    user: User | null
    loading: boolean
    login: (identifier: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    // On page load, ask the backend who is logged in. 
    // The browser sends the cookie automatically.
    useEffect(() => {
        getMe()
            .then(setUser)
            .catch(() => setUser(null)) // no cookie, or it expired
            .finally(() => setLoading(false))
    }, [])

    async function login(identifier: string, password: string) {
        await loginRequest({ identifier, password }) // backend sets the cookie
        setUser(await getMe())
    }

    async function logout() {
        await logoutRequest().catch(() => {}) // backend deletes the cookie
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