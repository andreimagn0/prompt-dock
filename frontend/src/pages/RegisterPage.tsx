import { useState, type SubmitEvent} from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { getErrorMessage } from "@/api/api"
import { useAuth } from "@/context/AuthContext"
import { register } from "@/api/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShowcase } from "@/components/auth/AuthShowcase"


export default function RegisterPage() {
    const { user, login } = useAuth()
    const navigate = useNavigate()

    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [submitting, setSubmitting] = useState(false)

    if (user) return <Navigate to="/" replace />

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault()
        setError("")
        
        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        setSubmitting(true)
        try {
            await register({ username, email, password })
            await login(email, password)
            navigate("/")
        } catch (err) {
            setError(getErrorMessage(err))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="grid flex-1 md:grid-cols-2">
            <AuthShowcase className="md:order-last" />

            <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-md flex-col justify-center gap-4 p-6 md:p-10">
                <h1 className="text-4xl font-bold"> Join the community</h1>

                    <Label htmlFor="username" className="sr-only">Username</Label>
                    <Input
                        id="username"
                        placeholder="@username"
                        required minLength={3}
                        maxLength={30}
                        pattern="^[A-Za-z0-9_]+"
                        title="Letters, numbers, and underscores only"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <Label htmlFor="email" className="sr-only">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="email"
                        required value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <Label htmlFor="password" className="sr-only">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="password"
                        required value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <Label htmlFor="confirmPassword" className="sr-only">Confirm Password</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm password"
                        required value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />

                {error && (
                    <p className="text-sm text-destructive" role="alert">{error}</p>
                )}

                <Button type="submit" disabled={submitting} className="h-12 text-lg">
                    {submitting ? "Creating account..." : "Create Account"}
                </Button>

                <p className="font-bold">
                    Already a member? <Link to="/login" viewTransition className="text-primary underline">Log in</Link>
                </p>
            </form>
        </div>
    )
}