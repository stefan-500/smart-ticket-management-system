import { expect, Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { users } from '../test-data/user.data';

export async function loginAs(
  page: Page,
  account: { email: string; password: string },
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Password').fill(account.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

export function loginAsUser(page: Page): Promise<void> {
  return loginAs(page, users.user);
}

export async function createTicket(page: Page) {
  const title = `Playwright ticket ${randomUUID()}`;
  const description = 'First line of the issue.\nSecond line with additional details.';

  await page.goto('/tickets/new');
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Description').fill(description);
  await page.getByLabel('Ticket type').selectOption('INCIDENT');
  await page.getByLabel('Priority').selectOption('HIGH');

  const responsePromise = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/tickets/add'
      && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Create ticket' }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  const ticket: { ticketId: number; ticketNumber: string; ticketStatus: string } = await response.json();
  expect(ticket.ticketNumber).toBeTruthy();
  await expect(page.getByRole('status')).toContainText(ticket.ticketNumber);

  return { ...ticket, title, description };
}