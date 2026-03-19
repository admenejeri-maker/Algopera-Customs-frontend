'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ExternalLink, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SourceDetail } from '@/types/api';
import './CitationPanel.css';

// ============================================================================
// Types
// ============================================================================

interface CitationPanelProps {
    sources: SourceDetail[];
    isOpen: boolean;
    activeIndex: number | null;
    onClose: () => void;
    onSourceClick: (index: number) => void;
}

// ============================================================================
// Helpers
// ============================================================================

/** Whitelist safe URL protocols to prevent javascript: XSS */
function isSafeUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

/** Source type → Georgian label + family for CSS class selection */
const SOURCE_TYPE_MAP: Record<string, { label: string; family: 'infohub' | 'matsne' }> = {
    infohub_tax_code:   { label: 'საგადასახადო კოდექსი', family: 'infohub' },
    infohub_normative:  { label: 'ნორმატიული აქტი', family: 'infohub' },
    infohub_admin:      { label: 'ადმინისტრაციული აქტი', family: 'infohub' },
    infohub_legislative:{ label: 'საკანონმდებლო აქტი', family: 'infohub' },
    infohub_sm:         { label: 'სიტუაციური სახელმძღვანელო', family: 'infohub' },
    infohub:            { label: 'ინფოჰაბი', family: 'infohub' },
    matsne:             { label: 'საკანონმდებლო მაცნე', family: 'matsne' },
};

/** Check if a source belongs to the infohub family */
function isInfohubFamily(source?: string): boolean {
    if (!source) return false;
    return SOURCE_TYPE_MAP[source]?.family === 'infohub';
}

// ============================================================================
// Component
// ============================================================================

export function CitationPanel({
    sources,
    isOpen,
    activeIndex,
    onClose,
    onSourceClick,
}: CitationPanelProps) {
    const panelRef = useRef<HTMLDivElement>(null);

    // ── Internal display index (decoupled from parent toggle logic) ─────
    const [displayIndex, setDisplayIndex] = useState(activeIndex ?? 0);

    // Sync when parent changes activeIndex (e.g. user clicks a different chip)
    useEffect(() => {
        if (activeIndex !== null) {
            setDisplayIndex(activeIndex);
        }
    }, [activeIndex]);

    // ── Escape key handler ──────────────────────────────────────────────
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    // ── Navigation handlers ─────────────────────────────────────────────
    const safeIndex = Math.max(0, Math.min(displayIndex, sources.length - 1));
    const canGoPrev = safeIndex > 0;
    const canGoNext = safeIndex < sources.length - 1;

    const goToPrev = useCallback(() => {
        if (canGoPrev) setDisplayIndex((i) => i - 1);
    }, [canGoPrev]);

    const goToNext = useCallback(() => {
        if (canGoNext) setDisplayIndex((i) => i + 1);
    }, [canGoNext]);

    // ── Bail if no sources ──────────────────────────────────────────────
    if (sources.length === 0) return null;

    const source = sources[safeIndex];
    if (!source) return null;

    const isSituationalGuide = source.domain === 'SITUATIONAL_GUIDE';

    return (
        <>
            {/* Backdrop (mobile) */}
            {isOpen && (
                <div
                    className="citation-backdrop"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Panel */}
            <aside
                ref={panelRef}
                className={`citation-panel ${isOpen ? 'citation-panel--open' : ''}`}
                role="complementary"
                aria-label="Citation sources"
                aria-hidden={!isOpen}
            >
                {/* ── Header ────────────────────────────────────── */}
                <div className="citation-panel__header">
                    <div className="citation-panel__title">
                        <BookOpen size={18} />
                        <span>წყარო</span>
                        <span className="citation-panel__badge">
                            {sources.length}
                        </span>
                    </div>
                    <button
                        className="citation-panel__close"
                        onClick={onClose}
                        aria-label="Close citation panel"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ── Single source content ─────────────────────── */}
                <div className="citation-panel__content">
                    <div
                        className={`citation-card citation-card--active${isSituationalGuide ? ' citation-card--guide' : ''}`}
                        role="article"
                        aria-label={`Source ${safeIndex + 1} of ${sources.length}`}
                    >
                        {/* Number badge */}
                        <div className="citation-card__number">
                            {safeIndex + 1}
                        </div>

                        {/* Content */}
                        <div className="citation-card__content">
                            <h4 className="citation-card__title">
                                {source.title || (source.article_number ? `მუხლი ${source.article_number}` : 'სიტუაციური სახელმძღვანელო')}
                            </h4>

                            <div className="citation-card__meta">
                                {isSituationalGuide && (
                                    <span className="citation-card__guide-badge">
                                        სიტუაციური სახელმძღვანელო
                                    </span>
                                )}
                                {!isSituationalGuide && source.article_number && (
                                    <span className="citation-card__article-num">
                                        მუხ. {source.article_number}
                                    </span>
                                )}
                                {!isSituationalGuide && !source.article_number && isInfohubFamily(source.source) && (
                                    <span className="citation-card__article-num" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                                        ინფოჰაბი
                                    </span>
                                )}
                                {source.score > 0 && (
                                    <span className="citation-card__score">
                                        {source.score <= 1
                                            ? Math.round(source.score * 100)
                                            : Math.min(99, Math.round(source.score * 4.76))
                                        }%
                                    </span>
                                )}
                            </div>

                            {/* Source text content */}
                            {source.text && (
                                <div className="citation-card__text">
                                    <p>{source.text}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Navigation ────────────────────────────────── */}
                {sources.length > 1 && (
                    <div className="citation-nav">
                        <button
                            className="citation-nav__btn"
                            onClick={goToPrev}
                            disabled={!canGoPrev}
                            aria-label="Previous source"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="citation-nav__counter">
                            {safeIndex + 1} / {sources.length}
                        </span>
                        <button
                            className="citation-nav__btn"
                            onClick={goToNext}
                            disabled={!canGoNext}
                            aria-label="Next source"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}

                {/* ── Footer: Matsne link ──────────────────────── */}
                {source.url && isSafeUrl(source.url) && (
                    <div className="citation-panel__footer">
                        <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="citation-panel__footer-link"
                            aria-label={`View source: ${source.title}`}
                        >
                            <ExternalLink size={14} />
                            <span>{isSituationalGuide ? 'ინფოჰაბზე ნახვა' : isInfohubFamily(source.source) ? 'ინფოჰაბზე ნახვა' : 'მაცნეზე ნახვა'}</span>
                        </a>
                    </div>
                )}
            </aside>
        </>
    );
}
