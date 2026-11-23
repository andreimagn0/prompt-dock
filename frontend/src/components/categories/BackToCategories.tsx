import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"

export function BackToCategories() {
  return (
    <Link href="/categories" className={buttonVariants({ variant: "ghost" })}>
      <ArrowLeftIcon aria-hidden="true" />
      All categories
    </Link>
  )
}
