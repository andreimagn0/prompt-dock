
import { fireEvent, render, screen, within } from "@testing-library/react"
import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios"
import { AuthProvider } from "@/context/AuthContext"
import { getSkill, type Skill } from "@/api/skills"
import { getUser } from "@/api/users"
import { getCategories } from "@/api/categories"
import { SkillDetail } from "@/components/skills/SkillDetail"

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/",
}))

jest.mock("@/api/auth", () => ({ login: jest.fn(), getMe: jest.fn() }))
jest.mock("@/api/skills", () => ({ getSkill: jest.fn() }))
jest.mock("@/api/users", () => ({ getUser: jest.fn() }))
jest.mock("@/api/categories", () => ({ getCategories: jest.fn() }))

jest.mock("@/api/community", () => ({
  getSavedSkills: jest.fn().mockResolvedValue([]),
  saveSkill: jest.fn(),
  unsaveSkill: jest.fn(),
  rateSkill: jest.fn(),
  getVersions: jest.fn().mockResolvedValue([]),
  createVersion: jest.fn(),
  createFork: jest.fn(),
  getComments: jest.fn().mockResolvedValue([]),
  createComment: jest.fn(),
  updateComment: jest.fn(),
  deleteComment: jest.fn(),
}))

const skill: Skill = {
  id: 7,
  title: "Budget my month",
  description: "Builds a monthly budget",
  content: "You are a budgeting assistant.",
  current_version: 3,
  parent_skill_id: null,
  user_id: 1,
  category_id: 2,
  is_public: true,
  average_rating: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-02-01T00:00:00Z",
}

function httpError(status: number) {
  const config = { headers: new AxiosHeaders() }
  const response = {
    status,
    statusText: "",
    data: { detail: "x" },
    headers: {},
    config,
  } as AxiosResponse

  return new AxiosError(
    "Request failed",
    "ERR_BAD_REQUEST",
    config,
    null,
    response
  )
}

function renderDetail() {
  return render(
    <AuthProvider>
      <SkillDetail skillId={7} />
    </AuthProvider>
  )
}

beforeEach(() => {
  jest.clearAllMocks()

  jest.mocked(getSkill).mockResolvedValue(skill)

  jest.mocked(getUser).mockResolvedValue({
    id: 1,
    username: "alice",
    created_at: "2026-01-01",
  })

  jest.mocked(getCategories).mockResolvedValue([
    { id: 1, name: "Writing", description: null },
    { id: 2, name: "Finance", description: null },
  ])
})

describe("SkillDetail", () => {
  it("shows the skill's information", async () => {
    renderDetail()

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Budget my month",
      })
    ).toBeTruthy()

    expect(screen.getByText("Builds a monthly budget")).toBeTruthy()
    expect(screen.getByText("You are a budgeting assistant.")).toBeTruthy()
    expect(screen.getByText("3")).toBeTruthy()
    expect(screen.getByText("Created")).toBeTruthy()
    expect(screen.getByText("Last updated")).toBeTruthy()
    expect(screen.queryByText("Private")).toBeNull()
    expect(getSkill).toHaveBeenCalledWith(7, expect.anything())
  })

  it("links to the owner's public profile", async () => {
    renderDetail()

    const owner = await screen.findByRole("link", { name: "@alice" })

    expect(owner.getAttribute("href")).toBe("/users/1")
    expect(getUser).toHaveBeenCalledWith("1")
  })

  it("shows the category name and links back to the category", async () => {
    renderDetail()

    const category = await screen.findByRole("link", {
      name: "Finance",
    })

    expect(category.getAttribute("href")).toBe("/categories/2")
  })

  it("falls back to IDs when the owner and category can't be loaded", async () => {
    jest.mocked(getUser).mockRejectedValue(httpError(500))
    jest.mocked(getCategories).mockRejectedValue(httpError(500))

    renderDetail()

    const owner = await screen.findByRole("link", { name: "User #1" })
    const category = screen.getByRole("link", { name: "Category #2" })

    expect(owner.getAttribute("href")).toBe("/users/1")
    expect(category.getAttribute("href")).toBe("/categories/2")
  })

  it("shows the private badge and average rating when present", async () => {
    jest.mocked(getSkill).mockResolvedValue({
      ...skill,
      is_public: false,
      average_rating: 4.25,
    })

    renderDetail()

    expect(await screen.findByText("Private")).toBeTruthy()

    expect(
      await screen.findByText(/Average rating: 4\.3 out of 5/)
    ).toBeTruthy()
  })

  it("shows the community features", async () => {
    renderDetail()

    const community = await screen.findByRole("region", {
      name: "Community",
    })

    for (const name of [
      "Rating",
      "Saved skills",
      "Version history",
      "Fork skill",
      "Comments",
    ]) {
      expect(
        within(community).getByRole("heading", {
          level: 3,
          name,
        })
      ).toBeTruthy()
    }
  })

  it("shows not found for a missing skill", async () => {
    jest.mocked(getSkill).mockRejectedValue(httpError(404))

    renderDetail()

    expect(
      await screen.findByRole("heading", {
        name: "Skill not found",
      })
    ).toBeTruthy()

    expect(screen.queryByRole("region", { name: "Community" })).toBeNull()
  })

  it("shows a retryable error when the skill fails to load", async () => {
    jest.mocked(getSkill).mockRejectedValueOnce(httpError(500))

    renderDetail()

    expect((await screen.findByRole("alert")).textContent).toContain(
      "This skill couldn't be loaded"
    )

    fireEvent.click(screen.getByRole("button", { name: "Try again" }))

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Budget my month",
      })
    ).toBeTruthy()

    expect(getSkill).toHaveBeenCalledTimes(2)
  })
})