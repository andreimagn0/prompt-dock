import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { AxiosError, type AxiosResponse } from "axios"
import { toast } from "sonner"
import { AuthProvider } from "@/context/AuthContext"
import { getMe } from "@/api/auth"
import { getCategories } from "@/api/categories"
import {
  createSkill,
  deleteSkill,
  getSkill,
  updateSkill,
  type Skill,
} from "@/api/skills"
import NewSkillPage from "@/app/(main)/(protected)/skills/new/page"
import { EditSkill } from "@/components/skills/EditSkill"
import { SkillDetail } from "@/components/skills/SkillDetail"

const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => "/",
}))

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}))

jest.mock("@/api/auth", () => ({
  login: jest.fn(),
  getMe: jest.fn(),
}))

jest.mock("@/api/categories", () => ({
  getCategories: jest.fn(),
}))

jest.mock("@/api/skills", () => ({
  getSkill: jest.fn(),
  createSkill: jest.fn(),
  updateSkill: jest.fn(),
  deleteSkill: jest.fn(),
}))

const alice = {
  id: 1,
  username: "alice",
  email: "alice@example.com",
  created_at: "2026-01-01",
}

const categories = [
  { id: 1, name: "Writing", description: null },
  { id: 2, name: "Finance", description: null },
]

const aliceSkill: Skill = {
  id: 7,
  title: "Budget my month",
  description: "Builds a monthly budget",
  content: "You are a budgeting assistant.",
  current_version: 1,
  parent_skill_id: null,
  user_id: alice.id,
  category_id: 2,
  is_public: true,
  average_rating: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

// Build the error axios throws for a non-2xx response
function httpError(status: number, detail = "Request failed") {
  return new AxiosError(detail, "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    statusText: "",
    data: { detail },
    headers: {},
    config: {},
  } as AxiosResponse)
}

// Render inside AuthProvider with alice logged in, as the protected layout
// guarantees for these pages
function renderAsAlice(ui: React.ReactNode) {
  localStorage.setItem("token", "abc")
  jest.mocked(getMe).mockResolvedValue(alice)
  return render(<AuthProvider>{ui}</AuthProvider>)
}

async function chooseCategory(name: string) {
  fireEvent.click(screen.getByLabelText("Category"))
  fireEvent.click(await screen.findByRole("option", { name }))
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(getCategories).mockResolvedValue(categories)
})

