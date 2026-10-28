import {
  test,
  expect
} from '../../fixtures/apiFixtures';

import {
  users
} from '../../test-data/user.data';

test(
  'TC_API_040 Retrieve Comments For Ticket',
  async ({
    loginPage,
    commentPage
  }) => {

    await loginPage.login(
      users.user.email,
      users.user.password
    );

    const response =
      await commentPage.getComments(1);

    expect(
      response.status()
    ).toBe(200);
  }
);