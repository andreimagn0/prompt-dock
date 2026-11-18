import { useState, type SubmitEvent } from "react"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { updateMe } from "@/api/users"
import { getErrorMessage } from "@/api/api"
import type { User } from "@/api/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ProfilePage() {
    const { user } = useAuth()

    if (!user) return null

    return (
        <div className="mx-auto flex max-w-sm flex-col gap-2">
            <h1 className="text-2xl font-semibold">{user.username}</h1>

            <p className="text-muted-foreground">{user.email}</p>

            <p className="text-sm text-muted-foreground">Joined {new Date(user.created_at).toLocaleDateString()}</p>
            
            <EditProfileForm user={user} />
        </div>
    )
}

function EditProfileForm({ user }: { user: User }) {
    const { setUser } = useAuth()

    const [username, setUsername] = useState(user.username)
    const [email, setEmail] = useState(user.email)
    const [currentPassword, setCurrentPassword] = useState("")
    const [error, setError] = useState("")
    const [submitting, setSubmitting] = useState(false)

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault()
        setError("")
        setSubmitting(true)

        try { 
            const updated = await updateMe({ current_password: currentPassword, username, email })
            setUser(updated)
            setCurrentPassword("")
            toast.success("Profile updated")
        } catch (err) {
            setError(getErrorMessage(err))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Edit profile</h2>

        <div className="flex flex-col gap-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" required minLength={3} maxLength={30}
            pattern="[A-Za-z0-9_]+" title="Letters, numbers, and underscores only"
            value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>

        <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="flex flex-col gap-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input id="currentPassword" type="password" required value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>

        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

        <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save changes"}
        </Button>
        </form>
    )
}