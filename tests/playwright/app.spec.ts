import { expect, test } from '@playwright/test'

test('creates a session and sends a message', async ({ page }) => {
  await page.goto('/')

  // Wait for the textarea to be visible
  await expect(page.getByPlaceholder('Ask anything... (Cmd+Enter to send)')).toBeVisible()

  // Type a message
  await page.getByPlaceholder('Ask anything... (Cmd+Enter to send)').fill('Hello mock assistant')

  // Click send button
  await page.getByLabel('Send message').click()

  // Wait for user message to appear
  await expect(page.getByText('Hello mock assistant')).toBeVisible({ timeout: 10000 })

  // Wait for mock response to appear
  await page.waitForSelector('text=/Echoing|reflective|inspires/i', { timeout: 10000 })
})
