import { Link } from "react-router-dom"
import { Menu } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/context/AuthContext"

function NavLinks() {
  const {user, logout } = useAuth()
  
  return (
    <>
      <Link to="/" className={buttonVariants({ variant: "ghost" })}>Home</Link>

      <Link to="/categories" className={buttonVariants({ variant: "ghost" })}>Categories</Link>

      {
      /* if user is logged in, show profile and logout buttons, else show login and register buttons
      */
      }
      { user ? (
          <>
            <Link to="/saved" className={buttonVariants({ variant: "ghost" })}>Saved</Link>

            <Link to="/profile" className={buttonVariants({ variant: "ghost" })}>{user.username}</Link>

            <Button variant="outline" onClick={logout}>Log out</Button>
          </>
        ) : (
          <>
            <Link to="/login" className={buttonVariants({ variant: "outline" })}>Log in</Link>

            <Link to="/register" className={buttonVariants()}>Sign up</Link>
          </>
        )
      }
    </>
  )
}

export function Navbar() {
  return (
    <header className="border-b">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="font-semibold">Prompt-Dock</Link>

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