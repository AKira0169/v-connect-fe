import { AxiosError } from 'axios';

export function handleApiError(error: unknown): never {
  if (error instanceof AxiosError && error.response?.data) {
    throw error.response.data;
  }
  throw error;
}
