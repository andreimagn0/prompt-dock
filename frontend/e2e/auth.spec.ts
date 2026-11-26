import { test, expect } from "@playwright/test"

test("user can log in", async ({ page }) => {
    await page.goto("/login")

    await page.getByLabel("Username or email").fill("alice")
    await page.getByLabel("Password").fill("password123")
    await page.getByRole("button", { name: "Log in" }).click()

    await expect(page).toHaveURL("/")
    await expect(page.getByRole("link", { name: "alice" })).toBeVisible()
})

test("wrong password shows an error", async ({ page }) => {
    await page.goto("/login")

    await page.getByLabel("Username or email").fill("alice")
    await page.getByLabel("Password").fill("wrong-password")
    await page.getByRole("button", { name: "Log in" }).click()

    await expect(page.getByText("Incorrect username/email or password")).toBeVisible()
    await expect(page).toHaveURL("/login")
})

test("new user can register", async ({ page }) => {
    const username = `user${Date.now()}`

    await page.goto("/register")

    await page.getByLabel("Username").fill(username)
    await page.getByLabel("Email").fill(`${username}@example.com`)
    await page.getByLabel("Password", { exact: true }).fill("password123")
    await page.getByLabel("Confirm Password").fill("password123")
    await page.getByRole("button", { name: "Create Account" }).click()

    await expect(page).toHaveURL("/")
    await expect(page.getByRole("link", { name: username })).toBeVisible()
})

test("logged out user is sent to login from profile", async ({ page }) => {
    await page.goto("/profile")

    await expect(page).toHaveURL("/login")
})

test("user can log out", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Username or email").fill("alice")
    await page.getByLabel("Password").fill("password123")
    await page.getByRole("button", { name: "Log in" }).click()
    await expect(page).toHaveURL("/")

    await page.getByRole("button", { name: "Logout" }).click()

    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible()
})