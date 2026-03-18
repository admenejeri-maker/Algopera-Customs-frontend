/**
 * Tests for response-parser.ts — Bug E regression guard
 *
 * Ensures stripSourcesFooter works on BOTH streaming and complete responses.
 * Previously, footer was only stripped during streaming, allowing hallucinated
 * article numbers to appear in completed responses.
 */

import { describe, it, expect } from 'vitest';
import {
    stripSourcesFooter,
    ensureMarkdownFormatting,
    normalizeMarkdownBullets,
} from '../response-parser';

describe('stripSourcesFooter', () => {
    it('strips 📚 წყაროები footer from streaming content', () => {
        const content =
            '**პასუხი** — საშემოსავლო გადასახადი 20%-ია [1].\n\n📚 წყაროები:\n- [1] მუხლი 300\n- [2] მუხლი 81';
        const result = stripSourcesFooter(content);
        expect(result).toBe('**პასუხი** — საშემოსავლო გადასახადი 20%-ია [1].');
        expect(result).not.toContain('📚');
        expect(result).not.toContain('წყაროები');
    });

    it('strips 📚 წყაროები footer from complete (non-streaming) content', () => {
        const content =
            'კარგი ამბავი! მიკრო ბიზნესის სტატუსით... [1]\n\n📚 წყაროები:\n- [1] მუხლი 89';
        const result = stripSourcesFooter(content);
        expect(result).toBe('კარგი ამბავი! მიკრო ბიზნესის სტატუსით... [1]');
    });

    it('strips fallback წყარო: format footer', () => {
        const longIntro = 'ა'.repeat(200);
        const content = `${longIntro}\nწყარო: [1] მუხლი 89`;
        const result = stripSourcesFooter(content);
        expect(result).not.toContain('წყარო:');
    });

    it('handles hallucinated article numbers in footer (Bug E scenario)', () => {
        // LLM wrote მუხლი 300, but correct source is მუხლი 302
        const content =
            'პასუხი ტექსტი [1].\n\n📚 წყაროები:\n- [1] მუხლი 300 (ნაწილი 1)';
        const result = stripSourcesFooter(content);
        expect(result).toBe('პასუხი ტექსტი [1].');
        // Hallucinated მუხლი 300 is gone
        expect(result).not.toContain('300');
    });

    it('returns content unchanged when no footer present', () => {
        const content = 'პასუხი [1] ტექსტი [2] ასე.';
        const result = stripSourcesFooter(content);
        expect(result).toBe(content);
    });

    it('handles empty string', () => {
        expect(stripSourcesFooter('')).toBe('');
    });

    it('does not strip 📚 from beginning of content (guardrail)', () => {
        // If 📚 appears at position 0, it should not be stripped
        const content = '📚 წყაროები: test';
        const result = stripSourcesFooter(content);
        // idx === 0 is falsy in the current implementation, so content is preserved
        expect(result).toBe(content);
    });

    it('preserves ⚠️ disclaimer after stripping footer (Bug G)', () => {
        // Real E2E pattern: LLM footer + backend disclaimers appended after
        const content = [
            'პასუხი ტექსტი [1].',
            '',
            '📚 წყაროები:',
            '- [1] მუხლი 82 (ნაწილი 1)',
            '- [12] InfoHub: N 1507',
            '',
            '⚠️ *კონკრეტული თანხების გამოსათვლელად მიმართეთ საგადასახადო კონსულტანტს.*',
        ].join('\n');

        const result = stripSourcesFooter(content);
        // Footer stripped
        expect(result).not.toContain('📚');
        expect(result).not.toContain('მუხლი 82');
        // Disclaimer preserved!
        expect(result).toContain('⚠️');
        expect(result).toContain('კონსულტანტს');
    });

    it('preserves ⏰ temporal warning after stripping footer (Bug G)', () => {
        const content = [
            'პასუხი [1].',
            '',
            '📚 წყაროები:',
            '- [1] მუხლი 165',
            '',
            '⚠️ *კონკრეტული თანხების გამოსათვლელად მიმართეთ საგადასახადო კონსულტანტს.*',
            '⏰ *თქვენ 2025 წლის შესახებ გკითხავთ — საგადასახადო კანონმდებლობა შეიძლება შეცვლილი იყოს.*',
        ].join('\n');

        const result = stripSourcesFooter(content);
        // Footer stripped
        expect(result).not.toContain('📚');
        // Both disclaimers preserved!
        expect(result).toContain('⚠️');
        expect(result).toContain('⏰');
        expect(result).toContain('კონსულტანტს');
        expect(result).toContain('2025');
    });
});

describe('ensureMarkdownFormatting', () => {
    it('bolds first sentence if no markdown formatting exists', () => {
        const content = 'პირდაპირი პასუხი. დეტალები აქ.';
        const result = ensureMarkdownFormatting(content);
        expect(result).toContain('**');
    });

    it('skips bolding if content already has bold markers', () => {
        const content = '**უკვე მუქი** ტექსტი.';
        const result = ensureMarkdownFormatting(content);
        expect(result).toBe(content);
    });

    it('returns short content unchanged', () => {
        expect(ensureMarkdownFormatting('hi')).toBe('hi');
    });
});

describe('normalizeMarkdownBullets', () => {
    it('converts • to - at line start', () => {
        const content = '• პუნქტი 1\n• პუნქტი 2';
        const result = normalizeMarkdownBullets(content);
        expect(result).toBe('- პუნქტი 1\n- პუნქტი 2');
    });

    it('preserves mid-line •', () => {
        const content = 'ტექსტი • შუაში';
        const result = normalizeMarkdownBullets(content);
        expect(result).toBe('ტექსტი • შუაში');
    });

    it('handles empty string', () => {
        expect(normalizeMarkdownBullets('')).toBe('');
    });
});
