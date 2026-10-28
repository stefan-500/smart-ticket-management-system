import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { loginAsUser } from '../../fixtures/uiFixtures';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
});

test('TC_UI_002 login page loads', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Smart Ticket' })).toBeVisible();
  await expect(page.getByText('Sign in to your account')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});

test('TC_UI_001 login with valid credentials', async ({ page }) => {
  await loginAsUser(page);
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'My Tickets' })).toBeVisible();
});

test('TC_UI_003 login with invalid credentials shows an error', async ({ page }) => {
  await page.getByLabel('Email').fill(`invalid-${randomUUID()}@example.com`);
  await page.getByLabel('Password').fill('incorrect-password');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('alert')).toContainText('Login failed');
  await expect(page).toHaveURL(/\/login$/);
});

test('TC_UI_004 password is masked', async ({ page }) => {
  const password = page.getByLabel('Password');
  await password.fill('example-password');
  await expect(password).toHaveAttribute('type', 'password');
});

test('TC_UI_008 logout returns to login', async ({ page }) => {
  await loginAsUser(page);
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});