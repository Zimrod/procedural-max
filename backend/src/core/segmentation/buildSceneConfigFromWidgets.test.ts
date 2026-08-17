import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildBulletItemsFromText,
  summarizeSentenceToHeadline,
} from './buildSceneConfigFromWidgets.js';

test('summarizeSentenceToHeadline turns transcript sentences into short scene titles', () => {
  const summary = summarizeSentenceToHeadline(
    'The company is expanding into new markets by using a modular operating model that reduces risk and increases speed.'
  );

  assert.ok(summary.length > 0);
  assert.ok(summary.split(' ').length <= 6);
  assert.ok(!summary.toLowerCase().includes('modular operating model'));
  assert.ok(summary.toLowerCase().includes('market') || summary.toLowerCase().includes('expand'));
});

test('buildBulletItemsFromText creates multiple bullet items instead of one long sentence', () => {
  const items = buildBulletItemsFromText(
    'We reduce risk through modular planning. We move faster with clearer ownership. We create repeatable processes across teams.'
  );

  assert.ok(items.length >= 2);
  assert.ok(items.every((item) => item.length > 0));
  assert.ok(items.every((item) => !item.includes('.')));
});
