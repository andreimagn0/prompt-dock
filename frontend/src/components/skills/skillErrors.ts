import axios from "axios"
import { getErrorMessage } from "@/api/api"

export function getErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined
}

export const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Log in again to continue."
export const NOT_OWNER_MESSAGE = "You can only change skills you own."
export const SKILL_MISSING_MESSAGE =
  "This skill no longer exists or isn't available."

// Friendly text for create, update and delete failures. Ownership and
// missing-skill errors get fixed wording; anything else (e.g. 400 "Category
// not found" or a 422 validation message) uses the API's own detail.
export function getSkillMutationError(error: unknown): string {
  switch (getErrorStatus(error)) {
    case 401:
      return SESSION_EXPIRED_MESSAGE
    case 403:
      return NOT_OWNER_MESSAGE
    case 404:
      return SKILL_MISSING_MESSAGE
    default:
      return getErrorMessage(error)
  }
}
