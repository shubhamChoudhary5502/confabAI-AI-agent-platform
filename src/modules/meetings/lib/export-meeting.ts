import { format } from "date-fns";

export interface ExportTranscriptItem {
  role: "user" | "assistant";
  content: string;
  createdAt: string | Date;
}

export interface MeetingExportData {
  name: string;
  date: string | Date;
  summary: string | null;
  transcript: ExportTranscriptItem[];
}

const SPEAKER = (role: ExportTranscriptItem["role"]) =>
  role === "user" ? "User" : "Agent";

/** Filesystem-safe slug for download filenames, e.g. "Team Sync" -> "team-sync". */
export function meetingFileSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "meeting";
}

/** Builds the full Markdown document: title, date, summary, then transcript. */
export function buildMeetingMarkdown({
  name,
  date,
  summary,
  transcript,
}: MeetingExportData): string {
  const lines: string[] = [
    `# ${name}`,
    "",
    `**Date:** ${format(new Date(date), "PPpp")}`,
    "",
    "## Summary",
    "",
    summary?.trim()
      ? summary.trim()
      : "_No summary was generated for this meeting._",
    "",
    "## Transcript",
    "",
  ];

  if (transcript.length === 0) {
    lines.push("_No conversation was recorded for this meeting._");
  } else {
    for (const m of transcript) {
      const time = format(new Date(m.createdAt), "HH:mm:ss");
      lines.push(`**${SPEAKER(m.role)}** (${time}): ${m.content}`, "");
    }
  }

  return lines.join("\n");
}

/** Triggers a client-side download of a text Blob. */
export function downloadTextFile(
  filename: string,
  content: string,
  mime: string,
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Builds a clean, self-contained HTML document for the print/PDF view. */
export function buildPrintableHtml({
  name,
  date,
  summary,
  transcript,
}: MeetingExportData): string {
  const dateStr = format(new Date(date), "PPpp");

  const summaryHtml = summary?.trim()
    ? `<div class="summary">${escapeHtml(summary.trim())}</div>`
    : `<p class="muted">No summary was generated for this meeting.</p>`;

  const transcriptHtml =
    transcript.length === 0
      ? `<p class="muted">No conversation was recorded for this meeting.</p>`
      : transcript
          .map((m) => {
            const time = format(new Date(m.createdAt), "HH:mm:ss");
            return `<div class="turn"><div class="meta">${SPEAKER(
              m.role,
            )} · ${time}</div><div class="content">${escapeHtml(
              m.content,
            )}</div></div>`;
          })
          .join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(name)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 40px; line-height: 1.6; }
  h1 { font-size: 24px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 28px 0 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  .date { color: #64748b; font-size: 13px; margin-bottom: 8px; }
  .summary { white-space: pre-wrap; font-size: 14px; }
  .muted { color: #94a3b8; font-size: 14px; }
  .turn { margin-bottom: 12px; }
  .turn .meta { font-size: 12px; color: #64748b; font-weight: 600; margin-bottom: 2px; }
  .turn .content { font-size: 14px; white-space: pre-wrap; }
  @media print { body { margin: 0.5in; } }
</style>
</head>
<body>
  <h1>${escapeHtml(name)}</h1>
  <div class="date">${dateStr}</div>
  <h2>Summary</h2>
  ${summaryHtml}
  <h2>Transcript</h2>
  ${transcriptHtml}
</body>
</html>`;
}

/**
 * Opens a clean printable view in a new window and invokes the browser's print
 * dialog (where the user can "Save as PDF"). Returns false if the popup was
 * blocked so the caller can surface a hint. No PDF library involved.
 */
export function printMeeting(data: MeetingExportData): boolean {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return false;

  win.document.write(buildPrintableHtml(data));
  win.document.close();
  win.focus();

  // Let the new document lay out before opening the print dialog.
  window.setTimeout(() => {
    try {
      win.print();
    } catch {
      /* window may have been closed by the user before printing */
    }
  }, 250);

  return true;
}
