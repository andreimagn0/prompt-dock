import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"
import { AuthProvider } from "@/context/AuthContext"
import { ProtectedRoute } from "./ProtectedRoute"

vi.mock("@/api/auth", () => ({
    login: vi.fn(),
    getMe: vi.fn(),
}))

function renderAt(path: string) {
    render(
        <AuthProvider>
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="/login" element={<p>Login page</p>} />
                    <Route element={<ProtectedRoute />}>
                        <Route path="/profile" element={<p>Profile page</p>} />
                    </Route>
                </Routes>
            </MemoryRouter>
        </AuthProvider>
    )
}

describe("ProtectedRoute", () => {
    it("sends logged-out users to /login", () => {
        renderAt("/profile")

        expect(screen.getByText("Login page")).toBeTruthy()
    })
})