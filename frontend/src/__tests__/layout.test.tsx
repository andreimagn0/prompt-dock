import { render, screen, waitFor } from "@testing-library/react"
import { AuthProvider } from "@/context/AuthContext"
import { getMe } from "@/api/auth"
import ProtectedLayout from "@/app/(main)/(protected)/layout"

const mockReplace = jest.fn()

jest.mock("next/navigation", () => ({
    useRouter: () => ({ replace: mockReplace }),
}))

jest.mock("@/api/auth", () => ({
    login: jest.fn(),
    getMe: jest.fn(),
}))

function renderProtected() {
    render(
        <AuthProvider>
            <ProtectedLayout>
                <p>Secret page</p>
            </ProtectedLayout>
        </AuthProvider>
    )
}

describe("ProtetedLayout", () => {
    beforeEach(() => {
        jest.resetAllMocks()
    })

    it("sends logged-out users to /login", async () => {
        renderProtected()

        await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/login"))
        expect(screen.queryByText("Secret page")).toBeNull()
    })

    it("shows the page to logged-in users", async () => {
        localStorage.setItem("token", "abc")
        jest.mocked(getMe).mockResolvedValue({ id: 1, username: "alice", email: "a@b.com", created_at: "2026-01-01" })

        renderProtected()

        expect(await screen.findByText("Secret page")).toBeTruthy()
        expect(mockReplace).not.toHaveBeenCalled()
    })
})