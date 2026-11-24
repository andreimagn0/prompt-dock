import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { toast } from "sonner"
import { AuthProvider } from "@/context/AuthContext"
import { getMe } from "@/api/auth"
import { updateMe, deleteMe, getUser, getUserSkills } from "@/api/users"
import ProfilePage from "@/app/(main)/(protected)/profile/page"
import PublicProfilePage from "@/app/(main)/users/[userId]/page"

jest.mock("next/navigation", () => ({
    useRouter: () => ({ replace: jest.fn() }),
    useParams: () => ({ userId: "1" }),
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
    getUser: jest.fn(),
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

describe("ProfilePage", () => {
    it("deletes the account after confirming", async () => {
        jest.mocked(deleteMe).mockResolvedValue({} as never)
        await openSettings()

        fireEvent.click(screen.getByRole("button", { name: "Delete account" }))
        fireEvent.click(await screen.findByRole("button", { name: "Delete" }))

        await waitFor(() => expect(deleteMe).toHaveBeenCalled())
        expect(localStorage.getItem("token")).toBeNull()
        expect(toast.success).toHaveBeenCalledWith("Account deleted")
    })

    it("shows an error when the profile sections fail to load", async () => {
        jest.mocked(getUserSkills).mockRejectedValueOnce(new Error("Server down"))
        localStorage.setItem("token", "abc")
        jest.mocked(getMe).mockResolvedValue(alice)

        render(<AuthProvider><ProfilePage /></AuthProvider>)

        expect(await screen.findByRole("alert")).toBeTruthy()
    })
})

describe("PublicProfilePage", () => {
    it("shows the user and their skills", async () => {
        jest.mocked(getUser).mockResolvedValue({ id: 1, username: "alice", created_at: "2026-01-01" })
        jest.mocked(getUserSkills).mockResolvedValueOnce({
            data: [{
                id: 1, title: "Budget my month", description: "Builds a budget", content: "...",
                current_version: 1, parent_skill_id: null, user_id: 1, category_id: 1,
                is_public: true, average_rating: null, created_at: "2026-01-01", updated_at: "2026-01-01",
            }],
            page: 1, limit: 100, total: 1,
        })

        render(<PublicProfilePage />)

        expect(await screen.findByText("@alice")).toBeTruthy()
        expect(screen.getByText("Budget my month")).toBeTruthy()
    })

    it("shows an error for a user that does not exist", async () => {
        jest.mocked(getUser).mockRejectedValue(new Error("User not found"))

        render(<PublicProfilePage />)

        expect(await screen.findByRole("alert")).toBeTruthy()
    })
})