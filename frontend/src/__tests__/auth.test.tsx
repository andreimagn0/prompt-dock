import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { AuthProvider } from "@/context/AuthContext"
import { getMe, login, register } from "@/api/auth"
import ProtectedLayout from "@/app/(main)/(protected)/layout"
import LoginPage from "@/app/(auth)/login/page"
import RegisterPage from "@/app/(auth)/register/page"

const mockReplace = jest.fn()

jest.mock("next/navigation", () => ({
    useRouter: () => ({ replace: mockReplace }),
}))

jest.mock("@/api/auth", () => ({
    login: jest.fn(),
    register: jest.fn(),
    getMe: jest.fn(),
}))

// The showcase panel on the login and sign up pages loads these; return empty data
jest.mock("@/api/categories", () => ({
    getCategories: jest.fn(() => Promise.resolve([])),
}))

jest.mock("@/api/skills", () => ({
    getSkills: jest.fn(() => Promise.resolve({ data: [], page: 1, limit: 2, total: 0 })),
}))

const alice = { id: 1, username: "alice", email: "alice@example.com", created_at: "2026-01-01" }

function renderWithAuth(page: React.ReactNode) {
    render(<AuthProvider>{page}</AuthProvider>)
}

beforeEach(() => {
    jest.clearAllMocks()
})

describe("ProtectedLayout", () => {
    it("sends logged-out users to /login", async () => {
        renderWithAuth(<ProtectedLayout><p>Secret page</p></ProtectedLayout>)

        await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/login"))
        expect(screen.queryByText("Secret page")).toBeNull()
    })

    it("shows the page to logged-in users", async () => {
        localStorage.setItem("token", "abc")
        jest.mocked(getMe).mockResolvedValue(alice)

        renderWithAuth(<ProtectedLayout><p>Secret page</p></ProtectedLayout>)

        expect(await screen.findByText("Secret page")).toBeTruthy()
        expect(mockReplace).not.toHaveBeenCalled()
    })
})

describe("LoginPage", () => {
    it("saves the token and goes home after logging in", async () => {
        jest.mocked(login).mockResolvedValue({ access_token: "abc", token_type: "bearer" })
        jest.mocked(getMe).mockResolvedValue(alice)
        renderWithAuth(<LoginPage />)

        fireEvent.change(screen.getByLabelText("Username or email"), { target: { value: "alice" } })
        fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } })
        fireEvent.click(screen.getByRole("button", { name: "Log in" }))

        await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"))
        expect(login).toHaveBeenCalledWith({ identifier: "alice", password: "password123" })
        expect(localStorage.getItem("token")).toBe("abc")
    })

    it("shows an error when logging in fails", async () => {
        jest.mocked(login).mockRejectedValue(new Error("Bad login"))
        renderWithAuth(<LoginPage />)

        fireEvent.change(screen.getByLabelText("Username or email"), { target: { value: "alice" } })
        fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong" } })
        fireEvent.click(screen.getByRole("button", { name: "Log in" }))

        expect(await screen.findByRole("alert")).toBeTruthy()
        expect(localStorage.getItem("token")).toBeNull()
    })
})

describe("RegisterPage", () => {
    it("stops when the passwords do not match", async () => {
        renderWithAuth(<RegisterPage />)

        fireEvent.change(screen.getByLabelText("Username"), { target: { value: "newuser" } })
        fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@example.com" } })
        fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } })
        fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "different" } })
        fireEvent.click(screen.getByRole("button", { name: "Create Account" }))

        expect(await screen.findByText("Passwords do not match")).toBeTruthy()
        expect(register).not.toHaveBeenCalled()
    })
})