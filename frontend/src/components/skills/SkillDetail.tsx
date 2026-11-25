"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import axios from "axios"
import { PencilIcon, StarIcon } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { isNotFoundError } from "@/api/api"
import { getSkill, type Skill } from "@/api/skills"
import { ErrorState } from "@/components/common/ErrorState"
import { LoadingState } from "@/components/common/LoadingState"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { BackToSkills } from "./BackToSkills"
import { DeleteSkillButton } from "./DeleteSkillButton"
import { SkillNotFound } from "./SkillNotFound"
import { CategoryName } from "./CategoryName"
import { SkillAuthor } from "./SkillAuthor"
import { SkillCommunity } from "./SkillCommunity"

type Props = { skillId: number }

type LoadError = "not-found" | "failed" | null

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" })

// Show the raw value rather than crash if the API ever sends a bad timestamp
function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : dateFormat.format(date)
}

export function SkillDetail({ skillId }: Props) {
  const { user } = useAuth()
  const [skill, setSkill] = useState<Skill | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<LoadError>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    getSkill(skillId, { signal: controller.signal })
      .then((data) => {
        setSkill(data)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return
        // Keep backend error text out of the UI; map to friendly states
        setError(isNotFoundError(err) ? "not-found" : "failed")
        setLoading(false)
      })

    return () => controller.abort()
  }, [skillId, attempt])

  function retry() {
    setLoading(true)
    setError(null)
    setAttempt((n) => n + 1)
  }

  if (!loading && error === "not-found") return <SkillNotFound />

  return (
    <article className="space-y-6" aria-labelledby="skill-heading">
      <BackToSkills />

      <div aria-live="polite" aria-busy={loading} className="space-y-6">
        {loading && <LoadingState />}

        {!loading && error === "failed" && (
          <>
            <h1 id="skill-heading" className="text-2xl font-semibold">
              Skill
            </h1>
            <ErrorState
              message="This skill couldn't be loaded. Please try again."
              onRetry={retry}
            />
          </>
        )}

        {!loading && !error && skill && (
          <>
            <header className="space-y-3">
              <h1
                id="skill-heading"
                className="text-2xl font-semibold break-words"
              >
                {skill.title}
              </h1>
              <p className="break-words text-muted-foreground">
                {skill.description}
              </p>
              <SkillAuthor userId={skill.user_id} />

              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge
                  variant="secondary"
                  render={<Link href={`/categories/${skill.category_id}`} />}
                >
                  <CategoryName categoryId={skill.category_id} />
                </Badge>
                {!skill.is_public && <Badge variant="outline">Private</Badge>}
                {skill.average_rating !== null && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <StarIcon className="size-4" aria-hidden="true" />
                    <span>
                      <span className="sr-only">Average rating: </span>
                      {skill.average_rating.toFixed(1)}
                      <span className="sr-only"> out of 5</span>
                    </span>
                  </span>
                )}
              </div>

              {user?.id === skill.user_id && (
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/skills/${skill.id}/edit`}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    <PencilIcon aria-hidden="true" />
                    Edit skill
                  </Link>
                  <DeleteSkillButton
                    skillId={skill.id}
                    skillTitle={skill.title}
                  />
                </div>
              )}
            </header>

            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Version</dt>
                <dd>{skill.current_version}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd>
                  <time dateTime={skill.created_at}>
                    {formatDate(skill.created_at)}
                  </time>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last updated</dt>
                <dd>
                  <time dateTime={skill.updated_at}>
                    {formatDate(skill.updated_at)}
                  </time>
                </dd>
              </div>
            </dl>

            <Separator />

            <section
              className="space-y-3"
              aria-labelledby="skill-content-heading"
            >
              <h2 id="skill-content-heading" className="text-lg font-semibold">
                Skill content
              </h2>
              <pre className="rounded-xl bg-muted p-4 font-mono text-sm break-words whitespace-pre-wrap">
                {skill.content}
              </pre>
            </section>

            <SkillCommunity />
          </>
        )}
      </div>
    </article>
  )
}
