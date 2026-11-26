import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { toast } from "sonner"
import { AuthProvider } from "@/context/AuthContext"
import { getMe, logout, type User } from "@/api/auth"
import { updateMe, deleteMe, getUser, getUserSkills } from "@/api/users"
import { getSavedSkills } from "@/api/community"
import { getCategories } from "@/api/categories"
import type { Skill } from "@/api/skills"
import ProfilePage from "@/app/(main)/(protected)/profile/page"
import PublicProfilePage from "@/app/(main)/users/[userId]/page"
import { apiError, deferred } from "./helpers"

jest.mock("next/navigation", () => ({
    useRouter: () => ({ replace: jest.fn() }),
    useParams: () => ({ userId: "1" }),
}))

jest.mock("sonner", () => ({
    toast: { success: jest.fn(), error: jest.fn() },
}))

jest.mock("@/api/auth", () => ({
    login: jest.fn(),
    logout: jest.fn(),
    getMe: jest.fn(),
}))

jest.mock("@/api/users", () => ({
    updateMe: jest.fn(),
    deleteMe: jest.fn(),
    getUser: jest.fn(),
    getUserSkills: jest.fn(),
}))

jest.mock("@/api/community", () => ({ getSavedSkills: jest.fn() }))
jest.mock("@/api/categories", () => ({ getCategories: jest.fn() }))

const alice = { id: 1, username: "alice", email: "alice@example.com", created_at: "2026-01-01" }

const budgetSkill: Skill = {
    id: 1, title: "Budget my month", description: "Builds a budget", content: "...",
    current_version: 1, parent_skill_id: null, user_id: 1, category_id: 3,
    is_public: true, average_rating: null, created_at: "2026-01-01", updated_at: "2026-01-01",
}

// Log in as alice and open the profile page
async function openProfile() {
    jest.mocked(getMe).mockResolvedValue(alice)
    render(<AuthProvider><ProfilePage /></AuthProvider>)
    await screen.findByRole("heading", { name: "@alice" })
}

async function openSettings() {
    await openProfile()
    fireEvent.click(screen.getByRole("button", { name: "Settings" }))
}

beforeEach(() => {
    jest.resetAllMocks()
    jest.mocked(logout).mockResolvedValue({} as never)
    jest.mocked(getUserSkills).mockResolvedValue({ data: [], page: 1, limit: 4, total: 0 })
    jest.mocked(getSavedSkills).mockResolvedValue([])
    jest.mocked(getCategories).mockResolvedValue([])
})

describe("ProfilePage settings", () => {
    it("sends the edited fields and current password", async () => {
        jest.mocked(updateMe).mockResolvedValue({ ...alice, username: "alice2", email: "alice2@example.com" })
        await openSettings()

        fireEvent.change(screen.getByLabelText("Username"), { target: { value: "alice2" } })
        fireEvent.change(screen.getByLabelText("Email"), { target: { value: "alice2@example.com" } })
        fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "password123" } })
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

        await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Profile updated"))
        expect(updateMe).toHaveBeenCalledTimes(1)
        expect(updateMe).toHaveBeenCalledWith({
            current_password: "password123",
            username: "alice2",
            email: "alice2@example.com",
        })
        expect(screen.getByRole("heading", { name: "@alice2" })).toBeTruthy()
        expect(screen.getByLabelText<HTMLInputElement>("Current password").value).toBe("")
    })

    it("shows the backend error when the update fails", async () => {
        jest.mocked(updateMe).mockRejectedValue(apiError("Incorrect password", 401))
        await openSettings()

        fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "wrong" } })
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

        expect((await screen.findByRole("alert")).textContent).toBe("Incorrect password")
        expect(toast.success).not.toHaveBeenCalled()
        expect(screen.getByRole("heading", { name: "@alice" })).toBeTruthy()
    })
})

