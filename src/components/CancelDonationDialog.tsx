import { useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useUpdateDonationStatus } from "@/hooks/use-donations";
import type { Donation } from "@/lib/types";

export function CancelDonationDialog({ donation, trigger }: { donation: Donation; trigger: ReactNode }) {
  const [reason, setReason] = useState("");
  const mutation = useUpdateDonationStatus();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this donation?</AlertDialogTitle>
          <AlertDialogDescription>
            {donation.status === "claimed"
              ? `${donation.claim?.ngoName} has already claimed it and will be notified.`
              : "NGOs will no longer see this donation."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div>
          <Label htmlFor="cancel-reason">Reason (optional)</Label>
          <Textarea
            id="cancel-reason"
            className="mt-1.5"
            maxLength={200}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Food was used for staff meals"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">Keep it</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => mutation.mutate({ id: donation.id, status: "cancelled", reason: reason.trim() || undefined })}
          >
            Cancel donation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
