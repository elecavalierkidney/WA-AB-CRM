import "server-only";

import OpenAI from "openai";
import { z } from "zod";

import { buildClientUpdatePrompt, clientUpdateSystemInstruction } from "@/prompts/client-update";
import { buildClientRelevancePrompt, clientRelevanceSystemInstruction } from "@/prompts/client-relevance";
import { buildMeetingRequestPrompt, meetingRequestSystemInstruction } from "@/prompts/meeting-request";
import { buildSourceSummaryPrompt, sourceSummarySystemInstruction } from "@/prompts/source-summary";

const sourceSummarySchema = z.object({
  summary: z.string().min(20),
  topic_tags: z.array(z.string().min(2)).min(1).max(12),
});

const clientRelevanceSchema = z.object({
  relevance_score: z.number().int().min(0).max(100),
  matched_themes: z.array(z.string()),
  matched_keywords: z.array(z.string()),
  relevance_explanation: z.string().min(10),
  risk_level: z.enum(["Low", "Medium", "High", "Critical"]),
  opportunity_level: z.enum(["Low", "Medium", "High", "Critical"]),
  recommended_action: z.string().min(10),
  should_include_in_client_report: z.boolean(),
});

const meetingRequestSchema = z.object({
  subject: z.string().min(3),
  body: z.string().min(20),
});

const clientUpdateSchema = z.object({
  update_paragraph: z.string().min(20),
});

export type SourceSummaryResult = z.infer<typeof sourceSummarySchema>;
export type ClientRelevanceResult = z.infer<typeof clientRelevanceSchema>;
export type MeetingRequestResult = z.infer<typeof meetingRequestSchema>;
export type ClientUpdateResult = z.infer<typeof clientUpdateSchema>;

function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY.");
  }
  return new OpenAI({ apiKey });
}

function getModel() {
  return process.env.OPENAI_MODEL || "gpt-5.2";
}

function extractJson<T>(text: string, validator: z.ZodType<T>) {
  const parsed = JSON.parse(text);
  return validator.parse(parsed);
}

export async function generateSourceSummary(input: {
  title: string;
  sourceType: string;
  publishedDate: string | null;
  cleanText: string;
}) {
  const client = createOpenAIClient();
  const response = await client.responses.create({
    model: getModel(),
    input: [
      { role: "developer", content: sourceSummarySystemInstruction },
      { role: "user", content: buildSourceSummaryPrompt(input) },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "source_summary",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["summary", "topic_tags"],
          properties: {
            summary: { type: "string" },
            topic_tags: {
              type: "array",
              items: { type: "string" },
              minItems: 1,
              maxItems: 12,
            },
          },
        },
      },
    },
  });

  const outputText = response.output_text;
  const result = extractJson(outputText, sourceSummarySchema);

  return {
    model: response.model,
    inputSnapshot: input,
    rawText: outputText,
    result,
  };
}

export async function generateClientRelevance(input: {
  clientName: string;
  clientDescription: string | null;
  clientIndustry: string | null;
  watchlistTerms: string[];
  sourceTitle: string;
  sourceType: string;
  sourceCleanText: string;
}) {
  const client = createOpenAIClient();
  const response = await client.responses.create({
    model: getModel(),
    input: [
      { role: "developer", content: clientRelevanceSystemInstruction },
      { role: "user", content: buildClientRelevancePrompt(input) },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "client_relevance",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: [
            "relevance_score",
            "matched_themes",
            "matched_keywords",
            "relevance_explanation",
            "risk_level",
            "opportunity_level",
            "recommended_action",
            "should_include_in_client_report",
          ],
          properties: {
            relevance_score: { type: "integer", minimum: 0, maximum: 100 },
            matched_themes: { type: "array", items: { type: "string" } },
            matched_keywords: { type: "array", items: { type: "string" } },
            relevance_explanation: { type: "string" },
            risk_level: { type: "string", enum: ["Low", "Medium", "High", "Critical"] },
            opportunity_level: { type: "string", enum: ["Low", "Medium", "High", "Critical"] },
            recommended_action: { type: "string" },
            should_include_in_client_report: { type: "boolean" },
          },
        },
      },
    },
  });

  const outputText = response.output_text;
  const result = extractJson(outputText, clientRelevanceSchema);

  return {
    model: response.model,
    inputSnapshot: input,
    rawText: outputText,
    result,
  };
}

export async function generateMeetingRequest(input: {
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
  const client = createOpenAIClient();
  const response = await client.responses.create({
    model: getModel(),
    input: [
      { role: "developer", content: meetingRequestSystemInstruction },
      { role: "user", content: buildMeetingRequestPrompt(input) },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "meeting_request",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["subject", "body"],
          properties: {
            subject: { type: "string" },
            body: { type: "string" },
          },
        },
      },
    },
  });

  const outputText = response.output_text;
  const result = extractJson(outputText, meetingRequestSchema);

  return {
    model: response.model,
    inputSnapshot: input,
    rawText: outputText,
    result,
  };
}

export async function generateClientUpdate(input: {
  clientName: string;
  sourceTitle: string;
  sourceType: string;
  sourceSummary: string;
  relevanceExplanation: string;
  recommendedAction: string;
}) {
  const client = createOpenAIClient();
  const response = await client.responses.create({
    model: getModel(),
    input: [
      { role: "developer", content: clientUpdateSystemInstruction },
      { role: "user", content: buildClientUpdatePrompt(input) },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "client_update",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["update_paragraph"],
          properties: {
            update_paragraph: { type: "string" },
          },
        },
      },
    },
  });

  const outputText = response.output_text;
  const result = extractJson(outputText, clientUpdateSchema);

  return {
    model: response.model,
    inputSnapshot: input,
    rawText: outputText,
    result,
  };
}
