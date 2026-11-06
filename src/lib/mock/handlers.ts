/**
 * Mock implementation of the FoodBridge REST API contract.
 * Mirrors the rules the real Express backend must enforce.
 */
import type {
  AdminStats,
  AppNotification,
  Donation,
  DonationStatus,
  NotificationType,
  Paginated,
  User,
} from "../types";
import { emitMockEvent } from "./bus";
import {
  coordsForAddress,
  haversineKm,
  loadDb,
  newId,
  publicUser,
  saveDb,
  type MockDb,
  type MockUser,
} from "./db";
import { EXPIRING_SOON_HOURS } from "../donation-utils";

export interface MockFile {
  name: string;
  type: string;
  size: number;
  dataUrl: string | null;
}

export interface MockRequest {
  method: string;
  url: string;
  params?: Record<string, unknown>;
  body?: Record<string, unknown> | null;
  token?: string | null;
}

export interface MockResponse {
  status: number;
  data: unknown;
}

const PAGE_SIZE = 9;

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function tokenForUser(userId: string) {
  return `mock.${userId}.${Date.now().toString(36)}`;
}

function userIdFromToken(token?: string | null): string | null {
  if (!token) return null;
  const parts = token.replace(/^Bearer\s+/i, "").split(".");
  if (parts[0] !== "mock" || !parts[1]) return null;
  return parts[1];
}

function requireUser(db: MockDb, req: MockRequest): MockUser {
  const id = userIdFromToken(req.token);
  const user = id ? db.users.find((u) => u.id === id) : undefined;
  if (!user) throw new HttpError(401, "Your session has expired. Please log in again.");
  return user;
}

function requireRole(user: MockUser, ...roles: MockUser["role"][]) {
  if (!roles.includes(user.role)) throw new HttpError(403, "You don't have access to this action.");
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v);
}

function now() {
  return new Date().toISOString();
}

function notify(
  db: MockDb,
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  donation?: Donation | null,
) {
  for (const userId of userIds) {
    const n: AppNotification = {
      id: newId("n"),
      userId,
      type,
      title,
      message,
      donationId: donation?.id ?? null,
      read: false,
      createdAt: now(),
    };
    db.notifications.unshift(n);
    emitMockEvent({ event: type, targetUserIds: [userId], payload: { notification: n, donation } });
  }
}

/** Marks available donations whose expiry has passed as expired. */
export function sweepExpired(db: MockDb, at = Date.now()) {
  let changed = false;
  for (const d of db.donations) {
    if (d.status === "available" && new Date(d.expiresAt).getTime() <= at) {
      d.status = "expired";
      d.expiredAt = d.expiresAt;
      d.updatedAt = now();
      d.history = [...(d.history ?? []), { status: "expired", at: d.expiresAt }];
      changed = true;
    }
  }
  return changed;
}

function withDistance(d: Donation, viewer?: MockUser): Donation {
  if (viewer?.lat != null && viewer.lng != null && d.location) {
    return { ...d, distanceKm: haversineKm({ lat: viewer.lat, lng: viewer.lng }, d.location) };
  }
  return d;
}

function paginate<T>(items: T[], pageRaw: unknown): Paginated<T> {
  const page = Math.max(1, Number(pageRaw) || 1);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  return {
    items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    page,
    totalPages,
    total: items.length,
  };
}

function findDonation(db: MockDb, id: string) {
  const d = db.donations.find((x) => x.id === id);
  if (!d) throw new HttpError(404, "Donation not found.");
  return d;
}

function validateDonationBody(body: Record<string, unknown>, partial = false) {
  const errors: string[] = [];
  const title = str(body.title);
  const quantity = Number(body.quantity);
  const unit = str(body.unit);
  const foodType = str(body.foodType);
  if (!partial || "title" in body) if (title.length < 3) errors.push("Title is too short.");
  if (!partial || "quantity" in body) if (!(quantity > 0)) errors.push("Quantity must be greater than 0.");
  if (!partial || "unit" in body) if (!["servings", "kg"].includes(unit)) errors.push("Invalid unit.");
  if (!partial || "foodType" in body)
    if (!["veg", "non-veg", "both"].includes(foodType)) errors.push("Invalid food type.");
  const start = new Date(str(body.pickupWindowStart)).getTime();
  const end = new Date(str(body.pickupWindowEnd)).getTime();
  const exp = new Date(str(body.expiresAt)).getTime();
  if (!partial || "pickupWindowEnd" in body) {
    if (Number.isNaN(start) || Number.isNaN(end)) errors.push("Pickup window is required.");
    else if (end <= start) errors.push("Pickup window must end after it starts.");
  }
  if (!partial || "expiresAt" in body) {
    if (Number.isNaN(exp)) errors.push("Expiry is required.");
    else if (exp <= Date.now()) errors.push("Expiry must be in the future.");
  }
  if (errors.length) throw new HttpError(422, errors[0]);
}

