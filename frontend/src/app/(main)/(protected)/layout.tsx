"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { LoadingState } from "@/components/common/LoadingState"

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login")
        }
    }, [loading, user, router])
    
    if (loading || !user) return <LoadingState />

    return children
}