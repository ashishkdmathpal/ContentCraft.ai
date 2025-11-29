import { test, expect, type Page } from '@playwright/test'

test.describe('Dashboard Access and Features', () => {
  // Helper to create authenticated user
  async function createAuthenticatedSession(page: Page) {
    const timestamp = Date.now()
    const testEmail = `dashboard-${timestamp}@example.com`
    const testPassword = 'Dashboard123'
    const testName = 'Dashboard Test User'

    await page.goto('/register')
    await page.getByLabel('Name').fill(testName)
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password').fill(testPassword)
    await page.getByRole('button', { name: 'Create account' }).click()
    await page.waitForURL('/dashboard')

    return { testEmail, testPassword, testName }
  }

  test('should redirect to login when not authenticated', async ({ page }) => {
    // Try to access dashboard without logging in
    await page.goto('/dashboard')

    // Should be redirected to login
    await page.waitForURL('/login', { timeout: 5000 })
    await expect(page).toHaveURL('/login')
  })

  test('should display user information on dashboard', async ({ page }) => {
    const { testEmail, testName } = await createAuthenticatedSession(page)

    // Verify user name in welcome message
    await expect(page.getByRole('heading', { name: new RegExp(`Welcome back.*${testName}`, 'i') })).toBeVisible()

    // Verify email is displayed
    await expect(page.getByText(testEmail)).toBeVisible()
  })

  test('should display dashboard header with branding', async ({ page }) => {
    await createAuthenticatedSession(page)

    // Verify ContentCraft AI branding
    await expect(page.getByRole('heading', { name: 'ContentCraft AI' })).toBeVisible()
  })

  test('should display feature cards', async ({ page }) => {
    await createAuthenticatedSession(page)

    // Verify all feature cards are present
    const featureCards = [
      'Content Generation',
      'Publishing',
      'Blog',
      'SEO Keywords',
      'Image Generation',
      'Settings',
    ]

    for (const feature of featureCards) {
      await expect(page.getByRole('heading', { name: feature })).toBeVisible()
    }
  })

  test('should display "Coming Soon" status for features', async ({ page }) => {
    await createAuthenticatedSession(page)

    // All feature buttons should be disabled and show "Coming Soon"
    const comingSoonButtons = page.getByRole('button', { name: 'Coming Soon' })
    const count = await comingSoonButtons.count()

    // Should have 6 "Coming Soon" buttons (one for each feature card)
    expect(count).toBe(6)

    // All should be disabled
    for (let i = 0; i < count; i++) {
      await expect(comingSoonButtons.nth(i)).toBeDisabled()
    }
  })

  test('should display phase 1 completion info box', async ({ page }) => {
    await createAuthenticatedSession(page)

    // Verify completion info card
    await expect(page.getByRole('heading', { name: /Authentication Complete/i })).toBeVisible()

    // Verify checkmarks for completed features
    await expect(page.getByText(/User registration and login working/i)).toBeVisible()
    await expect(page.getByText(/JWT authentication implemented/i)).toBeVisible()
    await expect(page.getByText(/Database connected/i)).toBeVisible()
    await expect(page.getByText(/Dark\/Light theme toggle functional/i)).toBeVisible()
  })

  test('should have responsive layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await createAuthenticatedSession(page)

    // Dashboard should still be visible and functional
    await expect(page.getByRole('heading', { name: 'ContentCraft AI' })).toBeVisible()

    // Feature cards should stack vertically (check they're visible)
    await expect(page.getByRole('heading', { name: 'Content Generation' })).toBeVisible()
  })

  test('should have responsive layout on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })

    await createAuthenticatedSession(page)

    // Dashboard should be visible
    await expect(page.getByRole('heading', { name: 'ContentCraft AI' })).toBeVisible()

    // Feature cards should be visible in grid
    await expect(page.getByRole('heading', { name: 'Content Generation' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Publishing' })).toBeVisible()
  })

  test('should maintain authentication across page refresh', async ({ page }) => {
    const { testEmail } = await createAuthenticatedSession(page)

    // Refresh the page
    await page.reload()

    // Should still be on dashboard with user info visible
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText(testEmail)).toBeVisible()
  })

  test('should have working logout button in header', async ({ page }) => {
    await createAuthenticatedSession(page)

    // Logout button should be in header
    const logoutButton = page.getByRole('button', { name: 'Logout' })
    await expect(logoutButton).toBeVisible()

    // Click it
    await logoutButton.click()

    // Should redirect to login
    await page.waitForURL('/login')
    await expect(page).toHaveURL('/login')
  })
})
