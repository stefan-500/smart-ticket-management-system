import { test, expect } from '@playwright/test';
import { loginAs, loginAsUser } from '../../fixtures/uiFixtures';
import { users } from '../../test-data/user.data';

test('TC_UI_017 dashboard loads', async ({ page }) => {
  await loginAsUser(page);

  await expect(page.getByRole('heading', { name: 'Support, without the guesswork.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Create a ticket' })).toBeVisible();
  await expect(page.getByLabel('Ticket totals')).toBeVisible();
  await expect(page.getByLabel('Tickets by status')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recent tickets' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Dashboard' })).toBeVisible();
});

test('TC_UI_018 assigned tickets are displayed for a support agent', async ({ page }) => {
  await loginAs(page, users.agent);

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Assigned Tickets' }).click();
  await expect(page).toHaveURL(/\/tickets\/assigned$/);
  await expect(page.getByRole('heading', { name: 'Assigned Tickets' })).toBeVisible();

  await expect(page.getByRole('columnheader')).toHaveText(
    ['Ticket #', 'Title', 'Priority', 'Type', 'Status', 'Submitted', 'Actions'],
  );
  const rows = page.getByRole('row').filter({ has: page.getByRole('cell') });
  await expect(rows.first()).toBeVisible();
  await expect(rows.first().getByRole('cell').first()).not.toBeEmpty();
  await expect(rows.first().getByRole('link', { name: /^View ticket / })).toBeVisible();
});
