import { APIRequestContext } from '@playwright/test';

export class TicketPage {
  constructor(
    private readonly request: APIRequestContext
  ) {}

  async createTicket(
    title: string,
    description: string,
    priority = 'HIGH',
    ticketType = 'INCIDENT'
  ) {
    return await this.request.post(
      '/tickets/add',
      {
        data: {
          title,
          description,
          ticketPriority: priority,
          ticketType
        }
      }
    );
  }

  async getTicket(
    ticketId: number
  ) {
    return await this.request.get(
      `/tickets/${ticketId}`
    );
  }

  async getTickets(
    page = 0,
    size = 5
  ) {
    return await this.request.get(
      `/tickets?page=${page}&size=${size}`
    );
  }

  async getTicketsByStatus(
    status: string
  ) {
    return await this.request.get(
      `/tickets/status/${status}`
    );
  }

  async resolveTicket(
    ticketId: number,
    summary: string
  ) {
    return await this.request.patch(
      '/tickets/resolve',
      {
        params: {
          ticketID: ticketId,
          summary
        }
      }
    );
  }
}