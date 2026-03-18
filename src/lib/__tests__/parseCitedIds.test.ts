/**
 * Unit tests for parseCitedIds
 *
 * Covers: single/multi citations, deduplication,
 * markdown link exclusion, empty input, out-of-bounds,
 * and known footnote-definition limitation.
 */
import { describe, test, expect } from 'vitest';
import { parseCitedIds } from '../parseCitedIds';

describe('parseCitedIds', () => {

    // ─── Happy Path ──────────────────────────────────────────────────────

    test('extracts single citation', () => {
        expect(parseCitedIds('text [1] here')).toEqual(new Set([1]));
    });

    test('extracts multiple non-contiguous citations', () => {
        expect(parseCitedIds('[1] and [3] apply')).toEqual(new Set([1, 3]));
    });

    test('deduplicates repeated citations', () => {
        expect(parseCitedIds('[1] and also [1] again')).toEqual(new Set([1]));
    });

    // ─── Exclusion Rules ──────────────────────────────────────────────────

    test('ignores markdown links [text](url)', () => {
        expect(parseCitedIds('[link text](https://example.com)')).toEqual(new Set());
    });

    test('ignores numeric markdown links [1](url)', () => {
        expect(parseCitedIds('[1](https://matsne.gov.ge)')).toEqual(new Set());
    });

    // ─── Empty / Null Guards ──────────────────────────────────────────────

    test('returns empty set when no citations', () => {
        expect(parseCitedIds('plain text with no markers')).toEqual(new Set());
    });

    test('returns empty set on empty string', () => {
        expect(parseCitedIds('')).toEqual(new Set());
    });

    // ─── Stress Cases ────────────────────────────────────────────────────

    test('ST-4: zero citations — informational response', () => {
        // Panel should show badge = 0, not trigger fallback
        const text = 'The corporate tax rate is 15%. No citation needed.';
        expect(parseCitedIds(text)).toEqual(new Set());
    });

    test('ST-5: out-of-bounds citation [99] — returns {99}, no crash', () => {
        // Caller's filter will check citationSources[98] which is undefined → skipped
        expect(parseCitedIds('[99] applies here')).toEqual(new Set([99]));
    });

    test('known limitation: footnote-definition line "[1]: http://..." matches [1]', () => {
        // Georgian LLM responses don't use footnote syntax, so this is acceptable
        // Documented as known gap, not treated as a bug
        expect(parseCitedIds('[1]: http://matsne.gov.ge')).toEqual(new Set([1]));
    });
});
