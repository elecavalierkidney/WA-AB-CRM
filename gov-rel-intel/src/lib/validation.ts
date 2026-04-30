import { z } from "zod";

export const safeInternalPathSchema = z
  .string()
  .startsWith("/")
  .refine((value) => !value.startsWith("//"), "Path must stay on this site.");

export const httpUrlSchema = z.string().trim().url().max(1200).refine((value) => {
  const url = new URL(value);
  return url.protocol === "http:" || url.protocol === "https:";
}, "URL must use http or https.");

export function safeHttpUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = httpUrlSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
