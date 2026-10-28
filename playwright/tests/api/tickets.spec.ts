import {
  test,
  expect
} from '../../fixtures/apiFixtures';

import { users } from '../../test-data/user.data';
test.describe('Tickets API', () => {
    test(
  'TC_API_007 Create new ticket',
  async ({
    loginPage,
    ticketPage
  }) => {

    await loginPage.login(
      users.user.email,
      users.user.password
    );

    const response =
      await ticketPage.createTicket(
        'VPN Issue',
        'Unable to connect to VPN'
      );

    expect(
      response.status()
    ).toBe(201);

    const body =
      await response.json();

    expect(
      body.title
    ).toBe('VPN Issue');
  }
);

test(
  'TC_API_010 Create ticket without title',
  async ({
    loginPage,
    ticketPage
  }) => {

    await loginPage.login(
      users.user.email,
      users.user.password
    );

    const response =
      await ticketPage.createTicket(
        '',
        'Missing title'
      );

    expect(
      response.status()
    ).toBe(400);
  }
);

test(
  'TC_API_014 Retrieve Existing Ticket',
  async ({
    loginPage,
    ticketPage
  }) => {

    await loginPage.login(
      users.user.email,
      users.user.password
    );

    const response =
      await ticketPage.getTicket(1);

    expect(
      response.status()
    ).toBe(200);

    const body =
      await response.json();

    expect(
      body.ticketId
    ).toBe(1);
  }
);

test(
  'TC_API_016 Retrieve Non-Existing Ticket',
  async ({
    loginPage,
    ticketPage
  }) => {

    await loginPage.login(
      users.user.email,
      users.user.password
    );

    const response =
      await ticketPage.getTicket(
        999999
      );

    expect(
      response.status()
    ).toBe(404);
  }
);
test(
  'TC_API_029 Retrieve FULFILLMENT Tickets',
  async ({
    loginPage,
    ticketPage
  }) => {

    await loginPage.login(
      users.admin.email,
      users.admin.password
    );

    const response =
      await ticketPage.getTicketsByStatus(
        'FULFILLMENT'
      );

    expect(
      response.status()
    ).toBe(200);

    const body =
      await response.json();

    expect(
      body.content
    ).toBeDefined();

    expect(
      Array.isArray(body.content)
    ).toBeTruthy();

    for (const ticket of body.content) {

      expect(
        ticket.ticketStatus
      ).toBe('FULFILLMENT');

    }
  }
);

test(
  'TC_API_037 Resolve Ticket Successfully',
  async ({
    loginPage,
    ticketPage
  }) => {

    await loginPage.login(
      users.agent.email,
      users.agent.password
    );

    const response =
      await ticketPage.resolveTicket(
        5,
        'Issue resolved successfully'
      );

      console.log('STATUS:', response.status());
console.log('BODY:', await response.text());

    expect(
      response.status()
    ).toBe(200);
  }
);
});

