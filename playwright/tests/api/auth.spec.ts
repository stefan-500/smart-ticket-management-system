import {
  test,
  expect
} from '../../fixtures/apiFixtures';

import { users } from '../../test-data/user.data';
test.describe(
  'Authentication API Tests',
  () => {

    test(
      'TC_API_001 Login with valid credentials',
      async ({ loginPage }) => {

        const response =
          await loginPage.login(
            users.admin.email,
            users.admin.password
          );

        expect(
          response.status()
        ).toBe(204);

        expect(
          response.headers()['set-cookie']
        ).toContain('access_token');
      }
    );

    test(
      'TC_API_002 Login with invalid password',
      async ({ loginPage }) => {

        const response =
          await loginPage.login(
            users.admin.email,
            'wrongPassword'
          );

        expect(
          response.status()
        ).toBe(401);
      }
    );

    test(
      'TC_API_003 Login with non-existing user',
      async ({ loginPage }) => {

        const response =
          await loginPage.login(
            'doesnotexist@example.com',
            'Password123'
          );

        expect(
          [401, 404]
        ).toContain(
          response.status()
        );
      }
    );

    test(
      'TC_API_004 Login with both fields empty',
      async ({ loginPage }) => {

        const response =
          await loginPage.login(
            '',
            ''
          );

        expect(
          response.status()
        ).toBe(400);
      }
    );

    test(
      'TC_API_005 Register a new user',
      async ({ loginPage }) => {

        const uniqueEmail =
          `user${Date.now()}@test.com`;

        const response =
          await loginPage.register(
            uniqueEmail,
            'Password123'
          );

        expect(
          response.status()
        ).toBe(201);

        const body =
          await response.json();

        expect(
          body.email
        ).toBe(
          uniqueEmail
        );
      }
    );

    test(
      'TC_API_006 Get current user information',
      async ({ loginPage }) => {

        await loginPage.login(
          users.admin.email,
          users.admin.password
        );

        const response =
          await loginPage.getCurrentUser();

        expect(
          response.status()
        ).toBe(200);

        const body =
          await response.json();

        expect(
          body.email
        ).toBe(
          users.admin.email
        );
      }
    );

  }
);