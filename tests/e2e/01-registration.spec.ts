import { test, expect } from '@playwright/test'

test.describe('User Registration Flow', () => {
  test('should successfully register a new user', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register')

    // Verify we're on the registration page
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()

    // Generate unique test user
    const timestamp = Date.now()
    const testEmail = `test-${timestamp}@example.com`
    const testPassword = 'TestPassword123'
    const testName = 'Test User'

    // Fill in registration form
    await page.getByLabel('Name').fill(testName)
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password').fill(testPassword)

    // Submit form
    await page.getByRole('button', { name: 'Create account' }).click()

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 })

    // Verify successful registration by checking dashboard
    await expect(page.getByRole('heading', { name: /Welcome back.*Test User/i })).toBeVisible()
    await expect(page.getByText(testEmail)).toBeVisible()

    // Verify success toast (if visible)
    const toast = page.getByText('Account created successfully!')
    if (await toast.isVisible().catch(() => false)) {
      await expect(toast).toBeVisible()
    }
  })

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/register')

    // Fill with invalid email
    await page.getByLabel('Email').fill('invalid-email')
    await page.getByLabel('Password').fill('TestPassword123')

    // Try to submit
    await page.getByRole('button', { name: 'Create account' }).click()

    // Verify validation error appears
    await expect(page.getByText('Invalid email address')).toBeVisible()
  })

  test('should show validation error for weak password', async ({ page }) => {
    await page.goto('/register')

    const timestamp = Date.now()
    await page.getByLabel('Email').fill(`test-${timestamp}@example.com`)
    await page.getByLabel('Password').fill('weak') // Too short, no uppercase, no numbers

    await page.getByRole('button', { name: 'Create account' }).click()

    // Should show at least one password requirement error
    const passwordErrors = page.getByText(/Password must/)
    await expect(passwordErrors.first()).toBeVisible()
  })

  test('should prevent duplicate email registration', async ({ page }) => {
    const timestamp = Date.now()
    const testEmail = `duplicate-${timestamp}@example.com`
    const testPassword = 'TestPassword123'

    // First registration
    await page.goto('/register')
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password').fill(testPassword)
    await page.getByRole('button', { name: 'Create account' }).click()

    // Wait for successful registration
    await page.waitForURL('/dashboard', { timeout: 10000 })

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click()
    await page.waitForURL('/login')

    // Try to register again with same email
    await page.goto('/register')
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password').fill(testPassword)
    await page.getByRole('button', { name: 'Create account' }).click()

    // Should show error about existing user
    await expect(page.getByText(/already exists/i)).toBeVisible()
  })
})
