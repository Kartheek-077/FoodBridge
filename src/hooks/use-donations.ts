import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi, claimsApi, donationsApi, getErrorMessage } from "@/lib/api";
import type { DonationInput, DonationListParams } from "@/lib/types";

export const donationQueries = {
  list: (params: DonationListParams) =>
    queryOptions({ queryKey: ["donations", "list", params], queryFn: () => donationsApi.list(params) }),
  mine: () => queryOptions({ queryKey: ["donations", "mine"], queryFn: donationsApi.mine }),
  detail: (id: string) => queryOptions({ queryKey: ["donations", "detail", id], queryFn: () => donationsApi.get(id) }),
  claims: () => queryOptions({ queryKey: ["claims", "mine"], queryFn: claimsApi.mine }),
};

export const adminQueries = {
  ngos: (status: "pending" | "verified" | "rejected" | "all") =>
    queryOptions({ queryKey: ["admin", "ngos", status], queryFn: () => adminApi.ngos(status) }),
  users: () => queryOptions({ queryKey: ["admin", "users"], queryFn: adminApi.users }),
  stats: () => queryOptions({ queryKey: ["admin", "stats"], queryFn: adminApi.stats }),
  allDonations: (params: DonationListParams) =>
    queryOptions({ queryKey: ["donations", "admin", params], queryFn: () => donationsApi.list(params) }),
};

function useInvalidateDonations() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["donations"] });
    void qc.invalidateQueries({ queryKey: ["claims"] });
    void qc.invalidateQueries({ queryKey: ["admin"] });
  };
}

const onError = (e: unknown) => toast.error(getErrorMessage(e));

export function useCreateDonation() {
  const invalidate = useInvalidateDonations();
  return useMutation({
    mutationFn: (input: DonationInput) => donationsApi.create(input),
    onSuccess: () => {
      invalidate();
      toast.success("Donation posted", { description: "Verified NGOs nearby have been notified." });
    },
    onError,
  });
}

export function useUpdateDonation(id: string) {
  const invalidate = useInvalidateDonations();
  return useMutation({
    mutationFn: (input: Partial<DonationInput>) => donationsApi.update(id, input),
    onSuccess: () => {
      invalidate();
      toast.success("Donation updated");
    },
    onError,
  });
}

export function useDeleteDonation() {
  const invalidate = useInvalidateDonations();
  return useMutation({
    mutationFn: (id: string) => donationsApi.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Donation deleted");
    },
    onError,
  });
}

export function useClaimDonation() {
  const invalidate = useInvalidateDonations();
  return useMutation({
    mutationFn: ({ id, pickupTime }: { id: string; pickupTime?: string | undefined }) => donationsApi.claim(id, pickupTime),
    onSuccess: () => {
      invalidate();
      toast.success("Donation claimed", { description: "The donor has been notified of your pickup time." });
    },
    onError,
  });
}

export function useUpdateDonationStatus() {
  const invalidate = useInvalidateDonations();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: "collected" | "cancelled"; reason?: string | undefined }) =>
      donationsApi.updateStatus(id, status, reason),
    onSuccess: (_d, v) => {
      invalidate();
      toast.success(v.status === "collected" ? "Marked as collected — thank you!" : "Donation cancelled");
    },
    onError,
  });
}

export function useVerifyNgo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: "approve" | "reject"; reason?: string | undefined }) =>
      adminApi.verifyNgo(id, action, reason),
    onSuccess: (_u, v) => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success(v.action === "approve" ? "NGO approved" : "NGO rejected");
    },
    onError,
  });
}
