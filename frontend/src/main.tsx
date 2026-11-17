import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"

import "./index.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AppShell } from "@/components/layout/AppShell"
import HomePage from "@/pages/HomePage"
import NotFoundPage from "@/pages/NotFoundPage"


const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <HomePage /> }, 
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>
)
