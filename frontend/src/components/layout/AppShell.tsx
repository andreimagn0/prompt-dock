import { Outlet } from "react-router-dom"
import { Navbar } from "./Navbar"
import { Toaster } from "@/components/ui/sonner"

export function AppShell() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}