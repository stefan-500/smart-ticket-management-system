import { test, expect, APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { users } from '../../test-data/user.data';

const USER_PASSWORD = 'Password123!';

interface CreatedTicket {
  ticketId: number;
  ticketNumber: string;
  title: string;
  assigneeEmail: string | null;
}

// Creates a fresh ticket as a new user so the agent flow never consumes seeded data.
async function createTicketAsNewUser(request: APIRequestContext): Promise<CreatedTicket> {
  const email = `e2e-${randomUUID()}@example.com`;
  const title = `E2E agent ticket ${randomUUID()}`;

  const registered = await request.post('/api/auth/register', { data: { email, password: USER_PASSWORD } });
  expect(registered.status()).toBe(201);
  const loggedIn = await request.post('/api/auth/login', { data: { email, password: USER_PASSWORD } });
  expect(loggedIn.status()).toBe(204);

  const created = await request.post('/api/tickets/add', {
    data: {
      title,
      description: 'Ticket created for the support agent end-to-end flow.',
      ticketPriority: 'HIGH',
      ticketType: 'INCIDENT',
    },
  });
  expect(created.status()).toBe(201);
  const ticket = await created.json();
  return {
    ticketId: ticket.ticketId,
    ticketNumber: ticket.ticketNumber,
    title,
    assigneeEmail: ticket.assigneeEmail,
  };
}

test('E2E support agent opens a ticket from the dashboard, comments and resolves it', async ({ page, request }) => {
  const ticket = await createTicketAsNewUser(request);

  const agent = Object.values(users).find(
    (account) => account.email === ticket.assigneeEmail && account !== users.user,
  );
  test.skip(!agent, `Ticket was assigned to ${ticket.assigneeEmail}, whose password is not in test-data.`);

  await page.goto('/login');
  await page.getByLabel('Email').fill(agent!.email);
  await page.getByLabel('Password').fill(agent!.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  // The queue shows only the top 5 tickets; otherwise fall back to Assigned Tickets.
  const card = page.locator('article.queue-card').filter({ hasText: ticket.ticketNumber });
  await expect(page.getByRole('heading', { name: 'Priority Queue' })).toBeVisible();
  await expect(page.locator('.queue-state[role="status"]')).toHaveCount(0);
  if (await card.count() > 0) {
    await card.getByRole('link', { name: `View ticket ${ticket.ticketNumber}` }).click();
  } else {
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Assigned Tickets' }).click();
    await expect(page).toHaveURL(/\/tickets\/assigned$/);
    await page.getByRole('searchbox', { name: 'Search tickets by number or title' }).fill(ticket.ticketNumber);
    await page.getByRole('link', { name: `View ticket ${ticket.ticketNumber}` }).click();
  }

  await expect(page).toHaveURL(new RegExp(`/tickets/${ticket.ticketId}$`));
  await expect(page.getByRole('heading', { name: ticket.title })).toBeVisible();
  await expect(page.getByText('In Progress', { exact: true })).toBeVisible();

  const comments = page.getByRole('list', { name: 'Comments, oldest first' });
  const first = `First agent comment ${randomUUID()}`;
  const second = `Second agent comment ${randomUUID()}`;
  for (const comment of [first, second]) {
    await page.getByLabel('Add a comment').fill(comment);
    await page.getByRole('button', { name: 'Post comment' }).click();
    await expect(comments).toContainText(comment);
    await expect(page.getByRole('status').filter({ hasText: 'Comment posted.' })).toBeVisible();
  }

  await page.getByRole('button', { name: 'Resolve ticket' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Resolve ticket' })).toBeDisabled();

  const resolution = `Resolved by the E2E test ${randomUUID()}`;
  await dialog.getByLabel('Resolution message').fill(resolution);
  await dialog.getByRole('button', { name: 'Resolve ticket' }).click();

  await expect(dialog).toBeHidden();
  await expect(page.locator('section.resolution')).toContainText(resolution);
  await expect(page.getByText('Resolved', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Resolve ticket' })).toHaveCount(0);

  await page.reload();
  await expect(page.locator('section.resolution')).toContainText(resolution);
  await expect(comments).toContainText(first);
  await expect(comments).toContainText(second);
});
