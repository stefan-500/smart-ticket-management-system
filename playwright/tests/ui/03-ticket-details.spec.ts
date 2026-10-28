import { test, expect } from '@playwright/test';
import { createTicket, loginAsUser } from '../../fixtures/uiFixtures';

test('TC_UI_016 and TC_UI_015 open ticket details and add a comment', async ({ page }) => {
  await loginAsUser(page);
  const ticket = await createTicket(page);

  await page.getByRole('link', { name: 'My Tickets' }).click();
  await page.getByRole('searchbox', { name: 'Search tickets by number or title' }).fill(ticket.ticketNumber);
  const row = page.getByRole('row').filter({ hasText: ticket.ticketNumber });
  await row.getByRole('link', { name: 'View' }).click();

  await expect(page).toHaveURL(new RegExp(`/tickets/${ticket.ticketId}$`));
  await expect(page.getByRole('heading', { name: ticket.title })).toBeVisible();
  await expect(page.getByText(ticket.ticketNumber)).toBeVisible();
  await expect(page.getByText(ticket.description, { exact: true })).toBeVisible();
  await expect(page.getByText('Pending', { exact: true })).toBeVisible();
  await expect(page.getByText('High priority', { exact: true })).toBeVisible();
  await expect(page.getByText('Incident', { exact: true })).toBeVisible();

  const comment = `Additional information for ${ticket.ticketNumber}`;
  await page.getByLabel('Add a comment').fill(comment);
  await page.getByRole('button', { name: 'Post comment' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Comment posted.' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Comments, oldest first' })).toContainText(comment);

  await page.reload();
  await expect(page.getByRole('list', { name: 'Comments, oldest first' })).toContainText(comment);
});
