import { createMockApi } from './mock';
import { createHttpApi } from './http';
export const apiMode =
  import.meta.env.VITE_API_MODE === 'http' ? 'http' : 'mock';
export const api =
  apiMode === 'http'
    ? createHttpApi(import.meta.env.VITE_API_BASE_URL || '/api')
    : createMockApi();
