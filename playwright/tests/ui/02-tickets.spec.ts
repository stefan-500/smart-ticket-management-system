import { test, expect } from '@playwright/test';
import { createTicket, loginAsUser } from '../../fixtures/uiFixtures';

test.beforeEach(async ({ page }) => {
  await loginAsUser(page);
  await page.goto('/tickets/new');
});

test('TC_UI_010 empty ticket fields show validation messages', async ({ page }) => {
  await page.getByRole('button', { name: 'Create ticket' }).click();
  await expect(page.getByText('Enter a ticket title.')).toBeVisible();
  await expect(page.getByText('Enter a ticket description.')).toBeVisible();
  await expect(page.getByText('Select a ticket type.')).toBeVisible();
  await expect(page.getByText('Select a priority.')).toBeVisible();
  await expect(page.getByLabel('Title')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Description')).toHaveAttribute('aria-invalid', 'true');
});

test('TC_UI_011 priority dropdown offers LOW, MEDIUM and HIGH', async ({ page }) => {
  const options = page.getByLabel('Priority').locator('option:not([disabled])');
  await expect(options).toHaveText(['Low', 'Medium', 'High']);
  await expect.poll(() => options.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('value')),
  )).toEqual(['LOW', 'MEDIUM', 'HIGH']);
});

test('TC_UI_012 ticket type dropdown offers supported types', async ({ page }) => {
  const options = page.getByLabel('Ticket type').locator('option:not([disabled])');
  await expect(options).toHaveText(['Incident', 'Software request']);
  await expect.poll(() => options.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('value')),
  )).toEqual(['INCIDENT', 'SOFTWARE_REQUEST']);
});

test('TC_UI_009, TC_UI_013 and TC_UI_014 create and list a ticket', async ({ page }) => {
  const ticket = await createTicket(page);
  expect(ticket.ticketStatus).toBe('IN_QUEUE');

  await page.getByRole('link', { name: 'My Tickets' }).click();
  await expect(page).toHaveURL(/\/tickets$/);
  await page.getByRole('searchbox', { name: 'Search tickets by number or title' }).fill(ticket.ticketNumber);
  const row = page.getByRole('row').filter({ hasText: ticket.ticketNumber });
  await expect(row).toContainText(ticket.title);
  await expect(row).toContainText('Pending');
  await expect(row).toContainText('High');
});