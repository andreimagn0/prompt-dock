"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getUser } from "@/api/users"

type Props = { userId: number }

// Byline linking to the owner's public profile. Falls back to the user ID if
// the profile can't be loaded so the link still works.
export function SkillAuthor({ userId }: Props) {
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getUser(String(userId))
      .then((owner) => {
        if (active) setUsername(owner.username)
      })
      .catch(() => {
        // Keep the fallback label
      })
    return () => {
      active = false
    }
  }, [userId])

  return (
    <p className="text-sm text-muted-foreground">
      By{" "}
      <Link
        href={`/users/${userId}`}
        className="font-medium text-foreground underline-offset-4 hover:underline"
      >
        {username ? `@${username}` : `User #${userId}`}
      </Link>
    </p>
  )
}
