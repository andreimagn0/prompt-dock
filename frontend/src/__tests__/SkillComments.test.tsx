"use client"

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { SkillComments } from "@/components/skills/SkillComments"
import { useAuth } from "@/context/AuthContext"
import type { User } from "@/api/auth"
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  type Comment,
} from "@/api/community"
import { getUser } from "@/api/users"

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
  }: {
    href: string
    children: React.ReactNode
  }) => <a href={href}>{children}</a>,
}))

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}))

jest.mock("@/api/community", () => ({
  getComments: jest.fn(),
  createComment: jest.fn(),
  updateComment: jest.fn(),
  deleteComment: jest.fn(),
}))

jest.mock("@/api/users", () => ({
  getUser: jest.fn(),
}))

const currentUser: User = {
  id: 1,
  username: "alice",
  email: "alice@example.com",
  created_at: "2026-01-01",
}

const comment1: Comment = {
  id: 10,
  skill_id: 7,
  user_id: 1,
  content: "My original comment",
  created_at: "2026-01-01T10:00:00Z",
  updated_at: "2026-01-01T10:00:00Z",
}

const comment2: Comment = {
  id: 20,
  skill_id: 7,
  user_id: 2,
  content: "Another user's comment",
  created_at: "2026-01-02T10:00:00Z",
  updated_at: "2026-01-02T10:00:00Z",
}

const newComment: Comment = {
  id: 30,
  skill_id: 7,
  user_id: 1,
  content: "A newly posted comment",
  created_at: "2026-01-03T10:00:00Z",
  updated_at: "2026-01-03T10:00:00Z",
}

function renderComments(user: User | null = currentUser) {
  jest.mocked(useAuth).mockReturnValue({
    user,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    setUser: jest.fn(),
  })

  return render(<SkillComments skillId={7} />)
}

beforeEach(() => {
  jest.resetAllMocks()

  jest.mocked(useAuth).mockReturnValue({
    user: currentUser,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    setUser: jest.fn(),
  })

  jest.mocked(getComments).mockResolvedValue([comment1, comment2])

  jest.mocked(getUser).mockImplementation(async (id: string) => ({
    id: Number(id),
    username: id === "1" ? "alice" : "bob",
    created_at: "2026-01-01",
  }))
})

