import { APIRequestContext } from '@playwright/test';

export class LoginPage {

  constructor(
    private readonly request: APIRequestContext
  ) {}

  async login(
    email: string,
    password: string
  ) {

    return this.request.post(
      '/auth/login',
      {
        data: {
          email,
          password
        }
      }
    );
  }

  async register(
    email: string,
    password: string
  ) {

    return this.request.post(
      '/auth/register',
      {
        data: {
          email,
          password
        }
      }
    );
  }

  async getCurrentUser() {

    return this.request.get(
      '/users/me',
    );
  }
}