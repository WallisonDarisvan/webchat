export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculates realistic reading and typing delay:
 * Base time (2000ms to 3500ms) + (characters * 35ms)
 * Clamped to prevent excessively long waits (max 7500ms)
 */
export function calculateTypingDelay(text: string, options?: { minBase?: number; maxBase?: number; maxTotal?: number }): number {
  const minBase = options?.minBase ?? 2000;
  const maxBase = options?.maxBase ?? 3500;
  const maxTotal = options?.maxTotal ?? 7500;

  const baseDelay = Math.floor(Math.random() * (maxBase - minBase + 1)) + minBase;
  const typingDelay = text.length * 35;
  const total = baseDelay + typingDelay;

  return Math.min(total, maxTotal);
}

/**
 * Splits text into 1 to 3 distinct conversational bubbles.
 * Natural human messengers break longer ideas into 2-3 separate messages.
 */
export function splitIntoBubbles(fullText: string): string[] {
  const cleaned = fullText.trim();
  if (!cleaned) return [];

  // First, check if there are paragraph splits (\n\n or \n)
  const paragraphs = cleaned
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length >= 2 && paragraphs.length <= 3) {
    return paragraphs;
  }

  if (paragraphs.length > 3) {
    // Combine into 3 bubbles
    const bubble1 = paragraphs[0];
    const bubble2 = paragraphs.slice(1, paragraphs.length - 1).join("\n\n");
    const bubble3 = paragraphs[paragraphs.length - 1];
    return [bubble1, bubble2, bubble3].filter(Boolean);
  }

  // If it's a single block of text, see if it has multiple sentences that justify splitting
  // Regex looks for sentence ending punctuation followed by space and capital letter or end
  const sentences = cleaned
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÀÂÊÔÃÕ0-9"'])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (sentences.length >= 2 && cleaned.length > 90) {
    if (sentences.length === 2) {
      return sentences;
    }
    // 3 or more sentences: group into 2 or 3 bubbles
    if (sentences.length === 3) {
      return sentences;
    }

    const midpoint = Math.ceil(sentences.length / 2);
    const firstPart = sentences.slice(0, midpoint).join(" ");
    const secondPart = sentences.slice(midpoint).join(" ");
    return [firstPart, secondPart];
  }

  // Otherwise return as single bubble
  return [cleaned];
}

