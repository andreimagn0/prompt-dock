import axios from "axios"

export const TOKEN_KEY = "token"

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL })

// Attach the saved token to every request. localStorage only exists in the
// browser, so skip it when this module runs during server rendering.
api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "Can't reach the server."
    const detail = error.response.data?.detail
    if (typeof detail === "string") return detail
    if (Array.isArray(detail)) return detail[0]?.msg ?? "Invalid input."
  }
  return "Something went wrong."

}

export default api