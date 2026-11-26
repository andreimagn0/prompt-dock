import { test, expect } from "@playwright/test"
import { login } from "./helpers"

test("user can create and delete a skill", async ({ page }) => {
    const title = `Test skill ${Date.now()}`

    await login(page)
    await page.goto("/skills/new")

    await page.getByLabel("Title").fill(title)
    await page.getByLabel("Description").fill("Made by a UI test")
    await page.getByLabel("Content").fill("Prompt text")
    await page.getByLabel("Category").click()
    await page.getByRole("option", { name: "Writing & Communication" }).click()
    await page.getByRole("button", { name: "Create skill" }).click()

    await expect(page.getByRole("heading", { name: title })).toBeVisible()

    await page.getByRole("button", { name: "Delete skill" }).click()
    await page.getByRole("button", { name: "Delete", exact: true }).click()

    await expect(page).toHaveURL("/profile")
    await expect(page.getByText(title)).not.toBeVisible()
})

test("empty skill form shows errors", async ({ page }) => {
    await login(page)
    await page.goto("/skills/new")

    await page.getByRole("button", { name: "Create skill" }).click()

    await expect(page.getByText("Enter a title.")).toBeVisible()
    await expect(page.getByText("Choose a category.")).toBeVisible()
})