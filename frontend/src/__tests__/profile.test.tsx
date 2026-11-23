import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { toast } from "sonner"
import { AuthProvider } from "@/context/AuthContext"
import { getMe } from "@/api/auth"
import { updateMe } from "@/api/users"
import ProfilePage from "@/app/(main)/(protected)/profile/page"

jest.mock("next/navigation", () => ({
    useRouter: () => ({ replace: jest.fn() }),
}))

jest.mock("sonner", () => ({
    toast: { success: jest.fn(), error: jest.fn() },
}))

jest.mock("@/api/auth", () => ({
    login: jest.fn(),
    getMe: jest.fn(),
}))

jest.mock("@/api/users", () => ({
    updateMe: jest.fn(),
    deleteMe: jest.fn(),
    getUserSkills: jest.fn(() => Promise.resolve({ data: [], page: 1, limit: 4, total: 0 })),
}))

jest.mock("@/api/community", () => ({
    getSavedSkills: jest.fn(() => Promise.resolve([])),
}))

jest.mock("@/api/categories", () => ({
    getCategories: jest.fn(() => Promise.resolve([])),
}))

const alice = { id: 1, username: "alice", email: "alice@example.com", created_at: "2026-01-01" }

// Log in as alice, open the profile page, and switch to the Settings tab
async function openSettings() {
    localStorage.setItem("token", "abc")
    jest.mocked(getMe).mockResolvedValue(alice)
    render(<AuthProvider><ProfilePage /></AuthProvider>)

    fireEvent.click(await screen.findByRole("button", { name: "Settings" }))
}

beforeEach(() => {
    jest.clearAllMocks()
})

describe("ProfilePage settings", () => {
    it("updates the profile", async () => {
        jest.mocked(updateMe).mockResolvedValue({ ...alice, username: "alice2" })
        await openSettings()

        fireEvent.change(screen.getByLabelText("Username"), { target: { value: "alice2" } })
        fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "password123" } })
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

        await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Profile updated"))
        expect(updateMe).toHaveBeenCalledWith({
            current_password: "password123",
            username: "alice2",
            email: "alice@example.com",
        })
        expect(screen.getByText("@alice2")).toBeTruthy()
    })

    it("shows an error when the update fails", async () => {
        jest.mocked(updateMe).mockRejectedValue(new Error("Wrong password"))
        await openSettings()

        fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "wrong" } })
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

        expect(await screen.findByRole("alert")).toBeTruthy()
        expect(toast.success).not.toHaveBeenCalled()
    })
})