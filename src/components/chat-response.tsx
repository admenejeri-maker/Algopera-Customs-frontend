'use client';

import type React from "react"
import { useMemo } from "react"
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown'
import { ScoopLogo } from "./scoop-logo"
import { CornerDownRight, Lightbulb } from "lucide-react"
import { parseProductsFromMarkdown } from "@/lib/parseProducts"
import { stripSourcesFooter, ensureMarkdownFormatting, normalizeMarkdownBullets } from "@/lib/response-parser"
import { parseCitedIds } from "@/lib/parseCitedIds"
import { useFeatureFlags } from "@/hooks/useFeatureFlags"
import type { SourceDetail } from "@/types/api"

// ── Source type map for infohub family detection ─────────────────────────────
const SOURCE_TYPE_MAP: Record<string, { label: string; family: 'infohub' | 'matsne' }> = {
    infohub_tax_code:   { label: 'საგადასახადო კოდექსი', family: 'infohub' },
    infohub_normative:  { label: 'ნორმატიული აქტი', family: 'infohub' },
    infohub_admin:      { label: 'ადმინისტრაციული აქტი', family: 'infohub' },
    infohub_legislative:{ label: 'საკანონმდებლო აქტი', family: 'infohub' },
    infohub_sm:         { label: 'სიტუაციური სახელმძღვანელო', family: 'infohub' },
    infohub:            { label: 'ინფოჰაბი', family: 'infohub' },
    matsne:             { label: 'საკანონმდებლო მაცნე', family: 'matsne' },
};

function isInfohubFamily(source?: string): boolean {
    if (!source) return false;
    return SOURCE_TYPE_MAP[source]?.family === 'infohub';
}

// Dynamic import: ProductCard only needed when products exist in response
const ProductCard = dynamic(
    () => import('./ProductCard').then(mod => ({ default: mod.ProductCard })),
    { loading: () => <div className="product-card-skeleton" aria-hidden="true" /> }
);

interface QuickReply {
    id: string
    text: string
    icon?: React.ReactNode
}

interface ChatResponseProps {
    userMessage?: string
    assistantContent?: string
    sources?: SourceDetail[]
    onCitationClick?: (index: number) => void
    quickReplies?: QuickReply[]
    onQuickReplyClick?: (id: string, text: string) => void
    isStreaming?: boolean
}

// Default quick replies (fallback if backend doesn't send any)
const defaultQuickReplies: QuickReply[] = [
    { id: "income-tax", text: "საშემოსავლო გადასახადის განაკვეთი?" },
    { id: "small-biz", text: "მცირე ბიზნესის სტატუსი" },
    { id: "vat", text: "დღგ-ს რეგისტრაციის ზღვარი?" },
    { id: "deadlines", text: "დეკლარაციის ჩაბარების ვადა?" },
]

