import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { normalizeMindeeResponse } from './mindeeOcr';

describe('normalizeMindeeResponse', () => {
  it('extracts ordered text from pages and aggregates confidence', () => {
    const response = {
      document: {
        inference: {
          pages: [
            {
              id: 1,
              prediction: {
                rawText: 'Line A\nLine B',
                confidence: 0.84,
                cells: [
                  { text: 'Cell 1', confidence: 0.9 },
                  { text: 'Cell 2', confidence: 0.8 },
                ],
              },
            },
            {
              id: 2,
              prediction: {
                fullText: 'Line C',
                words: [
                  { value: 'Word 1', confidence: 0.5 },
                  { value: 'Word 2', confidence: 0.75 },
                ],
              },
            },
          ],
          prediction: {
            fields: [
              { name: 'total', value: '123', confidence: 0.6 },
            ],
          },
        },
      },
    };

    const normalized = normalizeMindeeResponse(response);

    assert.equal(normalized.text, 'Line A\nLine B\nCell 1\nCell 2\nLine C\nWord 1\nWord 2');
    assert.equal(normalized.fields?.length, 1);
    assert.equal(normalized.fields?.[0]?.name, 'total');
    assert.equal(normalized.confidence, 74);
  });

  it('returns null text when no textual content exists', () => {
    const normalized = normalizeMindeeResponse({ inference: { prediction: {} } });
    assert.equal(normalized.text, null);
    assert.equal(normalized.confidence, undefined);
  });

  it('collects fallback text keys in nested objects', () => {
    const response = {
      inference: {
        prediction: {
          result: {
            lines: [
              { content: 'Header', confidence: 42 },
              { stringValue: 'Body', confidence: 0.25 },
            ],
          },
        },
      },
    };

    const normalized = normalizeMindeeResponse(response);
    assert.equal(normalized.text, 'Header\nBody');
    assert.equal(normalized.confidence, 34);
  });
});
