import {
  createApiClient,
  createAuthApi,
  createCatalogApi,
  createOrdersApi,
  createPaymentsApi,
  createContactApi,
} from '@arghya/api-client';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const client = createApiClient({ baseUrl: BASE_URL });

export const api = {
  ...createAuthApi(client),
  ...createCatalogApi(client),
  ...createOrdersApi(client),
  ...createPaymentsApi(client),
  ...createContactApi(client),
};

export { ApiError } from '@arghya/api-client';
