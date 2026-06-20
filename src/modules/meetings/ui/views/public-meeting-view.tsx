import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

interface TranscriptItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date | string;
}

interface Props {
  meeting: {
    name: string;
    date: Date | string;
    summary: string | null;
  };
  transcript: TranscriptItem[];
}

export const PublicMeetingView = ({ meeting, transcript }: Props) => {
  return (
    <div className="min-h-screen bg-muted py-8 px-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-y-4">
        <div className="rounded-lg border bg-background p-4">
          <h1 className="text-2xl font-semibold">{meeting.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(new Date(meeting.date), "PPp")}
          </p>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <h2 className="mb-2 text-base font-semibold">Summary</h2>
          {meeting.summary ? (
            <div className="text-sm leading-relaxed">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => (
                    <h2 className="mt-4 mb-2 text-base font-semibold first:mt-0">
                      {children}
                    </h2>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-2 list-disc space-y-1 pl-5">
                      {children}
                    </ul>
                  ),
                  li: ({ children }) => <li>{children}</li>,
                  p: ({ children }) => (
                    <p className="mb-2 leading-relaxed">{children}</p>
                  ),
                }}
              >
                {meeting.summary}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No summary is available for this meeting.
            </p>
          )}
        </div>

        <div className="rounded-lg border bg-background p-4">
          <h2 className="mb-3 text-base font-semibold">Transcript</h2>
          {transcript.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No conversation was recorded for this meeting.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {transcript.map((m) => (
                <div key={m.id} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">
                      {m.role === "user" ? "User" : "Agent"}
                    </span>
                    <span>{format(new Date(m.createdAt), "HH:mm:ss")}</span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
