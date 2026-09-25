import type { RequestFn } from './client.js';
import type { ContactMessage, ListResponse } from './types.js';

export function createContactApi({ request }: { request: RequestFn }) {
  return {
    submitContactMessage: (data: { name?: string; email?: string; message: string }): Promise<ContactMessage> =>
      request('/contact', { method: 'POST', body: data, auth: true }),
    myContactMessages: (): Promise<ListResponse<ContactMessage>> => request('/contact-messages/mine', { auth: true }),
  };
}
