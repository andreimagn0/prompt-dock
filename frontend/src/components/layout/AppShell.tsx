import { Navbar } from "./Navbar"
import { Toaster } from "@/components/ui/sonner"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col">
        {children}
      </main>
      <Toaster />
    </div>
  )
}
