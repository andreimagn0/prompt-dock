import { Outlet } from "react-router-dom"

export function Container() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <Outlet />
    </div>
  )
}