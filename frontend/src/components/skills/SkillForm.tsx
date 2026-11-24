"use client"

import { useMemo, useState, type FormEvent } from "react"
import Link from "next/link"
import type { Category } from "@/api/categories"
import type { SkillInput } from "@/api/skills"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getSkillMutationError } from "./skillErrors"

const TITLE_MAX_LENGTH = 100

type Field = "title" | "description" | "content" | "category"
type FieldErrors = Partial<Record<Field, string>>

// Checked in this order so focus lands on the first problem in the form
const FIELD_ORDER: Field[] = ["title", "description", "content", "category"]

const FIELD_IDS: Record<Field, string> = {
  title: "skill-title",
  description: "skill-description",
  content: "skill-content",
  category: "skill-category",
}

type Values = {
  title: string
  description: string
  content: string
  categoryId: string
  isPublic: boolean
}

function validate(values: Values): FieldErrors {
  const errors: FieldErrors = {}
  if (!values.title.trim()) errors.title = "Enter a title."
  else if (values.title.trim().length > TITLE_MAX_LENGTH)
    errors.title = `Keep the title to ${TITLE_MAX_LENGTH} characters or fewer.`
  if (!values.description.trim()) errors.description = "Enter a description."
  if (!values.content.trim()) errors.content = "Enter the skill content."
  if (!values.categoryId) errors.category = "Choose a category."
  return errors
}

type Props = {
  categories: Category[]
  initialValues?: SkillInput
  submitLabel: string
  pendingLabel: string
  cancelHref: string
  // Throw to report a failure; the form shows a readable message and stays
  // editable. On success the caller is expected to navigate away.
  onSubmit: (values: SkillInput) => Promise<void>
}

export function SkillForm({
  categories,
  initialValues,
  submitLabel,
  pendingLabel,
  cancelHref,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<Values>({
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    content: initialValues?.content ?? "",
    categoryId: initialValues ? String(initialValues.category_id) : "",
    isPublic: initialValues?.is_public ?? true,
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const categoryItems = useMemo(
    () => categories.map((c) => ({ value: String(c.id), label: c.name })),
    [categories]
  )

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function clearError(field: Field) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const errors = validate(values)
    setFieldErrors(errors)
    setFormError("")

    const firstInvalid = FIELD_ORDER.find((field) => errors[field])
    if (firstInvalid) {
      document.getElementById(FIELD_IDS[firstInvalid])?.focus()
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim(),
        content: values.content,
        category_id: Number(values.categoryId),
        is_public: values.isPublic,
      })
    } catch (err) {
      setFormError(getSkillMutationError(err))
      setSubmitting(false)
    }
  }

  // Wires a field to its error message for screen readers
  function errorProps(field: Field) {
    const message = fieldErrors[field]
    return {
      "aria-invalid": message ? true : undefined,
      "aria-describedby": message ? `${FIELD_IDS[field]}-error` : undefined,
    }
  }

  function fieldError(field: Field) {
    const message = fieldErrors[field]
    if (!message) return null
    return (
      <p id={`${FIELD_IDS[field]}-error`} className="text-sm text-destructive">
        {message}
      </p>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={submitting}
      className="flex flex-col gap-6"
    >
      <fieldset disabled={submitting} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor={FIELD_IDS.title}>Title</Label>
          <Input
            id={FIELD_IDS.title}
            required
            maxLength={TITLE_MAX_LENGTH}
            value={values.title}
            onChange={(e) => {
              update("title", e.target.value)
              clearError("title")
            }}
            {...errorProps("title")}
          />
          {fieldError("title")}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={FIELD_IDS.description}>Description</Label>
          <Textarea
            id={FIELD_IDS.description}
            required
            rows={2}
            value={values.description}
            onChange={(e) => {
              update("description", e.target.value)
              clearError("description")
            }}
            {...errorProps("description")}
          />
          {fieldError("description")}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={FIELD_IDS.content}>Content</Label>
          <Textarea
            id={FIELD_IDS.content}
            required
            rows={10}
            className="font-mono"
            value={values.content}
            onChange={(e) => {
              update("content", e.target.value)
              clearError("content")
            }}
            {...errorProps("content")}
          />
          {fieldError("content")}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={FIELD_IDS.category}>Category</Label>
          <Select
            items={categoryItems}
            value={values.categoryId || null}
            onValueChange={(value: string | null) => {
              update("categoryId", value ?? "")
              clearError("category")
            }}
          >
            <SelectTrigger
              id={FIELD_IDS.category}
              className="w-full md:w-64"
              {...errorProps("category")}
            >
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {categoryItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldError("category")}
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-medium">Visibility</legend>

          <div className="flex items-start gap-2">
            <input
              type="radio"
              id="skill-visibility-public"
              name="skill-visibility"
              className="mt-0.5 size-4 accent-primary"
              checked={values.isPublic}
              onChange={() => update("isPublic", true)}
              aria-describedby="skill-visibility-public-hint"
            />
            <div className="flex flex-col gap-1">
              <Label htmlFor="skill-visibility-public">Public</Label>
              <p
                id="skill-visibility-public-hint"
                className="text-sm text-muted-foreground"
              >
                Anyone can find and use this skill.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <input
              type="radio"
              id="skill-visibility-private"
              name="skill-visibility"
              className="mt-0.5 size-4 accent-primary"
              checked={!values.isPublic}
              onChange={() => update("isPublic", false)}
              aria-describedby="skill-visibility-private-hint"
            />
            <div className="flex flex-col gap-1">
              <Label htmlFor="skill-visibility-private">Private</Label>
              <p
                id="skill-visibility-private-hint"
                className="text-sm text-muted-foreground"
              >
                Only you can see this skill.
              </p>
            </div>
          </div>
        </fieldset>
      </fieldset>

      {formError && (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? pendingLabel : submitLabel}
        </Button>
        <Link
          href={cancelHref}
          className={buttonVariants({ variant: "outline" })}
          aria-disabled={submitting}
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
