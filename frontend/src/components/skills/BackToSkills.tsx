import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"

export function BackToSkills() {
  return (
    <Link href="/" className={buttonVariants({ variant: "ghost" })}>
      <ArrowLeftIcon aria-hidden="true" />
      All skills
    </Link>
  )
}
