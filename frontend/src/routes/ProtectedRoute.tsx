import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { LoadingState } from "@/components/common/LoadingState"

export function ProtectedRoute() {
    const { user, loading } = useAuth()

    if (loading) {
        return <LoadingState />
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}