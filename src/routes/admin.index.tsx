import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import {
  BadgeCheck,
  Check,
  Clock,
  FileText,
  Package,
  ShieldCheck,
  Soup,
  Users,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, StatCard } from "@/components/PageHeader";
import { ListSkeleton, StatsSkeleton } from "@/components/Skeletons";
import { EmptyState, ErrorState } from "@/components/EmptyState";
import { StatusBadge, VerificationBadge } from "@/components/StatusBadge";
import { adminQueries, useVerifyNgo } from "@/hooks/use-donations";
import { getErrorMessage } from "@/lib/api";
import { ORG_TYPE_LABELS, STATUS_LABELS } from "@/lib/donation-utils";
import type { DonationStatus, Role, User } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "verifications" | "users" | "donations" | "analytics";

export const Route = createFileRoute("/admin/")({
  validateSearch: (s: Record<string, unknown>): { tab: Tab } => ({
    tab: (["verifications", "users", "donations", "analytics"] as const).includes(s["tab"] as Tab)
      ? (s["tab"] as Tab)
      : "verifications",
  }),
  head: () => ({
    meta: [
      { title: "Admin — FoodBridge" },
      { name: "description", content: "Verify NGOs, manage users and monitor food donations on FoodBridge." },
      { property: "og:title", content: "Admin — FoodBridge" },
      { property: "og:description", content: "Verify NGOs and monitor donations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

const TABS: { key: Tab; label: string }[] = [
  { key: "verifications", label: "NGO verifications" },
  { key: "users", label: "Users" },
  { key: "donations", label: "Donations" },
  { key: "analytics", label: "Analytics" },
];

function AdminDashboard() {
  const { tab } = Route.useSearch();
  const stats = useQuery(adminQueries.stats());

  return (
    <div className="container-page py-8 sm:py-10">
      <PageHeader eyebrow="Admin" title="Platform overview" description="Keep FoodBridge trustworthy: verify NGOs and watch the flow of food." />
      {stats.isLoading ? (
        <StatsSkeleton />
      ) : stats.data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Pending NGOs" value={stats.data.pendingNgos ?? 0} icon={<Clock className="size-4" />} tone="warm" />
          <StatCard label="Verified NGOs" value={stats.data.verifiedNgos} icon={<BadgeCheck className="size-4" />} />
          <StatCard label="Donations" value={stats.data.totalDonations ?? 0} icon={<Package className="size-4" />} tone="info" />
          <StatCard label="Meals saved" value={stats.data.mealsSaved.toLocaleString("en-IN")} icon={<Soup className="size-4" />} />
        </div>
      ) : null}

      <div className="mt-10 flex gap-1 overflow-x-auto border-b">
        {TABS.map((t) => (
          <Link
            key={t.key}
            to="/admin"
            search={{ tab: t.key }}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
              tab === t.key ? "border-primary text-primary-deep" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {t.key === "verifications" && !!stats.data?.pendingNgos && (
              <span className="ml-2 rounded-full bg-warm px-1.5 py-0.5 text-[10px] font-bold text-warm-foreground">
                {stats.data.pendingNgos}
              </span>
            )}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        {tab === "verifications" && <VerificationsTab />}
        {tab === "users" && <UsersTab />}
        {tab === "donations" && <DonationsTab />}
        {tab === "analytics" && <AnalyticsTab />}
      </div>
    </div>
  );
}

// ---------------- Verifications ----------------
function VerificationsTab() {
  const [filter, setFilter] = useState<"pending" | "verified" | "rejected">("pending");
  const { data, isLoading, isError, error, refetch } = useQuery(adminQueries.ngos(filter));
  const [docFor, setDocFor] = useState<User | null>(null);
  const [rejectFor, setRejectFor] = useState<User | null>(null);
  const verify = useVerifyNgo();

  return (
    <>
      <div className="mb-4 flex gap-2">
        {(["pending", "verified", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold capitalize",
              filter === s ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
            )}
          >
            {s}
          </button>
        ))}
      </div>
      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
      ) : !data?.length ? (
        <EmptyState
          icon={ShieldCheck}
          title={filter === "pending" ? "Queue is clear" : `No ${filter} NGOs`}
          description={filter === "pending" ? "New NGO registrations will appear here for review." : undefined}
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {data.map((ngo) => (
            <li key={ngo.id} className="flex flex-col rounded-2xl border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold">{ngo.organizationName}</p>
                  <p className="text-sm text-muted-foreground">Reg. no. {ngo.registrationNumber}</p>
                </div>
                <VerificationBadge status={ngo.verificationStatus} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="truncate">{ngo.email}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Phone</dt>
                  <dd>{ngo.phone}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Service area</dt>
                  <dd>{ngo.serviceArea}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Submitted</dt>
                  <dd>{format(new Date(ngo.createdAt), "d MMM yyyy, h:mm a")}</dd>
                </div>
                {ngo.rejectionReason && (
                  <div className="col-span-2 rounded-xl bg-destructive-soft p-2 text-destructive">
                    <dt className="text-xs font-semibold">Rejection reason</dt>
                    <dd>{ngo.rejectionReason}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
                <Button size="sm" variant="outline" onClick={() => setDocFor(ngo)}>
                  <FileText /> View document
                </Button>
                {ngo.verificationStatus !== "verified" && (
                  <Button
                    size="sm"
                    disabled={verify.isPending}
                    onClick={() => verify.mutate({ id: ngo.id, action: "approve" })}
                  >
                    <Check /> Approve
                  </Button>
                )}
                {ngo.verificationStatus === "pending" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive-soft hover:text-destructive"
                    onClick={() => setRejectFor(ngo)}
                  >
                    <X /> Reject
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <DocumentDialog ngo={docFor} onClose={() => setDocFor(null)} />
      <RejectDialog ngo={rejectFor} onClose={() => setRejectFor(null)} />
    </>
  );
}

function DocumentDialog({ ngo, onClose }: { ngo: User | null; onClose: () => void }) {
  const url = ngo?.verificationDocumentUrl;
  const isPdf = !!url && (url.startsWith("data:application/pdf") || url.toLowerCase().endsWith(".pdf"));
  return (
    <Dialog open={!!ngo} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>{ngo?.organizationName}</DialogTitle>
          <DialogDescription>
            {ngo?.verificationDocumentName ?? "Verification document"} · Reg. no. {ngo?.registrationNumber}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-xl border bg-muted">
          {!url ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              No preview available for this file. Ask the NGO to re-upload a PDF or image under 1.5 MB.
            </p>
          ) : isPdf ? (
            <iframe src={url} title="Verification document" className="h-[60vh] w-full" />
          ) : (
            <img src={url} alt="Verification document" className="max-h-[60vh] w-full object-contain" />
          )}
        </div>
        {url && (
          <DialogFooter>
            <Button variant="outline" asChild>
              <a href={url} download={ngo?.verificationDocumentName ?? "document"} target="_blank" rel="noreferrer">
                Open in new tab
              </a>
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({ ngo, onClose }: { ngo: User | null; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const verify = useVerifyNgo();
  const submit = () => {
    if (reason.trim().length < 5) return setError("Give a short reason (at least 5 characters) so the NGO can fix it.");
    if (!ngo) return;
    verify.mutate(
      { id: ngo.id, action: "reject", reason: reason.trim() },
      {
        onSuccess: () => {
          setReason("");
          onClose();
        },
      },
    );
  };
  return (
    <Dialog
      open={!!ngo}
      onOpenChange={(o) => {
        if (!o) {
          setError(null);
          onClose();
        }
      }}
    >
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Reject {ngo?.organizationName}?</DialogTitle>
          <DialogDescription>The NGO will see this reason and can resubmit.</DialogDescription>
        </DialogHeader>
        <div>
          <Label htmlFor="reject-reason">Reason</Label>
          <Textarea
            id="reject-reason"
            className="mt-1.5"
            maxLength={300}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Registration certificate is unreadable"
          />
          {error && <p className="mt-1.5 text-xs font-medium text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={submit} disabled={verify.isPending}>
            Reject NGO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Users ----------------
function UsersTab() {
  const { data, isLoading, isError, error, refetch } = useQuery(adminQueries.users());
  const [role, setRole] = useState<Role | "all">("all");
  const [q, setQ] = useState("");
  if (isLoading) return <ListSkeleton />;
  if (isError) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;
  const list = (data ?? []).filter(
    (u) =>
      (role === "all" || u.role === role) &&
      (!q || `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…" className="sm:max-w-xs" />
        <div className="flex gap-2">
          {(["all", "donor", "ngo", "admin"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-semibold capitalize",
                role === r ? "border-primary bg-primary-soft text-primary-deep" : "bg-card hover:bg-muted",
              )}
            >
              {r === "ngo" ? "NGOs" : r === "all" ? "All" : `${r}s`}
            </button>
          ))}
        </div>
      </div>
      {list.length === 0 ? (
        <EmptyState icon={Users} title="No users found" />
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Type / status</TableHead>
                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <p className="font-semibold">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "warm" : u.role === "ngo" ? "claimed" : "collected"} className="capitalize">
                      {u.role === "ngo" ? "NGO" : u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {u.role === "ngo" ? (
                      <VerificationBadge status={u.verificationStatus} />
                    ) : u.organizationType ? (
                      ORG_TYPE_LABELS[u.organizationType]
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{u.phone}</TableCell>
                  <TableCell className="hidden lg:table-cell">{format(new Date(u.createdAt), "d MMM yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

// ---------------- Donations ----------------
function DonationsTab() {
  const [status, setStatus] = useState<DonationStatus | undefined>(undefined);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useQuery(adminQueries.allDonations({ status, page }));
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {([undefined, "available", "claimed", "collected", "expired", "cancelled"] as const).map((s) => (
          <button
            key={s ?? "all"}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-semibold",
              status === s ? "border-primary bg-primary-soft text-primary-deep" : "bg-card hover:bg-muted",
            )}
          >
            {s ? STATUS_LABELS[s] : "All"}
          </button>
        ))}
      </div>
      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
      ) : !data?.items.length ? (
        <EmptyState icon={Package} title="No donations" />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Donation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Quantity</TableHead>
                  <TableHead className="hidden md:table-cell">Claimed by</TableHead>
                  <TableHead className="hidden lg:table-cell">Posted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((d) => (
                  <TableRow
                    key={d.id}
                    className="cursor-pointer"
                    onClick={() => navigate({ to: "/donations/$id", params: { id: d.id } })}
                  >
                    <TableCell>
                      <p className="font-semibold">{d.title}</p>
                      <p className="text-xs text-muted-foreground">{d.donor.name}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={d.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {d.quantity} {d.unit}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{d.claim?.ngoName ?? "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{format(new Date(d.createdAt), "d MMM, h:mm a")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ---------------- Analytics ----------------
const STATUS_COLORS: Record<DonationStatus, string> = {
  available: "var(--success)",
  claimed: "var(--info)",
  collected: "var(--primary)",
  expired: "var(--muted-foreground)",
  cancelled: "var(--destructive)",
};
const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

function AnalyticsTab() {
  const { data, isLoading, isError, error, refetch } = useQuery(adminQueries.stats());
  if (isLoading) return <StatsSkeleton />;
  if (isError || !data) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;

  const daily = (data.daily ?? []).map((d) => ({ ...d, label: format(new Date(d.date), "EEE") }));
  const statusData = data.byStatus
    ? (Object.keys(data.byStatus) as DonationStatus[]).map((s) => ({ name: STATUS_LABELS[s], key: s, value: data.byStatus![s] }))
    : [];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ChartCard title="Donations this week" className="lg:col-span-2">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={28} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="posted" name="Posted" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="collected" name="Collected" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Donations by status">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3} isAnimationActive={false}>
              {statusData.map((s) => (
                <Cell key={s.key} fill={STATUS_COLORS[s.key]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Donations by donor type">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.byOrgType ?? []} layout="vertical">
            <XAxis type="number" allowDecimals={false} hide />
            <YAxis type="category" dataKey="name" width={110} stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
            <Bar dataKey="value" name="Donations" radius={[0, 6, 6, 0]}>
              {(data.byOrgType ?? []).map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border bg-card p-5 shadow-card", className)}>
      <h3 className="mb-4 font-sans text-sm font-bold">{title}</h3>
      {children}
    </div>
  );
}
