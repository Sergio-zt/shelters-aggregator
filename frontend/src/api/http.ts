import type { AppApi, PlaceDto, PreferencesDto, RequestOptions } from './types';
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
export function createHttpApi(
  baseUrl: string,
  fetcher: typeof fetch = fetch,
): AppApi {
  const base = baseUrl.replace(/\/$/, '');
  async function request<T>(
    path: string,
    options?: RequestOptions,
    method = 'GET',
    body?: unknown,
  ): Promise<T> {
    const response = await fetcher(`${base}${path}`, {
      method,
      signal: options?.signal,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok)
      throw new ApiError(
        response.status,
        `Request failed (${response.status})`,
      );
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    if (!text.trim()) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new ApiError(502, 'Expected a JSON API response.');
    }
  }
  const list = (value: unknown): unknown[] => {
    if (Array.isArray(value)) return value;
    if (
      value &&
      typeof value === 'object' &&
      'items' in value &&
      Array.isArray(value.items)
    )
      return value.items;
    throw new ApiError(
      502,
      'Unexpected list response; adjust the API adapter to the agreed backend schema.',
    );
  };
  return {
    getPreferences: (o) => request<PreferencesDto>('/preferences', o),
    updateLanguage: (language, o) =>
      request<PreferencesDto>('/preferences', o, 'PATCH', { language }),
    getDistricts: async (o) => list(await request<unknown>('/districts', o)),
    getShelters: async (o) => list(await request<unknown>('/shelters', o)),
    searchPlaces: async (query, o) =>
      list(
        await request<unknown>(`/places?q=${encodeURIComponent(query)}`, o),
      ) as PlaceDto[],
    submitFeedback: async (input, o) => {
      await request('/feedback', o, 'POST', {
        comment: input.comment,
        shelter_id: input.shelterId,
      });
    },
    suggestShelter: async (input, o) => {
      await request('/shelter-suggestions', o, 'POST', input);
    },
  };
}
