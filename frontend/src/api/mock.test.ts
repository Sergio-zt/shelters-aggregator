import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMockApi, preferenceStorageKey } from './mock';
import { adaptShelters, adaptPlaces } from './adapters';
test('mock API confirms and persists the backend language preference', async () => {
  const saved = new Map<string, string>();
  const storage = {
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => {
      saved.set(key, value);
    },
  };
  const api = createMockApi({ storage, delayMs: 0 });
  assert.deepEqual(await api.getPreferences(), { language: 'uk' });
  assert.deepEqual(await api.updateLanguage('en'), { language: 'en' });
  assert.ok(saved.has(preferenceStorageKey));
  assert.deepEqual(
    await createMockApi({ storage, delayMs: 0 }).getPreferences(),
    { language: 'en' },
  );
});
test('cancelled writes do not change the preference or resolve later', async () => {
  const api = createMockApi({ delayMs: 0 });
  const controller = new AbortController();
  const pending = api.updateLanguage('en', { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  assert.deepEqual(await api.getPreferences(), { language: 'uk' });
});
test('mock catalog goes through the same API adapter in both languages', async () => {
  const api = createMockApi({ delayMs: 0 });
  const rows = await api.getShelters(),
    districts = await api.getDistricts();
  const uk = adaptShelters(rows, districts, 'uk'),
    en = adaptShelters(rows, districts, 'en');
  assert.equal(uk.rejected, 0);
  assert.equal(uk.shelters.length, 8);
  assert.deepEqual(
    uk.shelters.map((s) => [s.id, s.coordinates]),
    en.shelters.map((s) => [s.id, s.coordinates]),
  );
  assert.notEqual(uk.shelters[0].name, en.shelters[0].name);
  const places = await api.searchPlaces('Житомирська');
  assert.ok(places.length > 0);
  assert.equal(adaptPlaces(places, 'uk')[0].name, 'Житомирська');
});
test('mock submission refuses empty feedback', async () => {
  await assert.rejects(
    createMockApi({ delayMs: 0 }).submitFeedback({ comment: '  ' }),
  );
});