describe("ProfilePage account deletion", () => {
    it("does nothing until the deletion is confirmed", async () => {
        await openSettings()

        fireEvent.click(screen.getByRole("button", { name: "Delete account" }))
        expect(await screen.findByRole("alertdialog")).toBeTruthy()
        expect(deleteMe).not.toHaveBeenCalled()

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

        await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull())
        expect(deleteMe).not.toHaveBeenCalled()
        expect(logout).not.toHaveBeenCalled()
    })

    it("deletes the account and logs out after confirming", async () => {
        jest.mocked(deleteMe).mockResolvedValue({} as never)
        await openSettings()

        fireEvent.click(screen.getByRole("button", { name: "Delete account" }))
        fireEvent.click(await screen.findByRole("button", { name: "Delete" }))

        await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Account deleted"))
        expect(deleteMe).toHaveBeenCalledTimes(1)
        expect(logout).toHaveBeenCalledTimes(1)
        // The page renders nothing once the user is cleared from auth state
        expect(screen.queryByRole("heading", { name: "@alice" })).toBeNull()
    })

    it("keeps the user logged in when deletion fails", async () => {
        jest.mocked(deleteMe).mockRejectedValue(apiError("Server error", 500))
        await openSettings()

        fireEvent.click(screen.getByRole("button", { name: "Delete account" }))
        fireEvent.click(await screen.findByRole("button", { name: "Delete" }))

        await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Server error"))
        expect(toast.success).not.toHaveBeenCalled()
        expect(logout).not.toHaveBeenCalled()
        // The dialog stays open so the user can retry or cancel
        expect(screen.getByRole("alertdialog")).toBeTruthy()
        await waitFor(() =>
            expect(screen.getByRole<HTMLButtonElement>("button", { name: "Delete" }).disabled).toBe(false)
        )
    })
})

describe("ProfilePage sign out", () => {
    it("logs out and clears the user", async () => {
        await openProfile()

        fireEvent.click(screen.getByRole("button", { name: "Sign out" }))

        await waitFor(() => expect(screen.queryByRole("heading", { name: "@alice" })).toBeNull())
        expect(logout).toHaveBeenCalledTimes(1)
    })
})

describe("ProfilePage pending states", () => {
    it("disables Save changes while the update is in flight", async () => {
        const request = deferred<User>()
        jest.mocked(updateMe).mockReturnValue(request.promise)
        await openSettings()

        fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "password123" } })
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

        const button = await screen.findByRole<HTMLButtonElement>("button", { name: "Saving..." })
        expect(button.disabled).toBe(true)

        await act(async () => request.resolve(alice))

        expect(screen.getByRole<HTMLButtonElement>("button", { name: "Save changes" }).disabled).toBe(false)
    })

    it("disables Delete while the deletion is in flight", async () => {
        const request = deferred<never>()
        jest.mocked(deleteMe).mockReturnValue(request.promise)
        await openSettings()

        fireEvent.click(screen.getByRole("button", { name: "Delete account" }))
        fireEvent.click(await screen.findByRole("button", { name: "Delete" }))

        const button = await screen.findByRole<HTMLButtonElement>("button", { name: "Deleting..." })
        expect(button.disabled).toBe(true)

        await act(async () => request.reject(apiError("Server error", 500)))

        expect(screen.getByRole<HTMLButtonElement>("button", { name: "Delete" }).disabled).toBe(false)
    })
})

describe("ProfilePage tabs", () => {
    it("switches between the overview and settings", async () => {
        await openSettings()
        expect(screen.getByRole("button", { name: "Settings" }).getAttribute("aria-current")).toBe("true")
        expect(screen.queryByRole("heading", { name: "Contributions" })).toBeNull()

        fireEvent.click(screen.getByRole("button", { name: "Profile" }))

        expect(await screen.findByRole("heading", { name: "Contributions" })).toBeTruthy()
        expect(screen.getByRole("button", { name: "Profile" }).getAttribute("aria-current")).toBe("true")
        expect(screen.queryByRole("heading", { name: "Edit profile" })).toBeNull()
    })
})

