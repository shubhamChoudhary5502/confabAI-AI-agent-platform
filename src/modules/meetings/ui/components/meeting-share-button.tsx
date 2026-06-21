"use client";

import { useState } from "react";
import {
  CopyIcon,
  LinkIcon,
  RefreshCwIcon,
  Share2Icon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  meetingId: string;
  initialShareToken: string | null;
}

export const MeetingShareButton = ({ meetingId, initialShareToken }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(initialShareToken);

  const shareUrl =
    token && typeof window !== "undefined"
      ? `${window.location.origin}/share/${token}`
      : "";

  const invalidateMeeting = () =>
    queryClient.invalidateQueries(
      trpc.meetings.getOne.queryOptions({ id: meetingId }),
    );

  const share = useMutation(
    trpc.meetings.share.mutationOptions({
      onSuccess: (data) => {
        setToken(data.shareToken);
        invalidateMeeting();
        toast.success("Public link ready");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const revoke = useMutation(
    trpc.meetings.revokeShare.mutationOptions({
      onSuccess: () => {
        setToken(null);
        invalidateMeeting();
        toast.success("Public link revoked");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const isBusy = share.isPending || revoke.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2Icon className="size-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share meeting</DialogTitle>
          <DialogDescription>
            Anyone with the link can view this meeting&apos;s title, date,
            summary, and transcript — read-only. No sign-in required.
          </DialogDescription>
        </DialogHeader>

        {token ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="bg-muted"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={handleCopy}
              >
                <CopyIcon className="size-4" />
                <span className="sr-only">Copy link</span>
              </Button>
            </div>
            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBusy}
                onClick={() => share.mutate({ id: meetingId })}
              >
                <RefreshCwIcon className="size-4" />
                Generate new link
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isBusy}
                onClick={() => revoke.mutate({ id: meetingId })}
              >
                <Trash2Icon className="size-4" />
                Revoke
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              This meeting is private. Create a public link to share it.
            </p>
            <DialogFooter>
              <Button
                type="button"
                disabled={isBusy}
                onClick={() => share.mutate({ id: meetingId })}
              >
                <LinkIcon className="size-4" />
                Create public link
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
