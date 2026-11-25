import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { AuthProvider } from "@/context/AuthContext"
import { getMe, login, register, type Token, type User } from "@/api/auth"
import { getCategories } from "@/api/categories"
import { getSkills } from "@/api/skills"
import { Navbar } from "@/components/layout/Navbar"
import ProtectedLayout from "@/app/(main)/(protected)/layout"
import LoginPage from "@/app/(auth)/login/page"
import RegisterPage from "@/app/(auth)/register/page"
import { apiError, deferred } from "./helpers"

const mockReplace = jest.fn()

jest.mock("next/navigation", () => ({
    useRouter: () => ({ replace: mockReplace }),
    usePathname: () => "/",
}))

jest.mock("@/api/auth", () => ({
    login: jest.fn(),
    register: jest.fn(),
    getMe: jest.fn(),
}))

// The showcase panel on the login and sign up pages loads these
jest.mock("@/api/categories", () => ({ getCategories: jest.fn() }))
jest.mock("@/api/skills", () => ({ getSkills: jest.fn() }))

const alice = { id: 1, username: "alice", email: "alice@example.com", created_at: "2026-01-01" }
const token = { access_token: "abc", token_type: "bearer" }

function renderWithAuth(page: React.ReactNode) {
    render(<AuthProvider>{page}</AuthProvider>)
}

function fillLogin(identifier: string, password: string) {
    fireEvent.change(screen.getByLabelText("Username or email"), { target: { value: identifier } })
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } })
    fireEvent.click(screen.getByRole("button", { name: "Log in" }))
}

function fillRegister(fields: { username: string; email: string; password: string; confirm: string }) {
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: fields.username } })
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: fields.email } })
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: fields.password } })
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: fields.confirm } })
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }))
}

beforeEach(() => {
    jest.resetAllMocks()
    jest.mocked(getCategories).mockResolvedValue([])
    jest.mocked(getSkills).mockResolvedValue({ data: [], page: 1, limit: 2, total: 0 })
})

describe("AuthProvider", () => {
    it("loads the current user when a token is saved", async () => {
        localStorage.setItem("token", "abc")
        jest.mocked(getMe).mockResolvedValue(alice)

        renderWithAuth(<Navbar />)

        expect((await screen.findAllByRole("link", { name: "alice" })).length).toBeGreaterThan(0)
        expect(getMe).toHaveBeenCalledTimes(1)
        expect(localStorage.getItem("token")).toBe("abc")
    })

    it("does not ask the backend who is logged in without a token", async () => {
        renderWithAuth(<Navbar />)

        expect((await screen.findAllByRole("link", { name: "Log in" })).length).toBeGreaterThan(0)
        expect(getMe).not.toHaveBeenCalled()
    })

    it("clears a token the backend rejects", async () => {
        localStorage.setItem("token", "expired")
        jest.mocked(getMe).mockRejectedValue(apiError("Invalid token", 401))

        renderWithAuth(<Navbar />)

        expect((await screen.findAllByRole("link", { name: "Log in" })).length).toBeGreaterThan(0)
        expect(localStorage.getItem("token")).toBeNull()
    })

    it("logs out, removing the token and the user", async () => {
        localStorage.setItem("token", "abc")
        jest.mocked(getMe).mockResolvedValue(alice)
        renderWithAuth(<Navbar />)

        fireEvent.click((await screen.findAllByRole("button", { name: "Logout" }))[0])

        expect((await screen.findAllByRole("link", { name: "Log in" })).length).toBeGreaterThan(0)
        expect(screen.queryByRole("link", { name: "alice" })).toBeNull()
        expect(localStorage.getItem("token")).toBeNull()
    })
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

    it("waits for the user to load before deciding to redirect", async () => {
        const me = deferred<User>()
        localStorage.setItem("token", "abc")
        jest.mocked(getMe).mockReturnValue(me.promise)

        renderWithAuth(<ProtectedLayout><p>Secret page</p></ProtectedLayout>)

        expect(screen.getByLabelText("Loading")).toBeTruthy()
        expect(screen.queryByText("Secret page")).toBeNull()
        expect(mockReplace).not.toHaveBeenCalled()

        await act(async () => me.resolve(alice))

        expect(await screen.findByText("Secret page")).toBeTruthy()
        expect(mockReplace).not.toHaveBeenCalled()
    })
})

