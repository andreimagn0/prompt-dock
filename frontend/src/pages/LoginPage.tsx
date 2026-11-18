import { useState, type SubmitEvent} from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { getErrorMessage } from "@/api/api"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


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
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-sm flex-col gap-4">
            <h1 className="text-2xl font-semibold"> Log in </h1>

            <div className="flex flex-col gap-2">
                <Label htmlFor="identifier">Username or email</Label>
                <Input id="identifier" required value={identifier} 
                onChange={(e) => setIdentifier(e.target.value)} />
            </div>

                <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={password} 
                onChange={(e) => setPassword(e.target.value)} />
            </div>

            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

            <Button type="submit" disabled={submitting}>
                {submitting ? "Logging in..." : "Log in"}
            </Button>

            <p className="text-sm text-muted-foreground">
                No account? <Link to="/register" className="underline">Sign up</Link>
            </p>
        </form>
    )
}