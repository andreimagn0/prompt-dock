import { useState, type SubmitEvent} from "react"
import { Link, useNavigate } from "react-router-dom"
import { getErrorMessage } from "@/api/api"
import { useAuth } from "@/context/AuthContext"
import { register } from "@/api/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"



export default function RegisterPage() {
    const { login } = useAuth()
    const navigate = useNavigate()

    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [submitting, setSubmitting] = useState(false)

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
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-sm flex-col gap-4">
            <h1 className="text-2xl font-semibold"> Sign up</h1>

            <div className="flex flex-col gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                    id="username"
                    required minLength={3}
                    maxLength={30}
                    pattern="^[A-Za-z0-9_]+"
                    title="Letters, numbers, and underscores only"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                    id="confirmPassword"
                    type="password"
                    required value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
            </div>

            {error && (
                <p className="text-sm text-destructive" role="alert">{error}</p>
            )}

            <Button type="submit" disabled={submitting}>
                {submitting ? "Creating account..." : "Sign up"}
            </Button>

            <p className="text-sm text-muted-foreground">
                Already have an account? <Link to="/login" className="underline">Log in</Link>
            </p>
        </form>
    )
}