function route(db: MockDb, req: MockRequest): unknown {
  const method = req.method.toUpperCase();
  const path = req.url.replace(/^https?:\/\/[^/]+/, "").replace(/^\/api/, "").split("?")[0];
  const seg = path.split("/").filter(Boolean);
  const body = req.body ?? {};
  const params = req.params ?? {};

  // ---------- AUTH ----------
  if (seg[0] === "auth") {
    if (method === "POST" && seg[1] === "register") {
      const role = str(body.role);
      const email = str(body.email).toLowerCase();
      const password = str(body.password);
      if (!["donor", "ngo"].includes(role)) throw new HttpError(422, "Choose a valid role.");
      if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(422, "Enter a valid email.");
      if (password.length < 8) throw new HttpError(422, "Password must be at least 8 characters.");
      if (db.users.some((u) => u.email === email))
        throw new HttpError(409, "An account with this email already exists.");
      const coords = coordsForAddress(str(body.address));
      const base = {
        id: newId("u"),
        email,
        password,
        phone: str(body.phone),
        address: str(body.address),
        createdAt: now(),
        ...(coords ?? {}),
      };
      let user: MockUser;
      if (role === "donor") {
        user = {
          ...base,
          role: "donor",
          name: str(body.name),
          organizationType: str(body.organizationType) as MockUser["organizationType"],
        };
      } else {
        const doc = body.document as MockFile | undefined;
        if (!doc) throw new HttpError(422, "Upload your verification document.");
        user = {
          ...base,
          role: "ngo",
          name: str(body.organizationName),
          organizationName: str(body.organizationName),
          registrationNumber: str(body.registrationNumber),
          serviceArea: str(body.serviceArea),
          verificationStatus: "pending",
          verificationDocumentUrl: doc.dataUrl,
          verificationDocumentName: doc.name,
        };
      }
      db.users.push(user);
      if (user.role === "ngo") {
        const admins = db.users.filter((u) => u.role === "admin").map((u) => u.id);
        notify(db, admins, "ngo:registered", "New NGO awaiting verification", `${user.name} submitted documents for review.`);
      }
      return { token: tokenForUser(user.id), user: publicUser(user) };
    }
    if (method === "POST" && seg[1] === "login") {
      const email = str(body.email).toLowerCase();
      const user = db.users.find((u) => u.email === email && u.password === str(body.password));
      if (!user) throw new HttpError(401, "Invalid email or password.");
      return { token: tokenForUser(user.id), user: publicUser(user) };
    }
    if (seg[1] === "me") {
      const user = requireUser(db, req);
      if (method === "GET") return publicUser(user);
      if (method === "PUT") {
        const editable = ["name", "phone", "address", "organizationType", "organizationName", "serviceArea"] as const;
        for (const k of editable) if (k in body) (user as unknown as Record<string, unknown>)[k] = str(body[k]);
        if (user.role === "ngo" && "organizationName" in body) user.name = str(body.organizationName);
        const coords = coordsForAddress(user.address);
        if (coords) Object.assign(user, coords);
        return publicUser(user);
      }
    }
  }

  // ---------- DONATIONS ----------
  if (seg[0] === "donations") {
    const user = requireUser(db, req);

    if (method === "GET" && seg.length === 1) {
      let list = [...db.donations];
      const status = str(params.status) as DonationStatus | "";
      if (user.role === "ngo") list = list.filter((d) => d.status === (status || "available"));
      else if (user.role === "donor") list = list.filter((d) => d.donor.id === user.id);
      if (status && user.role !== "ngo") list = list.filter((d) => d.status === status);
      const foodType = str(params.foodType);
      if (foodType) list = list.filter((d) => d.foodType === foodType || (foodType !== "both" && d.foodType === "both"));
      const search = str(params.search).toLowerCase();
      if (search)
        list = list.filter((d) =>
          [d.title, d.description, d.donor.name, d.pickupAddress].join(" ").toLowerCase().includes(search),
        );
      const location = str(params.location).toLowerCase();
      if (location) list = list.filter((d) => d.pickupAddress.toLowerCase().includes(location));
      if (String(params.expiringSoon) === "true") {
        const limit = Date.now() + EXPIRING_SOON_HOURS * 3600_000;
        list = list.filter((d) => new Date(d.expiresAt).getTime() <= limit);
        list.sort((a, b) => +new Date(a.expiresAt) - +new Date(b.expiresAt));
      } else {
        list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      }
      return paginate(list.map((d) => withDistance(d, user)), params.page);
    }

    if (method === "GET" && seg[1] === "mine") {
      requireRole(user, "donor");
      return db.donations
        .filter((d) => d.donor.id === user.id)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }

    if (method === "POST" && seg.length === 1) {
      requireRole(user, "donor");
      validateDonationBody(body);
      const image = body.image as MockFile | undefined;
      const pickupAddress = str(body.pickupAddress);
      const d: Donation = {
        id: newId("d"),
        title: str(body.title),
        description: str(body.description),
        foodType: str(body.foodType) as Donation["foodType"],
        quantity: Number(body.quantity),
        unit: str(body.unit) as Donation["unit"],
        imageUrl: image?.dataUrl ?? null,
        pickupAddress,
        pickupWindowStart: new Date(str(body.pickupWindowStart)).toISOString(),
        pickupWindowEnd: new Date(str(body.pickupWindowEnd)).toISOString(),
        expiresAt: new Date(str(body.expiresAt)).toISOString(),
        notes: str(body.notes),
        status: "available",
        donor: { id: user.id, name: user.name, organizationType: user.organizationType, phone: user.phone },
        claim: null,
        location: coordsForAddress(pickupAddress) ?? (user.lat != null ? { lat: user.lat, lng: user.lng! } : null),
        createdAt: now(),
        updatedAt: now(),
        history: [{ status: "posted", at: now() }],
      };
      db.donations.unshift(d);
      const ngos = db.users.filter((u) => u.role === "ngo" && u.verificationStatus === "verified").map((u) => u.id);
      notify(
        db,
        ngos,
        "donation:new",
        "New donation nearby",
        `${user.name} posted “${d.title}” (${d.quantity} ${d.unit}).`,
        d,
      );
      return d;
    }

    const id = seg[1];
    if (!id) throw new HttpError(404, "Not found.");
    const d = findDonation(db, id);

    if (method === "GET" && seg.length === 2) {
      const canSee =
        user.role === "admin" ||
        d.donor.id === user.id ||
        d.claim?.ngoId === user.id ||
        (user.role === "ngo" && d.status === "available");
      if (!canSee) throw new HttpError(403, "You can't view this donation.");
      return withDistance(d, user);
    }

    if (method === "PUT" && seg.length === 2) {
      requireRole(user, "donor");
      if (d.donor.id !== user.id) throw new HttpError(403, "You can only edit your own donations.");
      if (d.status !== "available") throw new HttpError(409, "Only available donations can be edited.");
      validateDonationBody(body, true);
      const fields = ["title", "description", "foodType", "unit", "pickupAddress", "notes"] as const;
      for (const k of fields) if (k in body) (d as unknown as Record<string, unknown>)[k] = str(body[k]);
      if ("quantity" in body) d.quantity = Number(body.quantity);
      for (const k of ["pickupWindowStart", "pickupWindowEnd", "expiresAt"] as const)
        if (k in body) d[k] = new Date(str(body[k])).toISOString();
      const image = body.image as MockFile | undefined;
      if (image?.dataUrl) d.imageUrl = image.dataUrl;
      if ("pickupAddress" in body) d.location = coordsForAddress(d.pickupAddress) ?? d.location;
      d.updatedAt = now();
      return d;
    }

    if (method === "DELETE" && seg.length === 2) {
      if (!(user.role === "admin" || d.donor.id === user.id))
        throw new HttpError(403, "You can only delete your own donations.");
      if (d.status === "claimed") throw new HttpError(409, "Claimed donations can't be deleted. Cancel it instead.");
      db.donations = db.donations.filter((x) => x.id !== d.id);
      return { success: true };
    }

    if (method === "POST" && seg[2] === "claim") {
      requireRole(user, "ngo");
      if (user.verificationStatus !== "verified")
        throw new HttpError(403, "Only verified NGOs can claim donations.");
      if (d.status !== "available") throw new HttpError(409, "This donation is no longer available.");
      if (new Date(d.expiresAt).getTime() <= Date.now()) throw new HttpError(409, "This donation has expired.");
      const pickupRaw = str(body.pickupTime);
      const pickupTime = pickupRaw ? new Date(pickupRaw).toISOString() : d.pickupWindowStart;
      d.status = "claimed";
      d.claim = {
        ngoId: user.id,
        ngoName: user.organizationName ?? user.name,
        ngoPhone: user.phone,
        claimedAt: now(),
        pickupTime,
      };
      d.updatedAt = now();
      d.history = [
        ...(d.history ?? []),
        { status: "claimed", at: now() },
        { status: "pickup_scheduled", at: pickupTime },
      ];
      notify(
        db,
        [d.donor.id],
        "donation:claimed",
        "Donation claimed",
        `${d.claim.ngoName} claimed “${d.title}” and will pick it up soon.`,
        d,
      );
      return d;
    }

    if (method === "PATCH" && seg[2] === "status") {
      const next = str(body.status);
      if (next === "collected") {
        const allowed = d.claim?.ngoId === user.id || d.donor.id === user.id || user.role === "admin";
        if (!allowed) throw new HttpError(403, "Only the donor or the claiming NGO can mark this collected.");
        if (d.status !== "claimed") throw new HttpError(409, "Only claimed donations can be marked collected.");
        d.status = "collected";
        d.collectedAt = now();
        d.updatedAt = now();
        d.history = [...(d.history ?? []), { status: "collected", at: now() }];
        const targets = [d.donor.id, d.claim!.ngoId];
        notify(
          db,
          targets,
          "donation:collected",
          "Donation collected",
          `“${d.title}” was collected. ${d.quantity} ${d.unit} saved from waste!`,
          d,
        );
        return d;
      }
      if (next === "cancelled") {
        if (!(d.donor.id === user.id || user.role === "admin"))
          throw new HttpError(403, "Only the donor can cancel this donation.");
        if (!["available", "claimed"].includes(d.status))
          throw new HttpError(409, "This donation can no longer be cancelled.");
        const claimedBy = d.claim?.ngoId;
        d.status = "cancelled";
        d.cancelledAt = now();
        d.cancelReason = str(body.reason) || null;
        d.updatedAt = now();
        d.history = [...(d.history ?? []), { status: "cancelled", at: now() }];
        if (claimedBy)
          notify(db, [claimedBy], "donation:cancelled", "Donation cancelled", `${d.donor.name} cancelled “${d.title}”.`, d);
        return d;
      }
      throw new HttpError(422, "Status must be collected or cancelled.");
    }
  }

  // ---------- CLAIMS ----------
  if (seg[0] === "claims" && seg[1] === "mine" && method === "GET") {
    const user = requireUser(db, req);
    requireRole(user, "ngo");
    return db.donations
      .filter((d) => d.claim?.ngoId === user.id)
      .sort((a, b) => +new Date(b.claim!.claimedAt) - +new Date(a.claim!.claimedAt))
      .map((d) => withDistance(d, user));
  }

  // ---------- NOTIFICATIONS ----------
  if (seg[0] === "notifications") {
    const user = requireUser(db, req);
    const mine = db.notifications.filter((n) => n.userId === user.id);
    if (method === "GET" && seg.length === 1)
      return mine.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (method === "PATCH" && seg[1] === "read-all") {
      mine.forEach((n) => (n.read = true));
      return { success: true };
    }
    if (method === "PATCH" && seg[2] === "read") {
      const n = mine.find((x) => x.id === seg[1]);
      if (!n) throw new HttpError(404, "Notification not found.");
      n.read = true;
      return n;
    }
  }

  // ---------- ADMIN ----------
  if (seg[0] === "admin") {
    if (method === "GET" && seg[1] === "stats") {
      // Public impact counters are readable by anyone; full analytics need admin.
      const id = userIdFromToken(req.token);
      const viewer = id ? db.users.find((u) => u.id === id) : undefined;
      return buildStats(db, viewer?.role === "admin");
    }
    const user = requireUser(db, req);
    requireRole(user, "admin");
    if (method === "GET" && seg[1] === "ngos") {
      const status = str(params.status);
      return db.users
        .filter((u) => u.role === "ngo" && (!status || status === "all" || u.verificationStatus === status))
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .map(publicUser);
    }
    if (method === "PATCH" && seg[1] === "ngos" && seg[3] === "verify") {
      const ngo = db.users.find((u) => u.id === seg[2] && u.role === "ngo");
      if (!ngo) throw new HttpError(404, "NGO not found.");
      const action = str(body.action);
      if (action === "approve") {
        ngo.verificationStatus = "verified";
        ngo.verifiedAt = now();
        ngo.rejectionReason = null;
        notify(db, [ngo.id], "ngo:verified", "You're verified!", "Your NGO is verified. You can now claim donations.");
      } else if (action === "reject") {
        const reason = str(body.reason);
        if (reason.length < 5) throw new HttpError(422, "Please give a reason for rejection.");
        ngo.verificationStatus = "rejected";
        ngo.rejectionReason = reason;
        notify(db, [ngo.id], "ngo:rejected", "Verification not approved", `Reason: ${reason}`);
      } else throw new HttpError(422, "Action must be approve or reject.");
      return publicUser(ngo);
    }
    if (method === "GET" && seg[1] === "users") {
      return db.users
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .map(publicUser) as User[];
    }
  }

  throw new HttpError(404, `No mock route for ${method} ${path}`);
}

