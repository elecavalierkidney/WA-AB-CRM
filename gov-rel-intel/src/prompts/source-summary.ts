export const SOURCE_SUMMARY_PROMPT_VERSION = "source_summary_v1";

export const sourceSummarySystemInstruction =
  "You are a government relations analyst. Summarize the source item accurately and concisely. Do not invent facts. If a detail is not present in the source text, do not include it.";

export function buildSourceSummaryPrompt(input: {
  title: string;
  sourceType: string;
  publishedDate: string | null;
  cleanText: string;
}) {
  return `Summarize the following government or political source item in 3 to 5 sentences.
Identify the announcement, key actors, affected sectors, major numbers, and any stated next steps.
Also return 3 to 8 topic tags as short phrases.

Title: ${input.title}
Source type: ${input.sourceType}
Published date: ${input.publishedDate || "Unknown"}
Text: ${input.cleanText}`;
}
