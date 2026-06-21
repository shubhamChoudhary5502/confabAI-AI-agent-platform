import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { meetings, messages } from "@/db/schema";
import { PublicMeetingView } from "@/modules/meetings/ui/views/public-meeting-view";

interface Props {
  params: Promise<{ token: string }>;
}

const Page = async ({ params }: Props) => {
  const { token } = await params;
  if (!token) notFound();

  // The share token is the ONLY access path. Select just the publicly
  // shareable fields — never userId, agentId, recording/transcript URLs, or
  // the token itself.
  const [meeting] = await db
    .select({
      id: meetings.id,
      name: meetings.name,
      summary: meetings.summary,
      startedAt: meetings.startedAt,
      createdAt: meetings.createdAt,
    })
    .from(meetings)
    .where(eq(meetings.shareToken, token));

  if (!meeting) notFound();

  const transcript = await db
    .select({
      id: messages.id,
      role: messages.role,
      content: messages.content,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.meetingId, meeting.id))
    .orderBy(asc(messages.createdAt));

  return (
    <PublicMeetingView
      meeting={{
        name: meeting.name,
        date: meeting.startedAt ?? meeting.createdAt,
        summary: meeting.summary,
      }}
      transcript={transcript}
    />
  );
};

export default Page;
