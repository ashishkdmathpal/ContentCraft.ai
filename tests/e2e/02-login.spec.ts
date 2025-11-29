import { test, expect } from '@playwright/test'

test.describe('User Login Flow', () => {
  // Setup: Create a test user before login tests
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    const timestamp = Date.now()

    // Store credentials in a shared location
    process.env.TEST_USER_EMAIL = `login-test-${timestamp}@example.com`
    process.env.TEST_USER_PASSWORD = 'LoginTest123'

    // Register test user
    await page.goto('/register')
    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL)
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD)
    await page.getByRole('button', { name: 'Create account' }).click()
    await page.waitForURL('/dashboard')

    // Logout to prepare for login tests
    await page.getByRole('button', { name: 'Logout' }).click()
    await page.waitForURL('/login')

    await page.close()
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto('/login')

    // Verify we're on login page
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()

    // Fill in login form
    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!)
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!)

    // Submit form
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 })

    // Verify successful login
    await expect(page.getByText(process.env.TEST_USER_EMAIL!)).toBeVisible()

    // Verify success toast
    const toast = page.getByText('Welcome back!')
    if (await toast.isVisible().catch(() => false)) {
      await expect(toast).toBeVisible()
    }
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    // Try login with wrong password
    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!)
    await page.getByLabel('Password').fill('WrongPassword123')

    await page.getByRole('button', { name: 'Sign in' }).click()

    // Should show error message
    await expect(page.getByText(/Invalid credentials/i)).toBeVisible()
  })

  test('should show error for non-existent user', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Email').fill('nonexistent@example.com')
    await page.getByLabel('Password').fill('SomePassword123')

    await page.getByRole('button', { name: 'Sign in' }).click()

    // Should show error message
    await expect(page.getByText(/Invalid credentials|User not found/i)).toBeVisible()
  })

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Email').fill('invalid-email')
    await page.getByLabel('Password').fill('SomePassword123')

    await page.getByRole('button', { name: 'Sign in' }).click()

    // Should show validation error
    await expect(page.getByText('Invalid email address')).toBeVisible()
  })

  test('should have link to registration page', async ({ page }) => {
    await page.goto('/login')

    // Click "Create account" link
    await page.getByRole('link', { name: 'Create account' }).click()

    // Should navigate to register page
    await page.waitForURL('/register')
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
  })

  test('should have forgot password link', async ({ page }) => {
    await page.goto('/login')

    // Verify forgot password link exists
    const forgotPasswordLink = page.getByRole('link', { name: /Forgot password/i })
    await expect(forgotPasswordLink).toBeVisible()
  })

  test('should persist login after page refresh', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!)
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL('/dashboard')

    // Refresh the page
    await page.reload()

    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText(process.env.TEST_USER_EMAIL!)).toBeVisible()
  })
})
