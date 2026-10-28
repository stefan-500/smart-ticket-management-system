import { APIRequestContext } from '@playwright/test';

export class CommentPage {
  constructor(
    private readonly request: APIRequestContext
  ) {}

  async getComments(
    ticketId: number
  ) {
    return await this.request.get(
      `/comments/${ticketId}`
    );
  }
}