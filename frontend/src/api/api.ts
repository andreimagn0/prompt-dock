import axios from "axios"

export const TOKEN_KEY = "token"

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL })

// Attach the aved token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
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