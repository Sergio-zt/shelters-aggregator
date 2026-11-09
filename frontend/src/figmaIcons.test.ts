import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { figmaIcons } from './figmaIcons';
interface Provenance {
  name: keyof typeof figmaIcons;
  file: string;
  sourceUrl: string;
  sha256: string;
  derivedFrom?: keyof typeof figmaIcons;
}
const provenance = JSON.parse(
  readFileSync(new URL('../design/figma-icons.json', import.meta.url), 'utf8'),
) as Provenance[];
const source = (name: keyof typeof figmaIcons) =>
  readFileSync(
    new URL(`../public${figmaIcons[name].url}`, import.meta.url),
    'utf8',
  );
test('all registered original SVGs exist and retain their authored frame dimensions', () => {
  for (const [name, asset] of Object.entries(figmaIcons)) {
    const svg = source(name as keyof typeof figmaIcons);
    assert.match(svg, /<svg\b/);
    assert.equal(
      Number(svg.match(/<svg\b[^>]*\bwidth="([^"]+)"/)?.[1]),
      asset.width,
      name,
    );
    assert.equal(
      Number(svg.match(/<svg\b[^>]*\bheight="([^"]+)"/)?.[1]),
      asset.height,
      name,
    );
  }
});
test('SVG provenance is complete and cropped icon tiles preserve all original paths', () => {
  assert.equal(
    new Set(provenance.map((asset) => asset.name)).size,
    Object.keys(figmaIcons).length,
  );
  const paths = (svg: string) =>
    [...svg.matchAll(/\sd="([^"]+)"/g)].map((match) => match[1]);
  for (const asset of provenance) {
    const svg = source(asset.name);
    assert.equal(
      createHash('sha256').update(svg).digest('hex'),
      asset.sha256,
      asset.name,
    );
    assert.match(
      asset.sourceUrl,
      /^https:\/\/www\.figma\.com\/design\/.+node-id=/,
    );
    if (asset.derivedFrom)
      assert.deepEqual(
        paths(svg),
        paths(source(asset.derivedFrom)),
        asset.name,
      );
  }
});
