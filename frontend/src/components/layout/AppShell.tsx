import { Outlet } from "react-router-dom"
import { Navbar } from "./Navbar"
import { Toaster } from "@/components/ui/sonner"

export function AppShell() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}