// ── Citation chip regex: matches [1], [2], etc. but not markdown links [text](url) ──
const CITATION_REGEX = /\[(\d{1,3})\](?!\()/g;

/**
 * Parses text content and replaces [N] citation markers with interactive chips.
 * Chips are inert (no click) until sources data arrives.
 */
function CitationText({
    content,
    sources,
    onCitationClick,
}: {
    content: string;
    sources?: SourceDetail[];
    onCitationClick?: (index: number) => void;
}) {
    const parts = useMemo(() => {
        const result: (string | { type: 'citation'; num: number })[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;
        const regex = new RegExp(CITATION_REGEX.source, 'g');

        while ((match = regex.exec(content)) !== null) {
            if (match.index > lastIndex) {
                result.push(content.slice(lastIndex, match.index));
            }
            result.push({ type: 'citation', num: parseInt(match[1], 10) });
            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < content.length) {
            result.push(content.slice(lastIndex));
        }

        return result;
    }, [content]);

    // No citations found — return plain text
    if (parts.length === 1 && typeof parts[0] === 'string') {
        return <>{content}</>;
    }

    return (
        <>
            {parts.map((part, i) => {
                if (typeof part === 'string') {
                    return <span key={i}>{part}</span>;
                }

                const source = sources?.[part.num - 1];
                const hasSource = !!source;
                const isInfohub = isInfohubFamily(source?.source);

                return (
                    <button
                        key={i}
                        className={`citation-chip ${hasSource ? (isInfohub ? 'citation-chip--infohub' : 'citation-chip--active') : ''}`}
                        onClick={() => hasSource && onCitationClick?.(part.num - 1)}
                        title={source?.title || `Source ${part.num}`}
                        disabled={!hasSource}
                        aria-label={`Citation ${part.num}${source ? `: ${source.title}` : ''}`}
                    >
                        {part.num}
                    </button>
                );
            })}
        </>
    );
}

export function ChatResponse({
    userMessage,
    assistantContent,
    sources,
    onCitationClick,
    quickReplies = defaultQuickReplies,
    onQuickReplyClick,
    isStreaming = false,
}: ChatResponseProps) {
    // Feature flags
    const { isEnabled } = useFeatureFlags();
    // Bug E fix: ALWAYS strip sources footer — LLM may hallucinate article numbers.
    // Data-driven CitationFooter will render correct articles from sources array.
    const strippedContent = assistantContent
        ? stripSourcesFooter(assistantContent)
        : assistantContent;
    // Layer 2: Ensure minimal Markdown formatting (bold first sentence)
    const formattedContent = strippedContent
        ? ensureMarkdownFormatting(strippedContent)
        : strippedContent;
    // Layer 3: Normalize • bullets to standard markdown - (dash)
    const normalizedContent = formattedContent
        ? normalizeMarkdownBullets(formattedContent)
        : formattedContent;
    // Parse products from normalized markdown
    const parsed = normalizedContent
        ? parseProductsFromMarkdown(normalizedContent)
        : { intro: '', products: [], outro: '' };

    const hasProducts = parsed.products.length > 0;

    // Memoized ReactMarkdown components with citation chip support
    const markdownComponents = useMemo(() => ({
        // Override text nodes inside paragraphs to inject citation chips
        p: ({ children, ...props }: React.ComponentPropsWithoutRef<'p'>) => {
            return (
                <p {...props}>
                    {Array.isArray(children)
                        ? children.map((child, i) =>
                            typeof child === 'string'
                                ? <CitationText key={i} content={child} sources={sources} onCitationClick={onCitationClick} />
                                : child
                        )
                        : typeof children === 'string'
                            ? <CitationText content={children} sources={sources} onCitationClick={onCitationClick} />
                            : children
                    }
                </p>
            );
        },
        li: ({ children, ...props }: React.ComponentPropsWithoutRef<'li'>) => {
            return (
                <li {...props}>
                    {Array.isArray(children)
                        ? children.map((child, i) =>
                            typeof child === 'string'
                                ? <CitationText key={i} content={child} sources={sources} onCitationClick={onCitationClick} />
                                : child
                        )
                        : typeof children === 'string'
                            ? <CitationText content={children} sources={sources} onCitationClick={onCitationClick} />
                            : children
                    }
                </li>
            );
        },
    }), [sources, onCitationClick]);

    return (
        <div className="space-y-6 w-full" data-testid="chat-response">
            {/* User message */}
            {userMessage && (
                <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tr-sm max-w-[85%] sm:max-w-[75%] shadow-sm" style={{ backgroundColor: '#0A7364', color: 'white' }}>
                        <p className="text-sm md:text-base leading-relaxed">{userMessage}</p>
                    </div>
                </div>
            )}

            {/* Assistant response - Using stable grid class for consistent width */}
            <div className="ai-response-grid">
                {/* Scoop icon - fixed 32px width matching ThinkingStepsLoader */}
                <div
                    className="w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'white', borderColor: '#E5E7EB' }}
                >
                    <ScoopLogo className="w-4 h-4" />
                </div>

                {/* Content - uses stable content class + streaming cursor */}
                <div className={`ai-response-content space-y-4 ${isStreaming && isEnabled('ui_streaming_cursor') ? 'streaming-cursor' : ''}`}>
                    {assistantContent ? (
                        hasProducts ? (
                            // Render with ProductCards
                            <>
                                {/* Intro text */}
                                {parsed.intro && (
                                    <div className={`prose prose-sm max-w-none text-foreground ${isStreaming ? 'animate-chunk' : ''}`}>
                                        <ReactMarkdown components={markdownComponents}>{parsed.intro}</ReactMarkdown>
                                    </div>
                                )}

                                {/* Product Cards */}
                                <div className="products-grid">
                                    {parsed.products.map((product, idx) => (
                                        <ProductCard
                                            key={idx}
                                            rank={product.rank}
                                            name={product.name}
                                            brand={product.brand}
                                            price={product.price}
                                            servings={product.servings}
                                            pricePerServing={product.pricePerServing}
                                            description={product.description}
                                            buyLink={product.buyLink}
                                        />
                                    ))}
                                </div>

                                {/* Outro text */}
                                {parsed.outro && (
                                    <div className={`prose prose-sm max-w-none text-foreground mt-4 ${isStreaming ? 'animate-chunk' : ''}`}>
                                        <ReactMarkdown components={markdownComponents}>{parsed.outro}</ReactMarkdown>
                                    </div>
                                )}

                                {/* Practical Tip - Amber style */}
                                {parsed.tip && (
                                    <div className="mt-4 p-4 rounded-2xl border" style={{ backgroundColor: 'var(--tip-bg)', borderColor: 'var(--tip-border)' }}>
                                        <div className="flex items-start gap-3">
                                            <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--tip-icon)' }} strokeWidth={2} />
                                            <div>
                                                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--tip-text)' }}>პრაქტიკული რჩევა</p>
                                                <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{parsed.tip}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            // Fallback: render cleaned markdown (TIP already extracted)
                            <>
                                <div className={`prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:underline ${isStreaming ? 'animate-chunk' : ''}`}>
                                    <ReactMarkdown components={markdownComponents}>{parsed.intro || normalizedContent}</ReactMarkdown>
                                </div>
                                {/* Practical Tip - Amber style */}
                                {parsed.tip && (
                                    <div className="mt-4 p-4 rounded-2xl border" style={{ backgroundColor: 'var(--tip-bg)', borderColor: 'var(--tip-border)' }}>
                                        <div className="flex items-start gap-3">
                                            <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--tip-icon)' }} strokeWidth={2} />
                                            <div>
                                                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--tip-text)' }}>პრაქტიკული რჩევა</p>
                                                <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{parsed.tip}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )
                    ) : (
                        <p className="text-muted-foreground italic">პასუხი იტვირთება...</p>
                    )}

                    {/* Bug E fix: Data-driven citation footer from sources array.
                       Filter to show only sources cited inline [N] — matches sidebar. */}
                    {!isStreaming && sources && sources.length > 0 && assistantContent && (() => {
                        const citedIds = parseCitedIds(normalizedContent || '');
                        const citedSources = citedIds.size > 0
                            ? sources.filter((_s, idx) => citedIds.has(idx + 1))
                            : sources; // fallback: show all if no inline citations
                        if (citedSources.length === 0) return null;
                        return (
                            <div className="citation-footer mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                                <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                                    📚 წყაროები:
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {citedSources.map((src) => {
                                        const originalIdx = sources.indexOf(src);
                                        return (
                                            <button
                                                key={src.id || originalIdx}
                                                className={`citation-footer-chip text-xs px-2 py-0.5 rounded-full cursor-pointer transition-colors ${isInfohubFamily(src.source) ? 'citation-chip--infohub' : 'citation-chip--active'}`}
                                                onClick={() => onCitationClick?.(originalIdx)}
                                                title={src.title}
                                                aria-label={`Source ${originalIdx + 1}: ${src.title}`}
                                            >
                                                [{originalIdx + 1}] {src.article_number
                                                    ? `მუხლი ${src.article_number}`
                                                    : `InfoHub: ${src.title?.slice(0, 30) || 'სახელმძღვანელო'}`
                                                }
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {quickReplies && quickReplies.length > 0 && (
                <div className="flex flex-col pt-2" style={{ marginLeft: 'calc(32px + 12px)' }}>
                    {quickReplies.map((reply) => (
                        <button
                            key={reply.id}
                            onClick={() => onQuickReplyClick?.(reply.id, reply.text)}
                            className="quick-reply-btn group flex items-center gap-2"
                        >
                            <CornerDownRight className="w-4 h-4" strokeWidth={1.5} />
                            <span>{reply.text}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
