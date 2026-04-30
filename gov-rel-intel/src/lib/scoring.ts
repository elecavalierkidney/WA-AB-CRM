interface WatchlistTerm {
  keyword: string;
  category: string | null;
  weight: number;
}

export interface KeywordMatchResult {
  matchedKeywords: string[];
  matchedThemes: string[];
  relevanceScore: number;
  relevanceExplanation: string;
}

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function includesKeyword(normalizedText: string, keyword: string) {
  const normalizedKeyword = normalize(keyword);
  return normalizedKeyword.length > 0 && normalizedText.includes(normalizedKeyword);
}

export function computeKeywordMatch(
  sourceText: string,
  clientName: string,
  watchlistTerms: WatchlistTerm[],
): KeywordMatchResult | null {
  const normalizedSource = normalize(sourceText);
  const matched = watchlistTerms.filter((term) => includesKeyword(normalizedSource, term.keyword));

  if (matched.length === 0) {
    return null;
  }

  const uniqueKeywords = [...new Set(matched.map((term) => term.keyword.trim()))];
  const uniqueThemes = [...new Set(matched.map((term) => term.category).filter(Boolean))] as string[];
  const weightedTotal = matched.reduce((sum, term) => sum + Math.max(1, term.weight), 0);
  const densityBonus = Math.min(25, matched.length * 6);
  const score = Math.min(100, Math.round(weightedTotal * 8 + densityBonus));
  const explanation = `Matched ${uniqueKeywords.length} watchlist term(s) for ${clientName}: ${uniqueKeywords.join(", ")}.`;

  return {
    matchedKeywords: uniqueKeywords,
    matchedThemes: uniqueThemes,
    relevanceScore: score,
    relevanceExplanation: explanation,
  };
}
