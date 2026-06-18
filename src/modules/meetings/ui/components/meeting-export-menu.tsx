"use client";

import {
  CopyIcon,
  DownloadIcon,
  FileDownIcon,
  PrinterIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
  buildMeetingMarkdown,
  downloadTextFile,
  meetingFileSlug,
  printMeeting,
  type ExportTranscriptItem,
} from "../../lib/export-meeting";

interface Props {
  meetingName: string;
  meetingDate: string | Date;
  summary: string | null;
  transcript: ExportTranscriptItem[];
}

export const MeetingExportMenu = ({
  meetingName,
  meetingDate,
  summary,
  transcript,
}: Props) => {
  const exportData = {
    name: meetingName,
    date: meetingDate,
    summary,
    transcript,
  };

  const hasSummary = Boolean(summary?.trim());

  const handleCopySummary = async () => {
    const text = summary?.trim();
    if (!text) {
      toast.error("There is no summary to copy.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Summary copied to clipboard");
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  const handleDownloadMarkdown = () => {
    const markdown = buildMeetingMarkdown(exportData);
    downloadTextFile(
      `${meetingFileSlug(meetingName)}.md`,
      markdown,
      "text/markdown;charset=utf-8",
    );
    toast.success("Markdown downloaded");
  };

  const handleDownloadPdf = () => {
    if (!printMeeting(exportData)) {
      toast.error("Allow pop-ups to export as PDF");
    }
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <DownloadIcon className="size-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopySummary} disabled={!hasSummary}>
          <CopyIcon className="size-4" />
          Copy summary
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadMarkdown}>
          <FileDownIcon className="size-4" />
          Download as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadPdf}>
          <PrinterIcon className="size-4" />
          Download as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
