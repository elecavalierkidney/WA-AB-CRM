"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { GENERAL_CONTACT_TYPES } from "@/lib/constants";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const contactSchema = z.object({
  firstName: z.string().trim().max(120).optional(),
  lastName: z.string().trim().max(120).optional(),
  fullName: z.string().trim().min(2).max(240),
  title: z.string().trim().max(240).optional(),
  organization: z.string().trim().max(240).optional(),
  contactType: z.enum(GENERAL_CONTACT_TYPES).default("Other"),
  email: z.string().trim().email().max(320).optional(),
  phone: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(8000).optional(),
});

type DirectoryRow = Record<string, unknown>;
type ParsedContact = z.infer<typeof contactSchema>;

function rowsFromCells(cells: unknown[][]) {
  const [headers, ...body] = cells;
  if (!headers) {
    return [];
  }

  return body.map((row) => {
    const item: DirectoryRow = {};
    headers.forEach((header, index) => {
      if (header !== null && header !== undefined && String(header).trim()) {
        item[String(header)] = row[index] ?? "";
      }
    });
    return item;
  });
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  rows.push(row);
  return rows.filter((csvRow) => csvRow.some((value) => value.trim()));
}

async function readDirectoryRows(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".csv") || file.type === "text/csv") {
    return rowsFromCells(parseCsv(buffer.toString("utf8")));
  }

  const { readSheet } = await import("read-excel-file/node");
  return rowsFromCells((await readSheet(buffer)) as unknown[][]);
}

function readText(row: DirectoryRow, aliases: string[]) {
  for (const alias of aliases) {
    const value = row[alias];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number") {
      return String(value);
    }
  }

  return undefined;
}

function normalizeRow(row: DirectoryRow) {
  const normalized: DirectoryRow = {};

  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]+/g, "");
    normalized[normalizedKey] = value;
  }

  return normalized;
}

function splitName(fullName: string) {
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return { firstName: undefined, lastName: undefined };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1),
  };
}

function parseContact(row: DirectoryRow) {
  const normalized = normalizeRow(row);
  const firstName = readText(normalized, ["firstname", "givenname", "first"]);
  const lastName = readText(normalized, ["lastname", "surname", "familyname", "last"]);
  const fullName =
    readText(normalized, ["fullname", "name", "contact", "contactname", "displayname"]) ||
    [firstName, lastName].filter(Boolean).join(" ");
  const fallbackNames = fullName ? splitName(fullName) : { firstName: undefined, lastName: undefined };
  const contactType = readText(normalized, ["type", "contacttype", "category"]);

  return contactSchema.safeParse({
    firstName: firstName || fallbackNames.firstName,
    lastName: lastName || fallbackNames.lastName,
    fullName,
    title: readText(normalized, ["title", "jobtitle", "role", "position"]),
    organization: readText(normalized, ["organization", "organisation", "company", "employer", "agency"]),
    contactType: GENERAL_CONTACT_TYPES.includes(contactType as (typeof GENERAL_CONTACT_TYPES)[number])
      ? contactType
      : "Other",
    email: readText(normalized, ["email", "emailaddress", "mail"]) || undefined,
    phone: readText(normalized, ["phone", "phonenumber", "telephone", "mobile", "cell"]) || undefined,
    notes: readText(normalized, ["notes", "note", "comments", "description"]),
  });
}

export async function createContactAction(formData: FormData) {
  const parsed = contactSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    fullName: formData.get("fullName"),
    title: formData.get("title"),
    organization: formData.get("organization"),
    contactType: formData.get("contactType") || "Other",
    email: formData.get("email") || undefined,
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return;
  }

  await requireAuthenticatedUser();
  const supabase = createSupabaseAdminClient();
  await supabase.from("stakeholders").insert({
    first_name: parsed.data.firstName || null,
    last_name: parsed.data.lastName || null,
    full_name: parsed.data.fullName,
    title: parsed.data.title || null,
    organization: parsed.data.organization || null,
    stakeholder_type: parsed.data.contactType,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    notes: parsed.data.notes || null,
  });

  revalidatePath("/contacts");
}

export async function importContactsAction(formData: FormData) {
  const file = formData.get("directory");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/contacts?imported=0&skipped=0&error=missing-file");
  }

  await requireAuthenticatedUser();

  const rows = await readDirectoryRows(file);

  const parsedRows = rows.map(parseContact);
  const contacts = parsedRows
    .filter((row): row is { success: true; data: ParsedContact } => row.success)
    .map((row) => row.data);

  if (contacts.length === 0) {
    redirect(`/contacts?imported=0&skipped=${rows.length}&error=no-valid-rows`);
  }

  const supabase = createSupabaseAdminClient();
  const { data: existing } = await supabase
    .from("stakeholders")
    .select("full_name, organization, email")
    .in("stakeholder_type", [...GENERAL_CONTACT_TYPES]);
  const seen = new Set(
    (existing ?? []).map((contact) =>
      contact.email
        ? `email:${contact.email.toLowerCase()}`
        : `name:${contact.full_name.toLowerCase()}|${(contact.organization ?? "").toLowerCase()}`,
    ),
  );
  const inserted = [];

  for (const contact of contacts) {
    const key = contact.email
      ? `email:${contact.email.toLowerCase()}`
      : `name:${contact.fullName.toLowerCase()}|${(contact.organization ?? "").toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    inserted.push({
      first_name: contact.firstName || null,
      last_name: contact.lastName || null,
      full_name: contact.fullName,
      title: contact.title || null,
      organization: contact.organization || null,
      stakeholder_type: contact.contactType,
      email: contact.email || null,
      phone: contact.phone || null,
      notes: contact.notes || null,
    });
  }

  if (inserted.length > 0) {
    await supabase.from("stakeholders").insert(inserted);
  }

  revalidatePath("/contacts");
  revalidatePath("/stakeholders");
  redirect(`/contacts?imported=${inserted.length}&skipped=${rows.length - inserted.length}`);
}
