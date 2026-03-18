/**
 * Response Parser — Layer 2 of 3-Layer Defense
 * =============================================
 *
 * Strips the model's redundant sources footer from text body.
 * Real sources already arrive via SSE JSON (separate "sources" event).
 *
 * Strategy 1: Match 📚 წყაროები heading (primary anchor)
 * Strategy 2: Match წყარო: footer (fallback if model skips emoji)
 */

/**
 * Strip model's redundant sources footer from response text.
 * Sources data is already provided via SSE JSON — this just cleans the text.
 *
 * Runs on EVERY render (streaming + complete) to prevent the "flash" effect
 * where sources text appears live then vanishes when streaming ends.
 *
 * @param content - Raw assistant text content (may include sources footer)
 * @returns Cleaned text with sources footer removed
 */
export function stripSourcesFooter(content: string): string {
    // Strategy 1: Remove 📚 წყაროები section (primary — matches ~90% of cases)
    const idx = content.search(/\n?📚\s*წყაროები/);
    if (idx > 0) {
        const clean = content.slice(0, idx).trimEnd();
        // Bug G fix: preserve backend disclaimer lines (⚠️ red-zone, ⏰ temporal)
        const disclaimers = _extractDisclaimers(content.slice(idx));
        return disclaimers ? `${clean}\n\n${disclaimers}` : clean;
    }

    // Strategy 2: Remove "წყარო:" footer (fallback if model skips emoji)
    // Only match if it's in the bottom half of the response (guardrail)
    const match = content.match(/\n?წყარო:\s*\[[\s\S]*$/m);
    if (match?.index && match.index > content.length * 0.5) {
        const clean = content.slice(0, match.index).trimEnd();
        const disclaimers = _extractDisclaimers(content.slice(match.index));
        return disclaimers ? `${clean}\n\n${disclaimers}` : clean;
    }

    return content;
}

/**
 * Extract backend disclaimer lines (⚠️ red-zone, ⏰ temporal) from stripped text.
 * These are injected by rag_pipeline.py AFTER the LLM finishes generating,
 * so they end up below the LLM's sources footer and get cut by the slice.
 *
 * @internal
 */
function _extractDisclaimers(stripped: string): string {
    return stripped
        .split('\n')
        .filter(line => {
            const t = line.trim();
            return t.startsWith('⚠') || t.startsWith('⏰');
        })
        .join('\n');
}

/**
 * Ensure minimal Markdown formatting on model response.
 * Layer 2 insurance: if the model returns plain text despite prompt instructions,
 * this function adds bold to the first sentence (the "direct answer").
 *
 * Pipeline: raw → stripSourcesFooter → ensureMarkdownFormatting → render
 *
 * @param content - Text content (already stripped of sources footer)
 * @returns Content with first sentence bolded (if not already formatted)
 */
export function ensureMarkdownFormatting(content: string): string {
    if (!content || content.length < 10) return content;

    // Skip if content already has Markdown bold markers
    if (content.includes('**')) return content;

    // Bold the first sentence (up to first period + space, or first newline)
    const firstBreak = content.search(/[.!?]\s|\n/);
    if (firstBreak > 0 && firstBreak < 200) {
        const endIdx = firstBreak + 1; // include the punctuation
        return `**${content.slice(0, endIdx)}**${content.slice(endIdx)}`;
    }

    return content;
}

/**
 * Normalize Unicode bullets (•) to standard markdown list markers (- ).
 * Safety net: ensures proper <li> rendering even if the model uses •
 * instead of standard markdown syntax.
 *
 * Only converts • at the START of a line (preserves mid-line •).
 *
 * Pipeline: raw → stripSourcesFooter → ensureMarkdownFormatting → normalizeMarkdownBullets → render
 *
 * @param content - Text content (already formatted)
 * @returns Content with line-start • replaced by -
 */
export function normalizeMarkdownBullets(content: string): string {
    if (!content) return content;
    return content.replace(/^•\s*/gm, '- ');
}
