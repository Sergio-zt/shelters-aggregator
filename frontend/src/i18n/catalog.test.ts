import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dictionaries,
  createTranslator,
  normalizeLocale,
  localizedText,
} from './catalog';
test('English and Ukrainian have identical keys and interpolation variables', () => {
  assert.deepEqual(
    Object.keys(dictionaries.en).sort(),
    Object.keys(dictionaries.uk).sort(),
  );
  const placeholders = (value: string) =>
    [...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  for (const [key, value] of Object.entries(dictionaries.en)) {
    assert.equal(typeof value, 'string');
    assert.deepEqual(
      placeholders(value),
      placeholders(dictionaries.uk[key as keyof typeof dictionaries.uk]),
      key,
    );
  }
});
test('counts use Ukrainian plural forms and English singular/plural', () => {
  const uk = createTranslator('uk'),
    en = createTranslator('en');
  for (const [count, label] of [
    [1, 'укриття'],
    [2, 'укриття'],
    [5, 'укриттів'],
    [11, 'укриттів'],
    [21, 'укриття'],
    [22, 'укриття'],
    [25, 'укриттів'],
  ] as const)
    assert.equal(uk('filters.show', { count }), `Показати ${count} ${label}`);
  assert.equal(en('filters.show', { count: 1 }), 'Show 1 shelter');
  assert.equal(en('filters.show', { count: 5 }), 'Show 5 shelters');
  assert.equal(
    uk('search.notFound', { query: '<script>' }),
    'Не вдалося знайти «<script>».',
  );
});
test('backend locale and localized records have predictable fallback', () => {
  assert.equal(normalizeLocale('en'), 'en');
  assert.equal(normalizeLocale('uk'), 'uk');
  assert.equal(normalizeLocale('ua'), 'uk');
  assert.equal(normalizeLocale(null), 'uk');
  assert.equal(localizedText({ uk: 'Київ', en: 'Kyiv' }, 'en'), 'Kyiv');
  assert.equal(localizedText({ uk: 'Київ' }, 'en'), 'Київ');
  assert.equal(localizedText('Новий район', 'en'), 'Новий район');
});
test('visible TSX copy and labels use the dictionaries instead of hardcoded text', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const path = await import('node:path');
  const { default: ts } = await import('typescript');
  const root = fileURLToPath(new URL('../', import.meta.url));
  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? files(path.join(dir, entry.name))
        : entry.name.endsWith('.tsx')
          ? [path.join(dir, entry.name)]
          : [],
    );
  for (const file of files(root)) {
    const source = ts.createSourceFile(
      file,
      readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const visit = (node: import('typescript').Node) => {
      if (ts.isJsxText(node)) {
        const text = node.text.trim();
        assert.ok(
          text === 'SafePlace' || !/[\p{L}]/u.test(text),
          `${file}: untranslated JSX text: ${text}`,
        );
      }
      if (
        ts.isJsxAttribute(node) &&
        ['placeholder', 'title', 'aria-label'].includes(
          node.name.getText(source),
        ) &&
        node.initializer &&
        ts.isStringLiteral(node.initializer)
      )
        assert.equal(
          node.initializer.text,
          '',
          `${file}: hardcoded ${node.name.getText(source)}`,
        );
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
});