describe("ProfilePage overview", () => {
    it("shows empty states when there are no contributions or saved skills", async () => {
        await openProfile()

        expect(await screen.findByText("You haven't shared any skills yet.")).toBeTruthy()
        expect(screen.getByText("No saved skills yet.")).toBeTruthy()
        expect(screen.queryByRole("link", { name: "see all →" })).toBeNull()
    })

    it("lists contributions and saved skills with their categories", async () => {
        jest.mocked(getUserSkills).mockResolvedValue({ data: [budgetSkill], page: 1, limit: 4, total: 1 })
        jest.mocked(getSavedSkills).mockResolvedValue([
            { id: 9, user_id: 1, skill_id: 2, created_at: "2026-01-01", skill: { ...budgetSkill, id: 2, title: "Plan a trip", category_id: 4 } },
        ])
        jest.mocked(getCategories).mockResolvedValue([
            { id: 3, name: "Finance", description: null },
            { id: 4, name: "Travel", description: null },
        ])

        await openProfile()

        expect(await screen.findByRole("heading", { name: "Budget my month" })).toBeTruthy()
        expect(screen.getByRole("heading", { name: "Plan a trip" })).toBeTruthy()
        expect(screen.getByText("Finance")).toBeTruthy()
        expect(screen.getByText("Travel")).toBeTruthy()
        expect(getUserSkills).toHaveBeenCalledWith(1, { limit: 4 })
    })

    it("only shows the first four saved skills", async () => {
        jest.mocked(getSavedSkills).mockResolvedValue(
            [1, 2, 3, 4, 5].map((n) => ({
                id: n, user_id: 1, skill_id: n, created_at: "2026-01-01",
                skill: { ...budgetSkill, id: n, title: `Saved skill ${n}` },
            }))
        )

        await openProfile()

        expect(await screen.findByRole("heading", { name: "Saved skill 4" })).toBeTruthy()
        expect(screen.queryByRole("heading", { name: "Saved skill 5" })).toBeNull()
    })

    it("links to the full public profile when there are more contributions", async () => {
        jest.mocked(getUserSkills).mockResolvedValue({ data: [budgetSkill], page: 1, limit: 4, total: 7 })

        await openProfile()

        const link = await screen.findByRole("link", { name: "see all →" })
        expect(link.getAttribute("href")).toBe("/users/1")
    })

    it("shows an error when the profile sections fail to load", async () => {
        jest.mocked(getUserSkills).mockRejectedValue(apiError("Server down", 500))

        await openProfile()

        expect((await screen.findByRole("alert")).textContent).toContain("Server down")
    })
})

describe("PublicProfilePage", () => {
    it("shows the user and their skills", async () => {
        jest.mocked(getUser).mockResolvedValue({ id: 1, username: "alice", created_at: "2026-01-01" })
        jest.mocked(getUserSkills).mockResolvedValue({ data: [budgetSkill], page: 1, limit: 100, total: 1 })
        jest.mocked(getCategories).mockResolvedValue([{ id: 3, name: "Finance", description: null }])

        render(<PublicProfilePage />)

        expect(await screen.findByRole("heading", { name: "@alice" })).toBeTruthy()
        expect(getUser).toHaveBeenCalledWith("1")
        expect(screen.getByRole("heading", { name: "Contributions (1)" })).toBeTruthy()
        expect(screen.getByRole("heading", { name: "Budget my month" })).toBeTruthy()
        expect(screen.getByText("Builds a budget")).toBeTruthy()
        expect(screen.getByText("Finance")).toBeTruthy()
    })

    it("shows an empty state for a user with no public skills", async () => {
        jest.mocked(getUser).mockResolvedValue({ id: 1, username: "alice", created_at: "2026-01-01" })

        render(<PublicProfilePage />)

        expect(await screen.findByText("No public skills yet.")).toBeTruthy()
    })

    it("shows an error for a user that does not exist", async () => {
        jest.mocked(getUser).mockRejectedValue(apiError("User not found", 404))

        render(<PublicProfilePage />)

        expect((await screen.findByRole("alert")).textContent).toContain("User not found")
        expect(screen.queryByRole("heading", { name: "@alice" })).toBeNull()
    })
})
