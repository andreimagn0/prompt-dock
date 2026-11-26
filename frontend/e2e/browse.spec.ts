import { test, expect } from "@playwright/test"

test("search finds matching skills", async ({ page }) => {
    await page.goto("/")

    await page.getByLabel("Search skills").fill("budget")
    await page.getByRole("button", { name: "Search" }).click()

    await expect(page.getByRole("link", { name: "Budget my month" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Study plan generator" })).not.toBeVisible()
})

test("category page shows its skills", async ({ page }) => {
    await page.goto("/categories")

    await page.getByRole("link", { name: "Coding & Technology" }).click()

    await expect(page.getByRole("heading", { name: "Coding & Technology" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Explain this error like I'm new" })).toBeVisible()
})

test("logged out user can view a skill but not edit it", async ({ page }) => {
    await page.goto("/")

    await page.getByRole("link", { name: "Study plan generator" }).click()

    await expect(page.getByRole("heading", { name: "Study plan generator" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Edit skill" })).not.toBeVisible()
})