describe("Create skill page", () => {
  it("renders the empty form once categories load", async () => {
    renderAsAlice(<NewSkillPage />)

    expect(
      await screen.findByRole("button", { name: "Create skill" })
    ).toBeTruthy()
    expect(screen.getByRole("heading", { name: "New skill" })).toBeTruthy()
    expect((screen.getByLabelText("Title") as HTMLInputElement).value).toBe("")
    expect(screen.getByLabelText("Description")).toBeTruthy()
    expect(screen.getByLabelText("Content")).toBeTruthy()
    expect(screen.getByLabelText("Category").textContent).toContain(
      "Choose a category"
    )
    expect((screen.getByLabelText("Public") as HTMLInputElement).checked).toBe(
      true
    )
    expect((screen.getByLabelText("Private") as HTMLInputElement).checked).toBe(
      false
    )
  })

  it("shows required-field errors and does not submit", async () => {
    renderAsAlice(<NewSkillPage />)

    // Whitespace alone doesn't count as a title
    fireEvent.change(await screen.findByLabelText("Title"), {
      target: { value: "   " },
    })
    fireEvent.click(screen.getByRole("button", { name: "Create skill" }))

    expect(await screen.findByText("Enter a title.")).toBeTruthy()
    expect(screen.getByText("Enter a description.")).toBeTruthy()
    expect(screen.getByText("Enter the skill content.")).toBeTruthy()
    expect(screen.getByText("Choose a category.")).toBeTruthy()
    expect(screen.getByLabelText("Title").getAttribute("aria-invalid")).toBe(
      "true"
    )
    expect(document.activeElement).toBe(screen.getByLabelText("Title"))
    expect(createSkill).not.toHaveBeenCalled()
  })

  it("creates the skill with the entered values and opens it", async () => {
    jest.mocked(createSkill).mockResolvedValue({ ...aliceSkill, id: 42 })
    renderAsAlice(<NewSkillPage />)

    fireEvent.change(await screen.findByLabelText("Title"), {
      target: { value: "  Draft an email  " },
    })
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Writes polite emails" },
    })
    fireEvent.change(screen.getByLabelText("Content"), {
      target: { value: "You write emails." },
    })
    await chooseCategory("Writing")
    fireEvent.click(screen.getByLabelText("Private"))
    fireEvent.click(screen.getByRole("button", { name: "Create skill" }))

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/skills/42"))
    expect(createSkill).toHaveBeenCalledWith({
      title: "Draft an email",
      description: "Writes polite emails",
      content: "You write emails.",
      category_id: 1,
      is_public: false,
    })
    expect(toast.success).toHaveBeenCalledWith("Skill created")
  })

  it("shows the API error and keeps the form editable", async () => {
    jest
      .mocked(createSkill)
      .mockRejectedValue(httpError(400, "Category not found"))
    renderAsAlice(<NewSkillPage />)

    fireEvent.change(await screen.findByLabelText("Title"), {
      target: { value: "Draft an email" },
    })
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Writes polite emails" },
    })
    fireEvent.change(screen.getByLabelText("Content"), {
      target: { value: "You write emails." },
    })
    await chooseCategory("Writing")
    fireEvent.click(screen.getByRole("button", { name: "Create skill" }))

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Category not found"
    )
    expect(mockPush).not.toHaveBeenCalled()
    expect(
      (
        screen.getByRole("button", {
          name: "Create skill",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(false)
  })

  it("shows a retryable error when categories fail to load", async () => {
    jest.mocked(getCategories).mockRejectedValueOnce(httpError(500))
    renderAsAlice(<NewSkillPage />)

    expect(
      await screen.findByText(/Categories couldn't be loaded/)
    ).toBeTruthy()
    expect(screen.queryByLabelText("Title")).toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(
      await screen.findByRole("button", { name: "Create skill" })
    ).toBeTruthy()
  })
})

describe("Edit skill page", () => {
  it("shows a loading state instead of an empty form", async () => {
    jest.mocked(getSkill).mockReturnValue(new Promise(() => {}))
    renderAsAlice(<EditSkill skillId={7} />)

    // Let the auth check settle; the skill request is still pending
    await act(async () => {})

    expect(screen.getByLabelText("Loading")).toBeTruthy()
    expect(screen.queryByLabelText("Title")).toBeNull()
    expect(screen.queryByRole("button", { name: "Save changes" })).toBeNull()
  })

  it("pre-fills the form and saves only the changed fields", async () => {
    jest.mocked(getSkill).mockResolvedValue(aliceSkill)
    jest.mocked(updateSkill).mockResolvedValue({
      ...aliceSkill,
      title: "Plan my month",
    })
    renderAsAlice(<EditSkill skillId={7} />)

    const title = (await screen.findByLabelText("Title")) as HTMLInputElement
    expect(getSkill).toHaveBeenCalledWith(7, expect.anything())
    expect(title.value).toBe("Budget my month")
    expect(
      (screen.getByLabelText("Description") as HTMLTextAreaElement).value
    ).toBe("Builds a monthly budget")
    expect(
      (screen.getByLabelText("Content") as HTMLTextAreaElement).value
    ).toBe("You are a budgeting assistant.")
    expect(screen.getByLabelText("Category").textContent).toContain("Finance")
    expect((screen.getByLabelText("Public") as HTMLInputElement).checked).toBe(
      true
    )

    fireEvent.change(title, { target: { value: "Plan my month" } })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/skills/7"))
    expect(updateSkill).toHaveBeenCalledWith(7, { title: "Plan my month" })
    expect(toast.success).toHaveBeenCalledWith("Skill updated")
  })

  it("shows not found for a missing skill (404)", async () => {
    jest.mocked(getSkill).mockRejectedValue(httpError(404, "Skill not found"))
    renderAsAlice(<EditSkill skillId={99} />)

    expect(
      await screen.findByRole("heading", { name: "Skill not found" })
    ).toBeTruthy()
    expect(screen.queryByLabelText("Title")).toBeNull()
  })

  it("asks the user to log in again when the session expired (401)", async () => {
    jest.mocked(getSkill).mockRejectedValue(httpError(401, "Not authenticated"))
    renderAsAlice(<EditSkill skillId={7} />)

    expect(await screen.findByText(/Your session has expired/)).toBeTruthy()
    expect(
      screen.getByRole("link", { name: "Log in" }).getAttribute("href")
    ).toBe("/login")
    expect(screen.queryByLabelText("Title")).toBeNull()
  })

  it("blocks editing someone else's skill (403)", async () => {
    jest.mocked(getSkill).mockResolvedValue({ ...aliceSkill, user_id: 2 })
    renderAsAlice(<EditSkill skillId={7} />)

    expect(
      await screen.findByText("You can only edit skills you own.")
    ).toBeTruthy()
    expect(screen.queryByLabelText("Title")).toBeNull()
    expect(screen.queryByRole("button", { name: "Delete skill" })).toBeNull()
  })

  it("shows the ownership error when the save is rejected (403)", async () => {
    jest.mocked(getSkill).mockResolvedValue(aliceSkill)
    jest
      .mocked(updateSkill)
      .mockRejectedValue(httpError(403, "Not the owner of this skill"))
    renderAsAlice(<EditSkill skillId={7} />)

    fireEvent.change(await screen.findByLabelText("Title"), {
      target: { value: "Plan my month" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect((await screen.findByRole("alert")).textContent).toBe(
      "You can only change skills you own."
    )
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("explains when the skill was deleted before saving (404)", async () => {
    jest.mocked(getSkill).mockResolvedValue(aliceSkill)
    jest
      .mocked(updateSkill)
      .mockRejectedValue(httpError(404, "Skill not found"))
    renderAsAlice(<EditSkill skillId={7} />)

    fireEvent.change(await screen.findByLabelText("Title"), {
      target: { value: "Plan my month" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect((await screen.findByRole("alert")).textContent).toBe(
      "This skill no longer exists or isn't available."
    )
  })
})

describe("Delete skill", () => {
  async function openDeleteDialog() {
    jest.mocked(getSkill).mockResolvedValue(aliceSkill)
    renderAsAlice(<EditSkill skillId={7} />)
    fireEvent.click(await screen.findByRole("button", { name: "Delete skill" }))
    await screen.findByRole("alertdialog")
  }

  it("asks for confirmation and does nothing when cancelled", async () => {
    await openDeleteDialog()

    expect(screen.getByText("Delete “Budget my month”?")).toBeTruthy()
    expect(deleteSkill).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull())
    expect(deleteSkill).not.toHaveBeenCalled()
  })

  it("deletes after confirming and redirects", async () => {
    jest.mocked(deleteSkill).mockResolvedValue({ message: "Skill deleted" })
    await openDeleteDialog()

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/profile"))
    expect(deleteSkill).toHaveBeenCalledWith(7)
    expect(toast.success).toHaveBeenCalledWith("Skill deleted")
  })

  it("shows an error when the user doesn't own the skill (403)", async () => {
    jest
      .mocked(deleteSkill)
      .mockRejectedValue(httpError(403, "Not the owner of this skill"))
    await openDeleteDialog()

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))

    expect((await screen.findByRole("alert")).textContent).toBe(
      "You can only change skills you own."
    )
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it("shows an error when the skill is already gone (404)", async () => {
    jest
      .mocked(deleteSkill)
      .mockRejectedValue(httpError(404, "Skill not found"))
    await openDeleteDialog()

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))

    expect((await screen.findByRole("alert")).textContent).toBe(
      "This skill no longer exists or isn't available."
    )
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it("shows edit and delete actions on the detail page only to the owner", async () => {
    jest.mocked(getSkill).mockResolvedValue(aliceSkill)
    const { unmount } = renderAsAlice(<SkillDetail skillId={7} />)

    expect(
      (await screen.findByRole("link", { name: "Edit skill" })).getAttribute(
        "href"
      )
    ).toBe("/skills/7/edit")
    expect(screen.getByRole("button", { name: "Delete skill" })).toBeTruthy()
    unmount()

    jest.mocked(getSkill).mockResolvedValue({ ...aliceSkill, user_id: 2 })
    renderAsAlice(<SkillDetail skillId={7} />)

    expect(
      await screen.findByRole("heading", { name: "Budget my month" })
    ).toBeTruthy()
    expect(screen.queryByRole("link", { name: "Edit skill" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Delete skill" })).toBeNull()
  })
})
