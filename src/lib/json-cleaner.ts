/**
 * Sanitizes AI responses by removing raw JSON action blocks.
 * This prevents tool-call metadata from leaking into the UI.
 */
export function cleanAIResponse(text: string): {
    cleanText: string;
    extractedJson: unknown | null;
    rawJson: string | null;
} {
    if (!text) return { cleanText: '', extractedJson: null, rawJson: null };

    // Common markers that indicate a JSON action
    const markers = ['"action"', '"auto_memory"', '"freepik_prompt"', '"search_query"', '"backend"'];

    let bestMatch = { index: -1, marker: '' };

    for (const marker of markers) {
        const index = text.indexOf(marker);
        if (index !== -1 && (bestMatch.index === -1 || index < bestMatch.index)) {
            bestMatch = { index, marker };
        }
    }

    if (bestMatch.index === -1) {
        return { cleanText: text.trim(), extractedJson: null, rawJson: null };
    }

    // Try to find the encompassing curly braces
    let startIndex = -1;
    for (let i = bestMatch.index; i >= 0; i--) {
        if (text[i] === '{') {
            startIndex = i;
            break;
        }
    }

    if (startIndex === -1) {
        return { cleanText: text.trim(), extractedJson: null, rawJson: null };
    }

    // Find the closing brace with balancing
    let balance = 0;
    let endIndex = -1;
    let inString = false;

    for (let j = startIndex; j < text.length; j++) {
        const char = text[j];
        if (char === '"' && text[j - 1] !== '\\') {
            inString = !inString;
        }

        if (!inString) {
            if (char === '{') balance++;
            else if (char === '}') balance--;
        }

        if (balance === 0 && j > startIndex) {
            endIndex = j;
            break;
        }
    }

    if (endIndex === -1) {
        return { cleanText: text.trim(), extractedJson: null, rawJson: null };
    }

    const rawJson = text.substring(startIndex, endIndex + 1);
    let extractedJson = null;
    try {
        extractedJson = JSON.parse(rawJson);
    } catch (e) {
        console.warn("[JSON Cleaner] Found potential JSON but failed to parse:", e);
    }

    // Remove the JSON block and any surrounding code fences
    const before = text.substring(0, startIndex);
    const after = text.substring(endIndex + 1);

    let cleanBefore = before.trim();
    let cleanAfter = after.trim();

    // Clean up markdown block remnants if they exist
    if (cleanBefore.endsWith('```json')) cleanBefore = cleanBefore.substring(0, cleanBefore.length - 7).trim();
    else if (cleanBefore.endsWith('```')) cleanBefore = cleanBefore.substring(0, cleanBefore.length - 3).trim();

    if (cleanAfter.startsWith('```')) cleanAfter = cleanAfter.substring(3).trim();

    const cleanText = (cleanBefore + '\n' + cleanAfter).trim();

    return { cleanText, extractedJson, rawJson };
}
