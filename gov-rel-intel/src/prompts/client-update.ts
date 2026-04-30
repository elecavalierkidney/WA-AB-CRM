export const CLIENT_UPDATE_PROMPT_VERSION = "client_update_v1";

export const clientUpdateSystemInstruction =
  "You are a government relations consultant writing a concise client update paragraph. Be accurate, practical, and avoid speculation. Do not invent facts.";

export function buildClientUpdatePrompt(input: {
  clientName: string;
  sourceTitle: string;
  sourceType: string;
  sourceSummary: string;
  relevanceExplanation: string;
  recommendedAction: string;
}) {
  return `Draft a concise client-ready update paragraph using this context.

Client: ${input.clientName}
Source title: ${input.sourceTitle}
Source type: ${input.sourceType}
Source summary: ${input.sourceSummary}
Why it matters to the client: ${input.relevanceExplanation}
Recommended action: ${input.recommendedAction}

Requirements:
- 4 to 7 sentences
- professional, practical tone
- include only facts grounded in provided context
- include one clear suggested next step

Return JSON with:
- update_paragraph: string`;
}
