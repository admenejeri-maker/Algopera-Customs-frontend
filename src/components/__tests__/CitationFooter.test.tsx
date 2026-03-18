/**
 * Tests for ChatResponse citation footer — Bug E regression guard
 *
 * Verifies the data-driven citation footer renders article numbers from the
 * trusted sources array, NOT from LLM-generated footer text.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatResponse } from '../chat-response';
import type { SourceDetail } from '@/types/api';

// Mock next/dynamic to render ProductCard synchronously
vi.mock('next/dynamic', () => ({
    default: () => () => null,
}));

// Mock useFeatureFlags hook
vi.mock('@/hooks/useFeatureFlags', () => ({
    useFeatureFlags: () => ({
        isEnabled: () => false,
    }),
}));

const mockSources: SourceDetail[] = [
    {
        id: 'art-302',
        article_number: '302',
        title: 'გადასახადის განაკვეთები',
        score: 0.95,
        source: 'matsne',
    },
    {
        id: 'art-81',
        article_number: '81',
        title: 'საშემოსავლო გადასახადი',
        score: 0.88,
        source: 'matsne',
    },
];

describe('ChatResponse citation footer', () => {
    it('renders data-driven footer with correct article numbers', () => {
        render(
            <ChatResponse
                assistantContent="პასუხი ტექსტი [1] და [2]."
                sources={mockSources}
                isStreaming={false}
            />
        );

        // Footer should show correct article numbers from sources data
        expect(screen.getByText(/მუხლი 302/)).toBeDefined();
        expect(screen.getByText(/მუხლი 81/)).toBeDefined();
    });

    it('does NOT show footer during streaming', () => {
        render(
            <ChatResponse
                assistantContent="პასუხი ტექსტი [1]."
                sources={mockSources}
                isStreaming={true}
            />
        );

        // Footer should not render while streaming
        expect(screen.queryByText('📚 წყაროები:')).toBeNull();
    });

    it('does NOT show footer when no sources', () => {
        render(
            <ChatResponse
                assistantContent="პასუხი ტექსტი."
                sources={[]}
                isStreaming={false}
            />
        );

        expect(screen.queryByText('📚 წყაროები:')).toBeNull();
    });

    it('does NOT show footer when sources undefined', () => {
        render(
            <ChatResponse
                assistantContent="პასუხი ტექსტი."
                isStreaming={false}
            />
        );

        expect(screen.queryByText('📚 წყაროები:')).toBeNull();
    });

    it('renders InfoHub format for non-article sources', () => {
        const infohubSources: SourceDetail[] = [
            {
                id: 'infohub-1433',
                article_number: '',
                title: 'ქონების გადასახადით დაბეგვრა N1433',
                score: 0.92,
                source: 'infohub',
            },
        ];

        render(
            <ChatResponse
                assistantContent="პასუხი ტექსტი [1]."
                sources={infohubSources}
                isStreaming={false}
            />
        );

        expect(screen.getByText(/InfoHub:/)).toBeDefined();
    });

    it('clicking footer chip calls onCitationClick with correct index', () => {
        const handleClick = vi.fn();

        render(
            <ChatResponse
                assistantContent="პასუხი ტექსტი [1]."
                sources={mockSources}
                onCitationClick={handleClick}
                isStreaming={false}
            />
        );

        // Find footer chip buttons that have მუხლი text
        const footerChips = screen.getAllByRole('button').filter(
            (btn) => btn.classList.contains('citation-footer-chip')
        );

        // Click the first footer chip
        if (footerChips.length > 0) {
            fireEvent.click(footerChips[0]);
            expect(handleClick).toHaveBeenCalledWith(0);
        }
    });

    it('strips LLM-generated footer from completed responses', () => {
        // The LLM wrote მუხლი 300 (hallucinated), but source is მუხლი 302
        const contentWithHallucination =
            'პასუხი [1].\n\n📚 წყაროები:\n- [1] მუხლი 300 (ნაწილი 1)';

        render(
            <ChatResponse
                assistantContent={contentWithHallucination}
                sources={mockSources}
                isStreaming={false}
            />
        );

        // Hallucinated footer text should be stripped
        expect(screen.queryByText(/მუხლი 300/)).toBeNull();

        // Data-driven footer shows correct article number
        expect(screen.getByText(/მუხლი 302/)).toBeDefined();
    });

    it('footer shows only inline-cited sources, matching sidebar filter', () => {
        // 5 sources available, but text only cites [1] and [3]
        const fiveSources: SourceDetail[] = [
            { id: 's1', article_number: '82', title: 'მუხლი 82', score: 0.9, source: 'matsne' },
            { id: 's2', article_number: '81', title: 'მუხლი 81', score: 0.85, source: 'matsne' },
            { id: 's3', article_number: '168', title: 'მუხლი 168', score: 0.8, source: 'matsne' },
            { id: 's4', article_number: '134', title: 'მუხლი 134', score: 0.75, source: 'matsne' },
            { id: 's5', article_number: '101', title: 'მუხლი 101', score: 0.7, source: 'matsne' },
        ];

        render(
            <ChatResponse
                assistantContent="მუხლი 82 [1] განსაზღვრავს, ხოლო მუხლი 168 [3] ავსებს."
                sources={fiveSources}
                isStreaming={false}
            />
        );

        // Footer should show ONLY sources [1] (მუხლი 82) and [3] (მუხლი 168)
        const footerChips = screen.getAllByRole('button').filter(
            (btn) => btn.classList.contains('citation-footer-chip')
        );
        expect(footerChips).toHaveLength(2);

        // Verify footer chips contain correct sources
        const allFooterText = footerChips.map(c => c.textContent).join(' ');
        expect(allFooterText).toContain('მუხლი 82');
        expect(allFooterText).toContain('მუხლი 168');

        // Non-cited sources should NOT appear in footer chips
        expect(allFooterText).not.toContain('მუხლი 81');
        expect(allFooterText).not.toContain('მუხლი 134');
        expect(allFooterText).not.toContain('მუხლი 101');
    });
});
