"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { deleteSkill } from "@/api/skills"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { getSkillMutationError } from "./skillErrors"

type Props = {
  skillId: number
  skillTitle: string
  // Where to go once the skill is gone; its own pages would now 404
  redirectTo?: string
}

export function DeleteSkillButton({
  skillId,
  skillTitle,
  redirectTo = "/profile",
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  function handleOpenChange(next: boolean) {
    // Keep the dialog up until the request settles
    if (deleting) return
    setOpen(next)
    if (!next) setError("")
  }

  async function handleDelete() {
    setDeleting(true)
    setError("")
    try {
      await deleteSkill(skillId)
      toast.success("Skill deleted")
      setOpen(false)
      // replace so Back doesn't return to the deleted skill
      router.replace(redirectTo)
    } catch (err) {
      setError(getSkillMutationError(err))
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        <Trash2Icon aria-hidden="true" />
        Delete skill
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="break-words">
            Delete &ldquo;{skillTitle}&rdquo;?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the skill. Forks made from it stay, but
            lose their link to it. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