describe("LoginPage", () => {
    it("saves the token and goes home after logging in", async () => {
        jest.mocked(login).mockResolvedValue(token)
        jest.mocked(getMe).mockResolvedValue(alice)
        renderWithAuth(<LoginPage />)

        fillLogin("alice", "password123")

        await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"))
        expect(login).toHaveBeenCalledWith({ identifier: "alice", password: "password123" })
        expect(localStorage.getItem("token")).toBe("abc")
    })

    it("shows the backend error when logging in fails", async () => {
        jest.mocked(login).mockRejectedValue(apiError("Incorrect username or password", 401))
        renderWithAuth(<LoginPage />)

        fillLogin("alice", "wrong")

        expect((await screen.findByRole("alert")).textContent).toBe("Incorrect username or password")
        expect(localStorage.getItem("token")).toBeNull()
        expect(mockReplace).not.toHaveBeenCalled()
    })

    it("disables the button while the login request is in flight", async () => {
        const request = deferred<Token>()
        jest.mocked(login).mockReturnValue(request.promise)
        jest.mocked(getMe).mockResolvedValue(alice)
        renderWithAuth(<LoginPage />)

        fillLogin("alice", "password123")

        const button = await screen.findByRole<HTMLButtonElement>("button", { name: "Logging in..." })
        expect(button.disabled).toBe(true)

        await act(async () => request.resolve(token))

        await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"))
        expect(screen.getByRole<HTMLButtonElement>("button", { name: "Log in" }).disabled).toBe(false)
    })
})

describe("auth pages for logged-in users", () => {
    it.each([
        ["LoginPage", LoginPage],
        ["RegisterPage", RegisterPage],
    ])("%s sends an already logged-in user home", async (_name, Page) => {
        localStorage.setItem("token", "abc")
        jest.mocked(getMe).mockResolvedValue(alice)

        renderWithAuth(<Page />)

        await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"))
        expect(login).not.toHaveBeenCalled()
        expect(register).not.toHaveBeenCalled()
    })
})

describe("RegisterPage", () => {
    it("disables the button while the account is being created", async () => {
        const request = deferred<User>()
        jest.mocked(register).mockReturnValue(request.promise)
        jest.mocked(login).mockResolvedValue(token)
        jest.mocked(getMe).mockResolvedValue(alice)
        renderWithAuth(<RegisterPage />)

        fillRegister({ username: "alice", email: "alice@example.com", password: "password123", confirm: "password123" })

        const button = await screen.findByRole<HTMLButtonElement>("button", { name: "Creating account..." })
        expect(button.disabled).toBe(true)

        await act(async () => request.resolve(alice))

        await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"))
    })

    it("creates the account, logs in, and goes home", async () => {
        jest.mocked(register).mockResolvedValue(alice)
        jest.mocked(login).mockResolvedValue(token)
        jest.mocked(getMe).mockResolvedValue(alice)
        renderWithAuth(<RegisterPage />)

        fillRegister({ username: "alice", email: "alice@example.com", password: "password123", confirm: "password123" })

        await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"))
        expect(register).toHaveBeenCalledWith({ username: "alice", email: "alice@example.com", password: "password123" })
        expect(login).toHaveBeenCalledWith({ identifier: "alice@example.com", password: "password123" })
        expect(localStorage.getItem("token")).toBe("abc")
    })

    it("stops when the passwords do not match", async () => {
        renderWithAuth(<RegisterPage />)

        fillRegister({ username: "newuser", email: "new@example.com", password: "password123", confirm: "different" })

        expect((await screen.findByRole("alert")).textContent).toBe("Passwords do not match")
        expect(register).not.toHaveBeenCalled()
        expect(login).not.toHaveBeenCalled()
    })

    it("shows the backend error when registration fails", async () => {
        jest.mocked(register).mockRejectedValue(apiError("Username already taken"))
        renderWithAuth(<RegisterPage />)

        fillRegister({ username: "alice", email: "alice@example.com", password: "password123", confirm: "password123" })

        expect((await screen.findByRole("alert")).textContent).toBe("Username already taken")
        expect(login).not.toHaveBeenCalled()
        expect(localStorage.getItem("token")).toBeNull()
        expect(mockReplace).not.toHaveBeenCalled()
        expect(screen.getByRole<HTMLButtonElement>("button", { name: "Create Account" }).disabled).toBe(false)
    })
})
