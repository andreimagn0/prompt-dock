import { NavLink } from "react-router-dom"
import { Link, Menu } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

function NavLinks() {
    return (
        <>
            <Link to="/" className={buttonVariants({ variant: "ghost" })}>Home</Link>

            <Link to="/categories" className={buttonVariants({ variant: "ghost" })}>Categories</Link>

            <Link to="/saved" className={buttonVariants({ variant: "ghost" })}>Saved</Link>

            <NavLink to="/login" className={buttonVariants({ variant: "outline" })}>Log in</NavLink>

            <NavLink to="/register" className={buttonVariants({ variant: "outline" })}>Sign up</NavLink>

        </>
    )
}

export function Navbar() {
  return (
    <header className="border-b">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <NavLink to="/" className="font-semibold">Prompt-Dock</NavLink>

        <div className="hidden items-center gap-1 md:flex">
          <NavLinks />
        </div>

        <Sheet>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" />}>
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