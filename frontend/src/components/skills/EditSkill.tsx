"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axios from "axios"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { getCategories, type Category } from "@/api/categories"
import {
  getSkill,
  updateSkill,
  type Skill,
  type SkillInput,
} from "@/api/skills"
import { ErrorState } from "@/components/common/ErrorState"
import { LoadingState } from "@/components/common/LoadingState"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { BackToSkills } from "./BackToSkills"
import { DeleteSkillButton } from "./DeleteSkillButton"
import { SkillForm } from "./SkillForm"
import { SkillNotFound } from "./SkillNotFound"
import { SESSION_EXPIRED_MESSAGE, getErrorStatus } from "./skillErrors"

type Props = { skillId: number }

type LoadError = "unauthorized" | "forbidden" | "not-found" | "failed"

type LoadState =
  | { status: "loading" }
  | { status: "error"; error: LoadError }
  | { status: "ready"; skill: Skill; categories: Category[] }

function toLoadError(err: unknown): LoadError {
  switch (getErrorStatus(err)) {
    case 401:
      return "unauthorized"
    case 403:
      return "forbidden"
    case 404:
      return "not-found"
    default:
      return "failed"
  }
}

// Only send what changed: every PUT bumps the skill's version
function changedFields(skill: Skill, values: SkillInput): Partial<SkillInput> {
  const changes: Partial<SkillInput> = {}
  if (values.title !== skill.title) changes.title = values.title
  if (values.description !== skill.description)
    changes.description = values.description
  if (values.content !== skill.content) changes.content = values.content
  if (values.category_id !== skill.category_id)
    changes.category_id = values.category_id
  if (values.is_public !== skill.is_public) changes.is_public = values.is_public
  return changes
}

export function EditSkill({ skillId }: Props) {
  const router = useRouter()
  const { user } = useAuth()
  const [state, setState] = useState<LoadState>({ status: "loading" })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const options = { signal: controller.signal }

    Promise.all([getSkill(skillId, options), getCategories(options)])
      .then(([skill, categories]) => {
        setState({ status: "ready", skill, categories })
      })
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return
        setState({ status: "error", error: toLoadError(err) })
      })

    return () => controller.abort()
  }, [skillId, attempt])

  function retry() {
    setState({ status: "loading" })
    setAttempt((n) => n + 1)
  }

  const detailHref = `/skills/${skillId}`

  if (state.status === "error" && state.error === "not-found") {
    return <SkillNotFound />
  }

  // Public skills load for anyone, so ownership is checked here too; the API
  // would reject the save with a 403 anyway.
  const notOwner =
    state.status === "ready" && user !== null && state.skill.user_id !== user.id
  const error =
    state.status === "error" ? state.error : notOwner ? "forbidden" : null

  async function handleUpdate(values: SkillInput) {
    if (state.status !== "ready") return
    const changes = changedFields(state.skill, values)

    if (Object.keys(changes).length > 0) {
      await updateSkill(skillId, changes)
      toast.success("Skill updated")
    } else {
      toast.info("No changes to save")
    }
    router.push(detailHref)
  }

  return (
    <section className="space-y-6" aria-labelledby="edit-skill-heading">
      <BackToSkills />
      <h1 id="edit-skill-heading" className="text-2xl font-semibold">
        Edit skill
      </h1>

      <div
        aria-live="polite"
        aria-busy={state.status === "loading"}
        className="max-w-2xl space-y-6"
      >
        {state.status === "loading" && <LoadingState />}

        {error === "unauthorized" && (
          <>
            <ErrorState message={SESSION_EXPIRED_MESSAGE} />
            <Link
              href="/login"
              className={buttonVariants({ variant: "outline" })}
            >
              Log in
            </Link>
          </>
        )}

        {error === "forbidden" && (
          <>
            <ErrorState message="You can only edit skills you own." />
            <Link
              href={detailHref}
              className={buttonVariants({ variant: "outline" })}
            >
              View skill
            </Link>
          </>
        )}

        {error === "failed" && (
          <ErrorState
            message="This skill couldn't be loaded. Please try again."
            onRetry={retry}
          />
        )}

        {state.status === "ready" && !error && (
          <>
            <SkillForm
              categories={state.categories}
              initialValues={{
                title: state.skill.title,
                description: state.skill.description,
                content: state.skill.content,
                category_id: state.skill.category_id,
                is_public: state.skill.is_public,
              }}
              submitLabel="Save changes"
              pendingLabel="Saving..."
              cancelHref={detailHref}
              onSubmit={handleUpdate}
            />

            <Separator />

            <section
              className="space-y-3"
              aria-labelledby="delete-skill-heading"
            >
              <h2 id="delete-skill-heading" className="text-lg font-semibold">
                Delete this skill
              </h2>
              <p className="text-sm text-muted-foreground">
                Deleting removes the skill for everyone. This can&apos;t be
                undone.
              </p>
              <DeleteSkillButton
                skillId={skillId}
                skillTitle={state.skill.title}
              />
            </section>
          </>
        )}
      </div>
    </section>
  )
}
