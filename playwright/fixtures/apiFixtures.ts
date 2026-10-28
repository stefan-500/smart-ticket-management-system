import { test as base, expect } from '@playwright/test';

import { LoginPage } from '../pages/LoginPage';
import { TicketPage } from '../pages/TicketPage';
import { CommentPage } from '../pages/CommentPage';

type ApiFixtures = {
  loginPage: LoginPage;
  ticketPage: TicketPage;
  commentPage: CommentPage;
};

export const test = base.extend<ApiFixtures>({
  loginPage: async ({ request }, use) => {
    await use(
      new LoginPage(request)
    );
  },

  ticketPage: async ({ request }, use) => {
    await use(
      new TicketPage(request)
    );
  },

  commentPage: async ({ request }, use) => {
    await use(
      new CommentPage(request)
    );
  }
});

export { expect };