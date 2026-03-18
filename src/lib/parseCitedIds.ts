/**
 * parseCitedIds — Citation Marker Extractor
 * ==========================================
 *
 * Parses assistant response text for inline citation markers [N]
 * and returns the set of cited 1-based source indices.
 *
 * Regex: /\[(\d{1,3})\](?!\()/g
 *   - Matches [1], [2], … [999]
 *   - Negative lookahead (?!\() ignores markdown links [text](url)
 *   - Same pattern as CITATION_REGEX in chat-response.tsx
 *
 * Used in Chat.tsx to derive filteredSources from citationSources,
 * ensuring the CitationPanel shows only articles actually cited.
 */

const CITATION_RE = /\[(\d{1,3})\](?!\()/g;

/**
 * Extract all [N] citation numbers from a text string.
 *
 * @param text - Assistant response content (partial or complete)
 * @returns Set of 1-based citation numbers found in text
 *
 * @example
 * parseCitedIds("See [1] and [3] for details") // Set {1, 3}
 * parseCitedIds("No citations here")            // Set {}
 * parseCitedIds("[link](https://example.com)")  // Set {}  ← ignored
 */
export function parseCitedIds(text: string): Set<number> {
    const ids = new Set<number>();
    if (!text) return ids;

    // Re-create regex each call to reset lastIndex (stateless)
    const re = new RegExp(CITATION_RE.source, 'g');
    let m: RegExpExecArray | null;

    while ((m = re.exec(text)) !== null) {
        ids.add(parseInt(m[1], 10));
    }

    return ids;
}
