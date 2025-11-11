import { test, expect } from '@playwright/test'

test.describe('AI Voice Chat PWA - Smoke Test', () => {
  test('should load the app without errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Navigate to the app
    await page.goto('http://localhost:5173')

    // Wait for the app to load
    await page.waitForSelector('text=New chat', { timeout: 10000 })

    // Check that no console errors occurred
    expect(errors).toHaveLength(0)

    // Verify basic UI elements are present
    await expect(page.locator('text=New chat')).toBeVisible()
    await expect(page.locator('textarea[placeholder*="Ask anything"]')).toBeVisible()
  })

  test('should create a session and send a message', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForSelector('text=New chat', { timeout: 10000 })

    // Find the textarea and type a message
    const textarea = page.locator('textarea[placeholder*="Ask anything"]')
    await textarea.fill('Hello, test message!')

    // Click send button
    await page.locator('button[aria-label="Send message"]').click()

    // Wait for user message to appear
    await expect(page.locator('text=Hello, test message!')).toBeVisible({ timeout: 5000 })

    // Wait for assistant response (mock should respond quickly)
    await page.waitForSelector('[role="assistant"]', { timeout: 10000 })
  })

  test('should display voice controls', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForSelector('text=Voice input', { timeout: 10000 })

    // Verify voice controls are visible
    await expect(page.locator('text=Voice input')).toBeVisible()
    await expect(page.locator('text=Auto send')).toBeVisible()
  })
})
