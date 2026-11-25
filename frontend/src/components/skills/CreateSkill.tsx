"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { toast } from "sonner"
import { getCategories, type Category } from "@/api/categories"
import { createSkill, type SkillInput } from "@/api/skills"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { LoadingState } from "@/components/common/LoadingState"
import { BackToSkills } from "./BackToSkills"
import { SkillForm } from "./SkillForm"

export function CreateSkill() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    getCategories({ signal: controller.signal })
      .then(setCategories)
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return
        setLoadFailed(true)
      })

    return () => controller.abort()
  }, [attempt])

  function retry() {
    setLoadFailed(false)
    setAttempt((n) => n + 1)
  }

  async function handleCreate(values: SkillInput) {
    const skill = await createSkill(values)
    toast.success("Skill created")
    router.push(`/skills/${skill.id}`)
  }

  const loading = !categories && !loadFailed

  return (
    <section className="space-y-6" aria-labelledby="new-skill-heading">
      <BackToSkills />
      <h1 id="new-skill-heading" className="text-2xl font-semibold">
        New skill
      </h1>

      <div aria-live="polite" aria-busy={loading} className="max-w-2xl">
        {loading && <LoadingState />}

        {loadFailed && (
          <ErrorState
            message="Categories couldn't be loaded, so the form isn't available yet. Please try again."
            onRetry={retry}
          />
        )}

        {categories && categories.length === 0 && (
          <EmptyState message="There are no categories yet, so skills can't be created." />
        )}

        {categories && categories.length > 0 && (
          <SkillForm
            categories={categories}
            submitLabel="Create skill"
            pendingLabel="Creating..."
            cancelHref="/"
            onSubmit={handleCreate}
          />
        )}
      </div>
    </section>
  )
}
