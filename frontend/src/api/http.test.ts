import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHttpApi, ApiError } from './http';
test('local preferences do not call an absent backend endpoint', async () => {
  const api = createHttpApi('/api', (async () => {
    throw new Error('Unexpected network call');
  }) as typeof fetch);
  assert.deepEqual(await api.updateLanguage('en'), { language: 'en' });
  assert.ok((await api.getPreferences()).language);
});
test('HTTP failures are errors, not empty catalogs; list envelopes are normalized', async () => {
  const broken = createHttpApi(
    '/api',
    (async () => new Response('', { status: 503 })) as typeof fetch,
  );
  await assert.rejects(
    broken.getShelters(),
    (error: unknown) => error instanceof ApiError && error.status === 503,
  );
  const envelope = createHttpApi(
    '/api',
    (async () =>
      new Response(JSON.stringify({ items: [{ id: 1 }] }))) as typeof fetch,
  );
  assert.deepEqual(await envelope.getShelters(), [{ id: 1 }]);
});
test('successful writes accept an empty HTTP response body', async () => {
  const api = createHttpApi(
    '/api',
    (async () => new Response(null, { status: 200 })) as typeof fetch,
  );
  await api.submitFeedback({ name: 'Olena', comment: 'Test comment' });
});

test('feedback initializes visitor and posts backend review payload to the correct route', async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const api = createHttpApi('/api', (async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(null, { status: 204 });
  }) as typeof fetch);
  await api.submitFeedback({
    name: 'Олена',
    comment: 'Коментар',
    shelterId: '123',
  });
  assert.deepEqual(
    calls.map((c) => c.url),
    ['/api/visitor', '/api/places/123/reviews'],
  );
  assert.deepEqual(JSON.parse(String(calls[1].init?.body)), {
    author_name: 'Олена',
    text: 'Коментар',
  });
  assert.ok(calls.every((c) => c.init?.credentials === 'include'));
  await api.submitFeedback({ name: 'Olena', comment: 'Site feedback' });
  assert.equal(calls[3].url, '/api/reviews');
});
test('visitor failure prevents review submission', async () => {
  let count = 0;
  const api = createHttpApi('/api', (async () => {
    count++;
    return new Response('', { status: 400 });
  }) as typeof fetch);
  await assert.rejects(api.submitFeedback({ name: 'A', comment: 'B' }));
  assert.equal(count, 1);
});

test('detail requests preserve cancellation and surface a missing shelter', async () => {
  const controller = new AbortController();
  const api = createHttpApi('/api', (async (url, init) => {
    assert.equal(String(url), '/api/places/42');
    assert.equal(init?.signal, controller.signal);
    return new Response('{"detail":"Place not found"}', { status: 404 });
  }) as typeof fetch);
  await assert.rejects(
    api.getShelter('42', { signal: controller.signal }),
    (error: unknown) => error instanceof ApiError && error.status === 404,
  );
});

test('search loads subsequent pages beyond 100 results', async () => {
  const urls: string[] = [];
  const api = createHttpApi('/api', (async (url) => {
    urls.push(String(url));
    const skip = Number(
      new URL(String(url), 'http://localhost').searchParams.get('skip'),
    );
    return new Response(
      JSON.stringify(
        Array.from({ length: skip === 0 ? 100 : 1 }, (_, i) => ({
          id: skip + i,
        })),
      ),
    );
  }) as typeof fetch);
  assert.equal((await api.searchPlaces('метро & парк')).length, 101);
  assert.equal(
    new URL(urls[0], 'http://localhost').searchParams.get('q'),
    'метро & парк',
  );
  assert.equal(
    new URL(urls[1], 'http://localhost').searchParams.get('skip'),
    '100',
  );
});
test('search stops pagination when cancelled', async () => {
  const controller = new AbortController();
  let calls = 0;
  const api = createHttpApi('/api', (async () => {
    calls++;
    controller.abort();
    return new Response(
      JSON.stringify(Array.from({ length: 100 }, (_, id) => ({ id }))),
    );
  }) as typeof fetch);
  await assert.rejects(
    api.searchPlaces('test', { signal: controller.signal }),
    { name: 'AbortError' },
  );
  assert.equal(calls, 1);
});
test('failed search page rejects partial results', async () => {
  let calls = 0;
  const api = createHttpApi('/api', (async () =>
    ++calls === 1
      ? new Response(
          JSON.stringify(Array.from({ length: 100 }, (_, id) => ({ id }))),
        )
      : new Response('', { status: 503 })) as typeof fetch);
  await assert.rejects(
    api.searchPlaces('test'),
    (error: unknown) => error instanceof ApiError && error.status === 503,
  );
});
