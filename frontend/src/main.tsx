// core imports
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import "./index.css"

// context/provider imports
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/AuthContext"
import { ProtectedRoute } from "@/routes/ProtectedRoute"

// page and layout imports
import { AppShell } from "@/components/layout/AppShell"
import HomePage from "@/pages/HomePage"
import NotFoundPage from "@/pages/NotFoundPage"
import LoginPage from "@/pages/LoginPage"
import RegisterPage from "@/pages/RegisterPage"
import ProfilePage from "@/pages/ProfilePage"
import PublicProfilePage from "@/pages/PublicProfilePage"
import { Container } from "@/components/layout/Container"


const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/login", element: <LoginPage /> }, 
      { path: "/register", element: <RegisterPage /> },

      {
        element: <Container />,
        children: [
          { path: "/", element: <HomePage /> },
          { path: "/users/:userId", element: <PublicProfilePage /> },
          {
            element: <ProtectedRoute />,
            children: [
              { path: "/profile", element: <ProfilePage /> },
            ]
          },
          { path: "*", element: <NotFoundPage /> },
        ]
      }
    ]
  }
])

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
)
