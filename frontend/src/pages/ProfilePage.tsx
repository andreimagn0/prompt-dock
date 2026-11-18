import { useAuth } from "@/context/AuthContext"

export default function ProfilePage() {
    const { user } = useAuth()

    if (!user) return null

    return (
        <div className="mx-auto flex max-w-sm flex-col gap-2">
            <h1 className="text-2xl font-semibold">{user.username}</h1>

            <p className="text-muted-foreground">{user.email}</p>

            <p className="text-sm text-muted-foreground">Joined {new Date(user.created_at).toLocaleDateString()}</p>
        </div>
    )
}

