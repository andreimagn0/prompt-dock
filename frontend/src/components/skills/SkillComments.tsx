"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { getComments, createComment, updateComment, deleteComment } from "@/api/community"
import type { Comment } from "@/api/community"
import { getUser } from "@/api/users"

type Props = {
  skillId: number
}

export function SkillComments({ skillId }: Props) {
  const { user } = useAuth()

  const [comments, setComments] = useState<Comment[]>([])
  const [usernames, setUsernames] = useState<Record<number, string>>({})
  const [content, setContent] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    async function loadComments() {
      try {
        setLoading(true)
        setError("")

        const data = await getComments(skillId)
        setComments(data)

        const userIds = [...new Set(data.map((comment) => comment.user_id))]

        const names: Record<number, string> = {}

        await Promise.all(
          userIds.map(async (id) => {
            try {
              const author = await getUser(String(id))
              names[id] = author.username
            } catch {
              names[id] = `User #${id}`
            }
          })
        )

        setUsernames(names)
      } catch {
        setError("Couldn't load comments.")
      } finally {
        setLoading(false)
      }
    }

    loadComments()
  }, [skillId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError("")

    if (!content.trim()) return

    try {
      const newComment = await createComment(skillId, {
        content: content.trim(),
      })

      setComments((previous) => [...previous, newComment])
      setContent("")

      // Load the username for the new comment if needed.
      if (!usernames[newComment.user_id]) {
        try {
          const author = await getUser(String(newComment.user_id))
          setUsernames((previous) => ({
            ...previous,
            [newComment.user_id]: author.username,
          }))
        } catch {
          setUsernames((previous) => ({
            ...previous,
            [newComment.user_id]: `User #${newComment.user_id}`,
          }))
        }
      }
    } catch {
      setSubmitError("Couldn't post your comment.")
    }
  }

  function startEditing(comment: Comment) {
    setEditingId(comment.id)
    setEditContent(comment.content)
    setSubmitError("")
  }

  async function handleEdit(commentId: number) {
    if (!editContent.trim()) return

    setSubmitError("")

    try {
      const updatedComment = await updateComment(commentId, {
        content: editContent.trim(),
      })

      setComments((previous) =>
        previous.map((comment) =>
          comment.id === commentId ? updatedComment : comment
        )
      )

      setEditingId(null)
      setEditContent("")
    } catch {
      setSubmitError("Couldn't update your comment.")
    }
  }

  async function handleDelete(commentId: number) {
    const confirmed = window.confirm("Are you sure you want to delete this comment?")
    if (!confirmed) return

    setSubmitError("")

    try {
      await deleteComment(commentId)

      setComments((previous) =>
        previous.filter((comment) => comment.id !== commentId)
      )
    } catch {
      setSubmitError("Couldn't delete your comment.")
    }
  }

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold">Comments</h3>

      {loading && <p className="text-sm text-muted-foreground">Loading comments...</p>}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && comments.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No comments yet. Be the first to comment!
        </p>
      )}

      {comments.map((comment) => {
        const isOwner = user && Number(user.id) === comment.user_id

        return (
          <article key={comment.id} className="space-y-2 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                href={`/users/${comment.user_id}`}
                className="font-medium hover:underline"
              >
                {usernames[comment.user_id] ?? `User #${comment.user_id}`}
              </Link>

              <span className="text-xs text-muted-foreground">
                {new Date(comment.created_at).toLocaleString()}
              </span>
            </div>

            {editingId === comment.id ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  maxLength={5000}
                  rows={4}
                  className="w-full rounded-md border bg-background p-3 text-sm"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(comment.id)}
                    disabled={!editContent.trim()}
                    className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
                  >
                    Save
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null)
                      setEditContent("")
                    }}
                    className="rounded-md border px-3 py-1.5 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="whitespace-pre-wrap text-sm">{comment.content}</p>

                {isOwner && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => startEditing(comment)}
                      className="text-sm text-primary hover:underline"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      className="text-sm text-destructive hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </article>
        )
      })}

      {user ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            maxLength={5000}
            rows={3}
            className="w-full rounded-md border bg-background p-3 text-sm"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {content.length}/5000
            </span>

            <button
              type="submit"
              disabled={!content.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
            >
              Post comment
            </button>
          </div>

          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Log in to leave a comment.
        </p>
      )}
    </section>
  )
}