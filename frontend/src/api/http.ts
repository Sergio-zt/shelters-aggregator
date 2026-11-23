import type { AppApi, RequestOptions } from './types';
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
      credentials: 'include',
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
    getPreferences: async () => {
      let language = 'uk';
      try {
        language =
          globalThis.localStorage?.getItem('safeplace.language') || 'uk';
      } catch {
        /* Storage can be unavailable. */
      }
      return { language };
    },
    updateLanguage: async (language) => {
      try {
        globalThis.localStorage?.setItem('safeplace.language', language);
      } catch {
        /* Keep the language usable for this session. */
      }
      return { language };
    },
    getDistricts: async (o) => {
      const value = await request<unknown>('/filters', o);
      if (
        !value ||
        typeof value !== 'object' ||
        !('districts' in value) ||
        !Array.isArray(value.districts)
      ) {
        throw new ApiError(
          502,
          'Expected a district list in the filters response.',
        );
      }
      return value.districts;
    },
    getShelter: async (id, o) => {
      const value = await request<unknown>(
        `/places/${encodeURIComponent(id)}`,
        o,
      );
      if (
        !value ||
        typeof value !== 'object' ||
        !('id' in value) ||
        String(value.id) !== id
      ) {
        throw new ApiError(
          502,
          'Shelter response does not match the requested ID.',
        );
      }
      return value;
    },
    getShelters: async (o) => list(await request<unknown>('/places', o)),
    searchPlaces: async (query, o) => {
      const rows: unknown[] = [];
      const limit = 100;
      for (let skip = 0; ; skip += limit) {
        o?.signal?.throwIfAborted();
        const page = list(
          await request<unknown>(
            `/places/search?q=${encodeURIComponent(query)}&limit=${limit}&skip=${skip}`,
            o,
          ),
        );
        rows.push(...page);
        if (page.length < limit) return rows;
      }
    },
    submitFeedback: async (input, o) => {
      await request('/visitor', o);
      await request(
        input.shelterId
          ? `/places/${encodeURIComponent(input.shelterId)}/reviews`
          : '/reviews',
        o,
        'POST',
        {
          author_name: input.name,
          text: input.comment,
        },
      );
    },
    suggestShelter: async (input, o) => {
      await request('/visitor', o);
      await request('/suggestion', o, 'POST', {
        ...input,
        type: input.type?.toLowerCase().replaceAll('-', '_') ?? null,
      });
    },
  };
}
