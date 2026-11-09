import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHttpApi, ApiError } from './http';
test('HTTP preferences use JSON PATCH and keep the server response authoritative', async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fake = async (url: URL | RequestInfo, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({ language: 'uk' }), { status: 200 });
  };
  const api = createHttpApi(
    'https://api.example.test/v1/',
    fake as typeof fetch,
  );
  const controller = new AbortController();
  assert.deepEqual(
    await api.updateLanguage('en', { signal: controller.signal }),
    { language: 'uk' },
  );
  assert.equal(calls[0].url, 'https://api.example.test/v1/preferences');
  assert.equal(calls[0].init?.method, 'PATCH');
  assert.equal(calls[0].init?.body, '{"language":"en"}');
  assert.equal(calls[0].init?.signal, controller.signal);
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
  await api.submitFeedback({ comment: 'Test comment' });
});
