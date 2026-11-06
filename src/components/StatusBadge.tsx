import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/donation-utils";
import type { DonationStatus, VerificationStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: DonationStatus }) {
  return <Badge variant={status}>{STATUS_LABELS[status]}</Badge>;
}

export function VerificationBadge({ status }: { status?: VerificationStatus }) {
  if (status === "verified") return <Badge variant="available">Verified</Badge>;
  if (status === "rejected") return <Badge variant="cancelled">Rejected</Badge>;
  return <Badge variant="warning">Pending review</Badge>;
}
