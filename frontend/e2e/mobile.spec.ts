import { test, expect } from "@playwright/test"
import { login } from "./helpers"

test.use({ viewport: { width: 390, height: 844 } })

test("menu button shows the links on mobile", async ({ page }) => {
    await page.goto("/")

    await expect(page.getByRole("link", { name: "Categories" })).not.toBeVisible()

    await page.getByRole("button", { name: "Open menu" }).click()
    await page.getByRole("link", { name: "Categories" }).click()

    await expect(page).toHaveURL("/categories")
})

test("logged in user sees their name in the mobile menu", async ({ page }) => {
    await login(page)

    await page.getByRole("button", { name: "Open menu" }).click()

    await expect(page.getByRole("link", { name: "alice" })).toBeVisible()
})