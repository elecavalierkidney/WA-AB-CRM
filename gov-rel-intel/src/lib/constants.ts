export const APP_NAME = "Government Relations Intelligence Platform";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/intelligence", label: "Intelligence" },
  { href: "/contacts", label: "Contacts" },
  { href: "/stakeholders", label: "Government contacts" },
  { href: "/tasks", label: "Tasks" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
] as const;

export const OPEN_TASK_STATUSES = ["Not started", "In progress", "Waiting"] as const;

export const CLIENT_MATCH_STATUSES = [
  "New",
  "Reviewed",
  "Relevant",
  "Not relevant",
  "Action required",
  "Added to report",
  "Archived",
] as const;

export const SOURCE_TYPES = [
  "Alberta News Release",
  "Manual Entry",
  "Newsletter Import",
  "Orders in Council",
  "Bill Update",
  "Hansard",
  "Committee Transcript",
  "Budget Document",
  "Other",
] as const;

export const STAKEHOLDER_TYPES = [
  "Premier",
  "Minister",
  "Associate Minister",
  "Parliamentary Secretary",
  "MLA",
  "Chief of Staff",
  "Political Staff",
  "Deputy Minister",
  "Assistant Deputy Minister",
  "Department Official",
  "Municipal Elected Official",
  "Municipal Administrator",
  "Federal Elected Official",
  "Federal Staff",
  "Industry Association",
  "Client Contact",
  "Media Contact",
  "Other",
] as const;

export const GOVERNMENT_STAKEHOLDER_TYPES = [
  "Premier",
  "Minister",
  "Associate Minister",
  "Parliamentary Secretary",
  "MLA",
  "Chief of Staff",
  "Political Staff",
  "Deputy Minister",
  "Assistant Deputy Minister",
  "Department Official",
  "Municipal Elected Official",
  "Municipal Administrator",
  "Federal Elected Official",
  "Federal Staff",
] as const;

export const GENERAL_CONTACT_TYPES = [
  "Industry Association",
  "Client Contact",
  "Media Contact",
  "Other",
] as const;

export const RELATIONSHIP_STRENGTHS = [
  "Unknown",
  "No relationship",
  "Introductory contact",
  "Warm relationship",
  "Strong relationship",
  "Champion",
  "Concern/Opposed",
] as const;

export const STRATEGIC_VALUES = ["Low", "Medium", "High", "Critical"] as const;

export const POSITION_ON_ISSUE_VALUES = [
  "Unknown",
  "Supportive",
  "Neutral",
  "Concerned",
  "Opposed",
  "Mixed",
] as const;

export const INTERACTION_TYPES = [
  "Meeting",
  "Phone call",
  "Email",
  "Event conversation",
  "Letter sent",
  "Briefing sent",
  "Follow-up",
  "Introductory outreach",
  "Internal note",
] as const;

export const TASK_PRIORITY_STYLES: Record<string, string> = {
  Low: "bg-slate-100 text-slate-700 border-slate-200",
  Medium: "bg-blue-100 text-blue-700 border-blue-200",
  High: "bg-amber-100 text-amber-800 border-amber-200",
  Urgent: "bg-red-100 text-red-700 border-red-200",
};

export const TASK_STATUS_STYLES: Record<string, string> = {
  "Not started": "bg-slate-100 text-slate-700 border-slate-200",
  "In progress": "bg-indigo-100 text-indigo-700 border-indigo-200",
  Waiting: "bg-amber-100 text-amber-800 border-amber-200",
  Complete: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Cancelled: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

export const CLIENT_MATCH_STATUS_STYLES: Record<string, string> = {
  New: "bg-sky-100 text-sky-800 border-sky-200",
  Reviewed: "bg-slate-100 text-slate-700 border-slate-200",
  Relevant: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Not relevant": "bg-zinc-100 text-zinc-700 border-zinc-200",
  "Action required": "bg-rose-100 text-rose-700 border-rose-200",
  "Added to report": "bg-indigo-100 text-indigo-700 border-indigo-200",
  Archived: "bg-slate-100 text-slate-600 border-slate-200",
};

export const SOURCE_TYPE_STYLES: Record<string, string> = {
  "Alberta News Release": "bg-blue-100 text-blue-800 border-blue-200",
  "Manual Entry": "bg-slate-100 text-slate-700 border-slate-200",
  "Newsletter Import": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Orders in Council": "bg-violet-100 text-violet-800 border-violet-200",
  "Bill Update": "bg-amber-100 text-amber-800 border-amber-200",
  Hansard: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Committee Transcript": "bg-lime-100 text-lime-800 border-lime-200",
  "Budget Document": "bg-cyan-100 text-cyan-800 border-cyan-200",
  Other: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

export const RELATIONSHIP_STRENGTH_STYLES: Record<string, string> = {
  Unknown: "bg-slate-100 text-slate-700 border-slate-200",
  "No relationship": "bg-zinc-100 text-zinc-700 border-zinc-200",
  "Introductory contact": "bg-blue-100 text-blue-700 border-blue-200",
  "Warm relationship": "bg-amber-100 text-amber-800 border-amber-200",
  "Strong relationship": "bg-emerald-100 text-emerald-700 border-emerald-200",
  Champion: "bg-green-100 text-green-700 border-green-200",
  "Concern/Opposed": "bg-rose-100 text-rose-700 border-rose-200",
};