describe("SkillComments", () => {
  it("loads and displays comments and usernames", async () => {
    renderComments()

    expect(screen.getByText("Loading comments...")).toBeTruthy()

    expect(await screen.findByText("My original comment")).toBeTruthy()
    expect(screen.getByText("Another user's comment")).toBeTruthy()
    expect(screen.getByRole("link", { name: "alice" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "bob" })).toBeTruthy()

    expect(getComments).toHaveBeenCalledWith(7)
  })

  it("shows an empty state when there are no comments", async () => {
    jest.mocked(getComments).mockResolvedValue([])

    renderComments()

    expect(
      await screen.findByText("No comments yet. Be the first to comment!")
    ).toBeTruthy()
  })

  it("shows an error if comments cannot be loaded", async () => {
    jest.mocked(getComments).mockRejectedValue(new Error("API error"))

    renderComments()

    expect(await screen.findByText("Couldn't load comments.")).toBeTruthy()
  })

  it("posts a comment and places it at the top of the list", async () => {
    jest.mocked(createComment).mockResolvedValue(newComment)

    renderComments()

    const textarea = await screen.findByRole("textbox", {
      name: "Write a comment",
    })

    fireEvent.change(textarea, {
      target: { value: "A newly posted comment" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Post comment" }))

    expect(await screen.findByText("A newly posted comment")).toBeTruthy()

    await waitFor(() => {
      expect(createComment).toHaveBeenCalledWith(7, {
        content: "A newly posted comment",
      })
    })

    const displayedComments = screen
      .getAllByText(
        /A newly posted comment|My original comment|Another user's comment/
      )
      .map((element) => element.textContent)

    expect(displayedComments[0]).toBe("A newly posted comment")
  })

  it("shows an error when posting fails", async () => {
    jest.mocked(createComment).mockRejectedValue(new Error("API error"))

    renderComments()

    const textarea = await screen.findByRole("textbox", {
      name: "Write a comment",
    })

    fireEvent.change(textarea, {
      target: { value: "This post will fail" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Post comment" }))

    expect(await screen.findByRole("alert")).toBeTruthy()
    expect(screen.getByText("Couldn't post your comment.")).toBeTruthy()
  })

  it("shows pending state while posting and prevents duplicate submissions", async () => {
    let resolvePost!: (comment: Comment) => void

    const pendingPost = new Promise<Comment>((resolve) => {
      resolvePost = resolve
    })

    jest.mocked(createComment).mockReturnValue(pendingPost)

    renderComments()

    const textarea = await screen.findByRole("textbox", {
      name: "Write a comment",
    })

    fireEvent.change(textarea, {
      target: { value: "Pending comment" },
    })

    const postButton = screen.getByRole("button", { name: "Post comment" })

    fireEvent.click(postButton)

    expect(
      await screen.findByRole("button", { name: "Posting..." })
    ).toBeTruthy()

    expect(
      screen
        .getByRole("textbox", { name: "Write a comment" })
        .hasAttribute("disabled")
    ).toBe(true)

    expect(createComment).toHaveBeenCalledTimes(1)

    resolvePost(newComment)

    expect(await screen.findByText("A newly posted comment")).toBeTruthy()
  })

  it("allows the owner to edit their own comment", async () => {
    jest.mocked(updateComment).mockResolvedValue({
      ...comment1,
      content: "Updated comment content",
    })

    renderComments()

    expect(await screen.findByText("My original comment")).toBeTruthy()

    const article = screen.getByText("My original comment").closest("article")
    expect(article).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Edit" }))

    const editTextarea = screen.getByRole("textbox", {
      name: "Edit comment",
    })

    fireEvent.change(editTextarea, {
      target: { value: "Updated comment content" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    expect(await screen.findByText("Updated comment content")).toBeTruthy()

    expect(updateComment).toHaveBeenCalledWith(10, {
      content: "Updated comment content",
    })
  })

  it("shows an error when editing fails", async () => {
    jest.mocked(updateComment).mockRejectedValue(new Error("API error"))

    renderComments()

    await screen.findByText("My original comment")

    fireEvent.click(screen.getByRole("button", { name: "Edit" }))

    fireEvent.change(screen.getByRole("textbox", { name: "Edit comment" }), {
      target: { value: "Failed edit" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    expect(await screen.findByText("Couldn't update your comment.")).toBeTruthy()
  })

  it("allows the owner to delete their comment", async () => {
    jest.mocked(deleteComment).mockResolvedValue(
      {} as Awaited<ReturnType<typeof deleteComment>>
    )

    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true)

    renderComments()

    expect(await screen.findByText("My original comment")).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))

    await waitFor(() => {
      expect(deleteComment).toHaveBeenCalledWith(10)
    })

    await waitFor(() => {
      expect(screen.queryByText("My original comment")).toBeNull()
    })

    confirmSpy.mockRestore()
  })

  it("shows an error when deleting fails", async () => {
    jest.mocked(deleteComment).mockRejectedValue(new Error("API error"))

    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true)

    renderComments()

    await screen.findByText("My original comment")

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))

    expect(await screen.findByText("Couldn't delete your comment.")).toBeTruthy()

    expect(screen.getByText("My original comment")).toBeTruthy()

    confirmSpy.mockRestore()
  })

  it("only displays edit and delete controls for the comment owner", async () => {
    renderComments({ ...currentUser, id: 1 })

    await screen.findByText("My original comment")

    const ownerComment = screen.getByText("My original comment").closest("article")
    const otherComment = screen
      .getByText("Another user's comment")
      .closest("article")

    expect(ownerComment).toBeTruthy()
    expect(otherComment).toBeTruthy()

    expect(ownerComment?.querySelectorAll("button")).toHaveLength(2)
    expect(otherComment?.querySelectorAll("button")).toHaveLength(0)
  })

  it("asks for login when the user is not authenticated", async () => {
    renderComments(null)

    expect(await screen.findByText("My original comment")).toBeTruthy()
    expect(screen.getByText("Log in to leave a comment.")).toBeTruthy()

    expect(
      screen.queryByRole("textbox", { name: "Write a comment" })
    ).toBeNull()
  })
})
