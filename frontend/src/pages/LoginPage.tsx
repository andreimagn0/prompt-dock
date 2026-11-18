import { useState, type SubmitEvent} from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { getErrorMessage } from "@/api/api"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShowcase } from "@/components/auth/AuthShowcase"


export default function LoginPage() {
    const { user, login } = useAuth()
    const navigate = useNavigate()

    const [identifier, setIdentifier] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [submitting, setSubmitting] = useState(false)

    if (user) return <Navigate to="/" replace />

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault()
        setError("")
        setSubmitting(true)
        try {
            await login(identifier, password)
            navigate("/")
        } catch (err) {
            setError(getErrorMessage(err))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="grid flex-1 md:grid-cols-2">
            <AuthShowcase />

            <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-md flex-col justify-center gap-4 p-6 md:p-10">
                <h1 className="text-4xl font-bold">Welcome Back</h1>

                <Label htmlFor="identifier" className="sr-only">Username or email</Label>
                <Input 
                    id="identifier" 
                    placeholder="username or email" 
                    required value={identifier} 
                    onChange={(e) => setIdentifier(e.target.value)} />

                <Label htmlFor="password" className="sr-only">Password</Label>
                <Input 
                    id="password" 
                    type="password" 
                    placeholder="password" 
                    required value={password}
                    onChange={(e) => setPassword(e.target.value)} />

                {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

                <Button type="submit" disabled={submitting} className="h-12 text-lg">
                    {submitting ? "Logging in..." : "Log in"}
                </Button>

                <p className="font-bold">
                    Not a member? 
                    <Link to="/register" viewTransition className="text-primary underline">Sign up</Link>
                </p>
            </form>
        </div>
    )
}