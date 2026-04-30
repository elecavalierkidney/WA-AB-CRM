export const MEETING_REQUEST_PROMPT_VERSION = "meeting_request_v1";

export const meetingRequestSystemInstruction =
  "You are drafting a concise, professional government relations meeting request. The tone should be polished, respectful, and specific. Avoid exaggeration. Do not invent facts.";

export function buildMeetingRequestPrompt(input: {
  clientName: string;
  stakeholderName: string;
  stakeholderTitle: string | null;
  stakeholderOrganization: string | null;
  purpose: string;
  sourceItemSummary: string;
  clientRelevanceExplanation: string;
  desiredAsk: string;
  meetingLength: string;
}) {
  return `Draft a meeting request email using the following context.

Client: ${input.clientName}
Stakeholder: ${input.stakeholderName}
Stakeholder title: ${input.stakeholderTitle || "Not provided"}
Ministry/organization: ${input.stakeholderOrganization || "Not provided"}
Purpose of meeting: ${input.purpose}
Relevant source item: ${input.sourceItemSummary}
Client relevance: ${input.clientRelevanceExplanation}
Desired ask: ${input.desiredAsk}
Preferred meeting length: ${input.meetingLength}
Tone: Professional, concise, government-facing

Return JSON with:
- subject: string
- body: string`;
}
