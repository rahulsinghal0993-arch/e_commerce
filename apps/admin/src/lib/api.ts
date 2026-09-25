import { createApiClient, createAuthApi, createAdminApi } from '@arghya/api-client';

const BASE_URL = import.meta.env?.VITE_API_URL || '/api';

const client = createApiClient({ baseUrl: BASE_URL });

export const api = {
  ...createAuthApi(client),
  ...createAdminApi(client),
};

export { ApiError } from '@arghya/api-client';
