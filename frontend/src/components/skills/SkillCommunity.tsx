
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { getErrorMessage } from "@/api/api"
import { createSkill, getSkill, type Skill } from "@/api/skills"
import {
  createFork,
  createVersion,
  getSavedSkills,
  getVersions,
  rateSkill,
  saveSkill,
  unsaveSkill,
  type SkillVersion,
} from "@/api/community"
import { Button } from "@/components/ui/button"
import { SkillComments } from "./SkillComments"

type Props = {
  skill: Skill
}

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" })

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : dateFormat.format(date)
}

export function SkillCommunity({ skill }: Props) {
  const { user } = useAuth()
  const router = useRouter()

  const [average, setAverage] = useState(skill.average_rating)
  const [rating, setRating] = useState(0)
  const [ratingPending, setRatingPending] = useState(false)
  const [ratingMessage, setRatingMessage] = useState("")

  const [saved, setSaved] = useState(false)
  const [savePending, setSavePending] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")

  const [versions, setVersions] = useState<SkillVersion[]>([])
  const [versionsLoading, setVersionsLoading] = useState(true)
  const [versionsError, setVersionsError] = useState("")
  const [versionPending, setVersionPending] = useState(false)
  const [versionMessage, setVersionMessage] = useState("")

  const [forkPending, setForkPending] = useState(false)
  const [forkMessage, setForkMessage] = useState("")

  useEffect(() => {
    let active = true

    getVersions(skill.id)
      .then((data) => {
        if (active) setVersions(data)
      })
      .catch(() => {
        if (active) setVersionsError("Unable to load version history.")
      })
      .finally(() => {
        if (active) setVersionsLoading(false)
      })

    return () => {
      active = false
    }
  }, [skill.id])

  useEffect(() => {
    if (!user) return

    let active = true

    getSavedSkills()
      .then((data) => {
        if (active) setSaved(data.some((item) => item.skill_id === skill.id))
      })
      .catch(() => {
        if (active) setSaveMessage("Unable to check saved status.")
      })

    return () => {
      active = false
    }
  }, [user, skill.id])

  async function submitRating() {
    if (!user || rating < 1 || rating > 5 || ratingPending) return

    setRatingPending(true)
    setRatingMessage("")

    try {
      await rateSkill(skill.id, { value: rating })
      setRatingMessage("Your rating was submitted.")
      const updated = await getSkill(skill.id)
      setAverage(updated.average_rating)
    } catch (error) {
      setRatingMessage(getErrorMessage(error))
    } finally {
      setRatingPending(false)
    }
  }

  async function toggleSave() {
    if (!user || savePending) return

    setSavePending(true)
    setSaveMessage("")

    try {
      if (saved) {
        await unsaveSkill(skill.id)
        setSaved(false)
        setSaveMessage("Skill removed from your saved skills.")
      } else {
        await saveSkill(skill.id)
        setSaved(true)
        setSaveMessage("Skill saved.")
      }
    } catch (error) {
      setSaveMessage(getErrorMessage(error))
    } finally {
      setSavePending(false)
    }
  }

  async function saveVersion() {
    if (!user || user.id !== skill.user_id || versionPending) return

    setVersionPending(true)
    setVersionMessage("")

    // A snapshot of the skill as it is now, so it gets the current version number
    const versionNumber = skill.current_version

    try {
      const created = await createVersion(skill.id, {
        version_number: versionNumber,
        title: skill.title,
        description: skill.description,
        content: skill.content,
      })

      setVersions((previous) =>
        [...previous, created].sort(
          (a, b) => b.version_number - a.version_number
        )
      )
      setVersionMessage(`Version ${versionNumber} saved.`)
    } catch (error) {
      setVersionMessage(getErrorMessage(error))
    } finally {
      setVersionPending(false)
    }
  }

  async function forkSkill() {
    if (!user || forkPending) return

    setForkPending(true)
    setForkMessage("")

    try {
      const copy = await createSkill({
        title: `${skill.title.slice(0, 93)} (Fork)`,
        description: skill.description,
        content: skill.content,
        category_id: skill.category_id,
        is_public: skill.is_public,
      })

      await createFork({
        original_skill_id: skill.id,
        forked_skill_id: copy.id,
      })

      setForkMessage("Fork created successfully.")
      router.push(`/skills/${copy.id}`)
    } catch (error) {
      setForkMessage(getErrorMessage(error))
    } finally {
      setForkPending(false)
    }
  }

  return (
    <section className="space-y-8" aria-labelledby="skill-community-heading">
      <h2 id="skill-community-heading" className="text-lg font-semibold">
        Community
      </h2>

      <section className="space-y-3 rounded-xl border p-4">
        <h3 className="font-semibold">Rating</h3>
        <p className="text-sm text-muted-foreground">
          Average rating:{" "}
          {average === null
            ? "Not rated yet"
            : `${average.toFixed(1)} out of 5`}
        </p>

        {user ? (
          <>
            <div className="flex items-center gap-1" role="group" aria-label="Choose a rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                  aria-pressed={rating === value}
                  onClick={() => setRating(value)}
                  className={`rounded p-1 text-2xl ${
                    rating >= value ? "text-yellow-500" : "text-muted-foreground"
                  }`}
                >
                  {rating >= value ? "★" : "☆"}
                </button>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={submitRating}
              disabled={rating < 1 || ratingPending}
            >
              {ratingPending ? "Submitting..." : "Submit rating"}
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Log in to rate this skill.
          </p>
        )}

        {ratingMessage && (
          <p className="text-sm" role="status">
            {ratingMessage}
          </p>
        )}
      </section>

      <section className="space-y-3 rounded-xl border p-4">
        <h3 className="font-semibold">Saved skills</h3>
        {user ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={toggleSave}
              disabled={savePending}
            >
              {savePending
                ? "Updating..."
                : saved
                  ? "Remove from saved skills"
                  : "Save skill"}
            </Button>
            <Link
              href="/profile"
              className="ml-2 text-sm text-primary underline underline-offset-4"
            >
              View profile
            </Link>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Log in to save this skill.
          </p>
        )}
        {saveMessage && (
          <p className="text-sm" role="status">
            {saveMessage}
          </p>
        )}
      </section>

      <section className="space-y-3 rounded-xl border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold">Version history</h3>
          {user?.id === skill.user_id && (
            <Button
              type="button"
              variant="outline"
              onClick={saveVersion}
              disabled={versionPending}
            >
              {versionPending ? "Saving..." : "Save current version"}
            </Button>
          )}
        </div>

        {versionsLoading && (
          <p className="text-sm text-muted-foreground">Loading versions...</p>
        )}

        {versionsError && (
          <p className="text-sm text-destructive" role="alert">
            {versionsError}
          </p>
        )}

        {!versionsLoading && !versionsError && versions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No saved versions yet.
          </p>
        )}

        {versions.length > 0 && (
          <ul className="space-y-3">
            {versions.map((version) => (
              <li key={version.id} className="rounded-md bg-muted p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    Version {version.version_number}: {version.title}
                  </span>
                  <time className="text-sm text-muted-foreground">
                    {formatDate(version.created_at)}
                  </time>
                </div>
                {version.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {version.description}
                  </p>
                )}
                {version.content && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm">
                      View version content
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap break-words rounded-md bg-background p-3 text-sm">
                      {version.content}
                    </pre>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}

        {versionMessage && (
          <p className="text-sm" role="status">
            {versionMessage}
          </p>
        )}
      </section>

      <section className="space-y-3 rounded-xl border p-4">
        <h3 className="font-semibold">Fork skill</h3>
        <p className="text-sm text-muted-foreground">
          Create your own copy of this skill that you can edit independently.
        </p>
        {user ? (
          <Button
            type="button"
            variant="outline"
            onClick={forkSkill}
            disabled={forkPending}
          >
            {forkPending ? "Creating fork..." : "Fork this skill"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Log in to fork this skill.
          </p>
        )}
        {forkMessage && (
          <p className="text-sm" role="status">
            {forkMessage}
          </p>
        )}
      </section>

      <SkillComments skillId={skill.id} />
    </section>
  )
}