function buildStats(db: MockDb, full: boolean): AdminStats {
  const collected = db.donations.filter((d) => d.status === "collected");
  const mealsSaved = 12480 + collected.reduce((s, d) => s + (d.unit === "kg" ? d.quantity * 4 : d.quantity), 0);
  const activeDonors = 318 + db.users.filter((u) => u.role === "donor").length;
  const verifiedNgos = 64 + db.users.filter((u) => u.role === "ngo" && u.verificationStatus === "verified").length;
  if (!full) return { mealsSaved, activeDonors, verifiedNgos };

  const statuses: DonationStatus[] = ["available", "claimed", "collected", "expired", "cancelled"];
  const byStatus = Object.fromEntries(
    statuses.map((s) => [s, db.donations.filter((d) => d.status === s).length]),
  ) as Record<DonationStatus, number>;
  const daily: AdminStats["daily"] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const next = day.getTime() + 86_400_000;
    const inDay = (iso?: string | null) => !!iso && +new Date(iso) >= day.getTime() && +new Date(iso) < next;
    daily.push({
      date: day.toISOString(),
      posted: db.donations.filter((d) => inDay(d.createdAt)).length,
      collected: db.donations.filter((d) => inDay(d.collectedAt)).length,
    });
  }
  const foodTypes = [
    { key: "veg", name: "Veg" },
    { key: "non-veg", name: "Non-veg" },
    { key: "both", name: "Mixed" },
  ];
  const orgTypes = [
    ["restaurant", "Restaurants"],
    ["hotel", "Hotels"],
    ["marriage_hall", "Marriage halls"],
    ["hostel", "Hostels"],
    ["event_organizer", "Events"],
  ];
  return {
    mealsSaved,
    activeDonors,
    verifiedNgos,
    pendingNgos: db.users.filter((u) => u.role === "ngo" && u.verificationStatus === "pending").length,
    totalDonations: db.donations.length,
    totalUsers: db.users.length,
    byStatus,
    daily,
    byFoodType: foodTypes.map((f) => ({ name: f.name, value: db.donations.filter((d) => d.foodType === f.key).length })),
    byOrgType: orgTypes.map(([k, name]) => ({
      name,
      value: db.donations.filter((d) => d.donor.organizationType === k).length,
    })),
  };
}

/** Entry point used by the Axios mock adapter (and tests). */
export function handleMockRequest(req: MockRequest): MockResponse {
  const db = loadDb();
  sweepExpired(db);
  try {
    const data = route(db, req);
    saveDb(db);
    return { status: 200, data: JSON.parse(JSON.stringify(data ?? null)) };
  } catch (e) {
    saveDb(db);
    if (e instanceof HttpError) return { status: e.status, data: { message: e.message } };
    return { status: 500, data: { message: e instanceof Error ? e.message : "Unexpected error" } };
  }
}
