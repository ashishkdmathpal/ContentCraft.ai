import { test, expect, type Page } from '@playwright/test'

test.describe('User Logout Flow', () => {
  // Helper function to register and login a test user
  async function registerAndLogin(page: Page) {
    const timestamp = Date.now()
    const testEmail = `logout-test-${timestamp}@example.com`
    const testPassword = 'LogoutTest123'

    // Register
    await page.goto('/register')
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password').fill(testPassword)
    await page.getByRole('button', { name: 'Create account' }).click()
    await page.waitForURL('/dashboard')

    return { testEmail, testPassword }
  }

  test('should successfully logout and redirect to login page', async ({ page }) => {
    // Setup: Register and login
    await registerAndLogin(page)

    // Verify we're on dashboard
    await expect(page).toHaveURL('/dashboard')

    // Click logout button
    await page.getByRole('button', { name: 'Logout' }).click()

    // Should redirect to login page
    await page.waitForURL('/login', { timeout: 5000 })
    await expect(page).toHaveURL('/login')

    // Verify we're on login page
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  })

  test('should clear tokens on logout', async ({ page }) => {
    // Setup: Register and login
    await registerAndLogin(page)

    // Click logout
    await page.getByRole('button', { name: 'Logout' }).click()
    await page.waitForURL('/login')

    // Try to navigate to dashboard directly
    await page.goto('/dashboard')

    // Should be redirected back to login (because tokens are cleared)
    await page.waitForURL('/login', { timeout: 5000 })
    await expect(page).toHaveURL('/login')
  })

  test('should prevent accessing dashboard after logout', async ({ page }) => {
    // Setup: Register and login
    await registerAndLogin(page)

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click()
    await page.waitForURL('/login')

    // Try to access protected route
    await page.goto('/dashboard')

    // Should be redirected to login
    await page.waitForURL('/login', { timeout: 5000 })
    await expect(page).toHaveURL('/login')
  })

  test('should allow re-login after logout', async ({ page }) => {
    // Setup: Register and login
    const { testEmail, testPassword } = await registerAndLogin(page)

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click()
    await page.waitForURL('/login')

    // Login again with same credentials
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password').fill(testPassword)
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Should successfully login
    await page.waitForURL('/dashboard', { timeout: 10000 })
    await expect(page.getByText(testEmail)).toBeVisible()
  })

  test('logout button should be visible on dashboard', async ({ page }) => {
    // Setup: Register and login
    await registerAndLogin(page)

    // Verify logout button exists and is visible
    const logoutButton = page.getByRole('button', { name: 'Logout' })
    await expect(logoutButton).toBeVisible()
    await expect(logoutButton).toBeEnabled()
  })
})
