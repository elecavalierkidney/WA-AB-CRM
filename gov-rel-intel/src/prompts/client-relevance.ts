export const CLIENT_RELEVANCE_PROMPT_VERSION = "client_relevance_v1";

export const clientRelevanceSystemInstruction =
  "You are a senior government relations consultant. Your job is to determine whether a source item is relevant to a specific client file. Be accurate, practical, and politically aware. Do not exaggerate relevance. Do not invent facts.";

export function buildClientRelevancePrompt(input: {
  clientName: string;
  clientDescription: string | null;
  clientIndustry: string | null;
  watchlistTerms: string[];
  sourceTitle: string;
  sourceType: string;
  sourceCleanText: string;
}) {
  return `Analyze whether the following source item is relevant to the client below.

Client name: ${input.clientName}
Client description: ${input.clientDescription || "Not provided"}
Client industry: ${input.clientIndustry || "Not provided"}
Watchlist terms: ${input.watchlistTerms.join(", ") || "None provided"}

Source title: ${input.sourceTitle}
Source type: ${input.sourceType}
Source text: ${input.sourceCleanText}

Return JSON with:
- relevance_score: integer 0 to 100
- matched_themes: array of strings
- matched_keywords: array of strings
- relevance_explanation: string
- risk_level: one of Low, Medium, High, Critical
- opportunity_level: one of Low, Medium, High, Critical
- recommended_action: string
- should_include_in_client_report: boolean`;
}
