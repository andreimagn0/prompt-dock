import { expect, type Page } from "@playwright/test"

export async function login(page: Page, username = "alice") {
    await page.goto("/login")
    await page.getByLabel("Username or email").fill(username)
    await page.getByLabel("Password").fill("password123")
    await page.getByRole("button", { name: "Log in" }).click()
    await expect(page).toHaveURL("/")
}