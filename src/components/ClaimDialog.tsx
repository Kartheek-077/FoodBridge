import { useEffect, useState } from "react";
import { format } from "date-fns";
import { HandHeart, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClaimDonation } from "@/hooks/use-donations";
import { fromLocalInput, toLocalInput } from "@/lib/donation-utils";
import type { Donation } from "@/lib/types";

export function ClaimDialog({
  donation,
  open,
  onOpenChange,
}: {
  donation: Donation;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const claim = useClaimDonation();
  const [pickup, setPickup] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const start = Math.max(Date.now() + 15 * 60_000, new Date(donation.pickupWindowStart).getTime());
    setPickup(toLocalInput(new Date(start).toISOString()));
    setError(null);
  }, [open, donation.pickupWindowStart]);

  const submit = () => {
    const t = new Date(pickup).getTime();
    if (!pickup || Number.isNaN(t)) return setError("Choose a pickup time.");
    if (t < Date.now() - 60_000) return setError("Pickup time can't be in the past.");
    if (t > new Date(donation.pickupWindowEnd).getTime()) return setError("Pickup must be within the donor's pickup window.");
    if (t > new Date(donation.expiresAt).getTime()) return setError("Pickup must be before the food expires.");
    claim.mutate(
      { id: donation.id, pickupTime: fromLocalInput(pickup) },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandHeart className="size-5 text-primary" /> Claim “{donation.title}”
          </DialogTitle>
          <DialogDescription>
            {donation.quantity} {donation.unit} from {donation.donor.name}. Pick a time within{" "}
            {format(new Date(donation.pickupWindowStart), "h:mm a")} – {format(new Date(donation.pickupWindowEnd), "h:mm a, d MMM")}.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label htmlFor="pickup-time">Your pickup time</Label>
          <Input id="pickup-time" type="datetime-local" className="mt-1.5" value={pickup} onChange={(e) => setPickup(e.target.value)} />
          {error && <p className="mt-1.5 text-xs font-medium text-destructive">{error}</p>}
          <p className="mt-2 text-xs text-muted-foreground">The donor is notified immediately with your pickup time.</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button onClick={submit} disabled={claim.isPending}>
            {claim.isPending && <Loader2 className="animate-spin" />} Confirm claim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
