import { useEffect, useState, type SubmitEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { getErrorMessage } from "@/api/api"
import type { User } from "@/api/auth"
import { deleteMe, getUserSkills, updateMe } from "@/api/users"
import { getSavedSkills, type SavedSkill } from "@/api/community"
import type { SkillList } from "@/api/skills"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SkillCard } from "@/components/skills/SkillCard"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { EmptyState } from "@/components/common/EmptyState"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type Tab = "profile" | "settings"

export default function ProfilePage() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [tab, setTab] = useState<Tab>("profile")

    if (!user) return null

    function handleSignOut() {
        navigate("/")
        logout()
    }

    const menuClass = (active: boolean) =>
        cn("justify-start text-xl font-bold md:text-2xl", active && "text-muted-foreground")

    return (
        <div className="flex flex-col gap-8">

            {/* Banner */}
            <section className="flex flex-col gap-6 rounded-3xl bg-secondary p-6 md:p-10">
                <Link to="/" className="self-start">← Home</Link>

                <div className="flex flex-col items-center gap-4 md:flex-row">
                    <div className="flex size-28 items-center justify-center rounded-full border bg-background text-5xl font-bold">
                        {user.username[0].toUpperCase()}
                    </div>

                    <h1 className="text-4xl font-bold">@{user.username}</h1>
                </div>
            </section>

            <div className="flex flex-col gap-8 md:flex-row">

                {/* Menu */}
                <nav className="flex justify-between md:w-44 md:flex-col md:justify-start" aria-label="Profile">
                    <Button
                        variant="ghost"
                        className={menuClass(tab === "profile")}
                        aria-current={tab === "profile"}
                        onClick={() => setTab("profile")}
                    >
                        Profile
                    </Button>

                    <Button
                        variant="ghost"
                        className={menuClass(tab === "settings")}
                        aria-current={tab === "settings"}
                        onClick={() => setTab("settings")}
                    >
                        Settings
                    </Button>

                    <Button variant="ghost" className={menuClass(false)} onClick={handleSignOut}>
                        Sign out
                    </Button>
                </nav>

                {/* Content */}
                <div className="flex-1">
                    {tab === "profile" ? (
                        <ProfileOverview userId={user.id} />
                    ) : (
                        <div className="flex max-w-md flex-col gap-8">
                            <EditProfileForm user={user} />
                            <DeleteAccount />
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}

function ProfileOverview({ userId }: { userId: number }) {
    const [contributions, setContributions] = useState<SkillList | null>(null)
    const [saved, setSaved] = useState<SavedSkill[] | null>(null)
    const [error, setError] = useState("")

    useEffect(() => {
        Promise.all([getUserSkills(userId, { limit: 4 }), getSavedSkills()])
            .then(([skills, savedSkills]) => {
                setContributions(skills)
                setSaved(savedSkills)
            })
            .catch((err) => setError(getErrorMessage(err)))
    }, [userId])

    if (error) return <ErrorState message={error} />
    if (!contributions || !saved) return <LoadingState />

    return (
        <div className="grid gap-8 md:grid-cols-2">

            <section className="flex flex-col gap-3">
                <h2 className="text-xl">Contributions</h2>

                {contributions.data.length === 0 ? (
                    <EmptyState message="You haven't shared any skills yet." />
                ) : (
                    contributions.data.map((s) => <SkillCard key={s.id} skill={s} />)
                )}

                {contributions.total > contributions.data.length && (
                    <Link to={`/users/${userId}`} className="text-primary">see all →</Link>
                )}
            </section>

            <section className="flex flex-col gap-3">
                <h2 className="text-xl">Saved</h2>

                {saved.length === 0 ? (
                    <EmptyState message="No saved skills yet." />
                ) : (
                    saved.slice(0, 4).map((s) => <SkillCard key={s.id} skill={s.skill} />)
                )}

                {saved.length > 4 && (
                    <Link to="/saved" className="text-primary">see all →</Link>
                )}
            </section>

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

function DeleteAccount() {
    const { logout } = useAuth()
    const navigate = useNavigate()
    const [deleting, setDeleting] = useState(false)

    async function handleDelete() {
        setDeleting(true)
        try {
            await deleteMe()
            navigate("/")
            logout()
            toast.success("Account deleted")
        } catch (err) {
            toast.error(getErrorMessage(err))
        } finally {
            setDeleting(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" />}>
                Delete account
            </AlertDialogTrigger>

            <AlertDialogContent>

                <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove all your data.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deleting}>
                        {deleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>

            </AlertDialogContent>
        </AlertDialog>
    )
}