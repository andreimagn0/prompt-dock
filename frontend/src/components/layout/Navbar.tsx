"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type NavLinkProps = React.ComponentProps<typeof Link> & { href: string }

// Mirrors React Router's NavLink: marks the current route with aria-current.
function NavLink({ href, ...props }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <Link href={href} aria-current={isActive ? "page" : undefined} {...props} />
  )
}

function NavLinks() {
  return (
    <>
      <NavLink href="/" className={buttonVariants({ variant: "ghost" })}>
        Home
      </NavLink>

      <NavLink
        href="/categories"
        className={buttonVariants({ variant: "ghost" })}
      >
        Categories
      </NavLink>

      <NavLink href="/saved" className={buttonVariants({ variant: "ghost" })}>
        Saved
      </NavLink>

      <NavLink href="/login" className={buttonVariants({ variant: "outline" })}>
        Log in
      </NavLink>

      <NavLink
        href="/register"
        className={buttonVariants({ variant: "outline" })}
      >
        Sign up
      </NavLink>
    </>
  )
}

export function Navbar() {
  return (
    <header className="border-b">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold">
          Prompt-Dock
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <NavLinks />
        </div>

        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              />
            }
          >
            <Menu />
          </SheetTrigger>

          <SheetContent className="flex flex-col gap-2 p-4">
            <SheetTitle>Menu</SheetTitle>
            <NavLinks />
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
