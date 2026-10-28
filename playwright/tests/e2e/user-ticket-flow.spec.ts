import { test, expect, Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const PASSWORD = 'Password123!';

async function register(page: Page, email: string) {
  await page.goto('/register');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirm password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('status')).toContainText('Your account has been created');
}

async function login(page: Page, email: string) {
  await page.getByRole('link', { name: 'sign in' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test('E2E user registers, creates a ticket via the Create Ticket tab and views its assignee', async ({ page }) => {
  const email = `e2e-${randomUUID()}@example.com`;
  const title = `E2E ticket ${randomUUID()}`;
  const description = 'Created by the end-to-end test.\nSecond line of the description.';

  await register(page, email);
  await login(page, email);

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Create Ticket' }).click();
  await expect(page).toHaveURL(/\/tickets\/new$/);

  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Description').fill(description);
  await page.getByLabel('Ticket type').selectOption('SOFTWARE_REQUEST');
  await page.getByLabel('Priority').selectOption('MEDIUM');

  await page.getByRole('button', { name: 'Create ticket' }).click();
  const notice = page.getByRole('status').filter({ hasText: 'was created successfully' });
  await expect(notice).toBeVisible();
  const ticketNumber = (await notice.locator('strong').innerText()).trim();
  expect(ticketNumber).toMatch(/^TKT-/);

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'My Tickets' }).click();
  await expect(page).toHaveURL(/\/tickets$/);
  const row = page.getByRole('row').filter({ hasText: ticketNumber });
  await expect(row).toContainText(title);
  await expect(row).toContainText('Pending');
  await row.getByRole('link', { name: 'View' }).click();

  await expect(page).toHaveURL(/\/tickets\/\d+$/);
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.getByText(description, { exact: true })).toBeVisible();

  const assignee = page.locator('dt', { hasText: 'Assigned to' }).locator('xpath=following-sibling::dd');
  await expect(assignee).toHaveText(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  const agentEmail = (await assignee.innerText()).trim();
  const creator = page.locator('dt', { hasText: 'Created by' }).locator('xpath=following-sibling::dd');
  await expect(creator).toHaveText(email);
  expect(agentEmail).not.toBe(email);
});
