import { beforeEach, describe, expect, it } from "vitest";
import { handleMockRequest, tokenForUser } from "@/lib/mock/handlers";
import { loadDb, resetDb, saveDb } from "@/lib/mock/db";
import { computeTrackingSteps } from "@/lib/donation-utils";
import type { AppNotification, Donation } from "@/lib/types";

const asUser = (id: string) => `Bearer ${tokenForUser(id)}`;

function req(method: string, url: string, token: string | null, body?: Record<string, unknown>) {
  return handleMockRequest({ method, url, token, body: body ?? null });
}

describe("FoodBridge business rules (mock backend)", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDb();
  });

  it("only verified NGOs can claim donations", () => {
    const res = req("POST", "/donations/d_101/claim", asUser("u_ngo3")); // pending NGO
    expect(res.status).toBe(403);
    expect((res.data as { message: string }).message).toMatch(/verified/i);
  });

  it("a verified NGO claim moves the donation to claimed and notifies the donor", () => {
    const res = req("POST", "/donations/d_101/claim", asUser("u_ngo1"));
    expect(res.status).toBe(200);
    expect((res.data as Donation).status).toBe("claimed");
    const notes = req("GET", "/notifications", asUser("u_donor1")).data as AppNotification[];
    expect(notes[0]?.type).toBe("donation:claimed");
    expect(notes[0]?.donationId).toBe("d_101");
  });

  it("donors cannot claim donations", () => {
    expect(req("POST", "/donations/d_102/claim", asUser("u_donor1")).status).toBe(403);
  });

  it("an already-claimed donation cannot be claimed again", () => {
    expect(req("POST", "/donations/d_106/claim", asUser("u_ngo2")).status).toBe(409);
  });

  it("donations past their expiry become expired and cannot be claimed", () => {
    const db = loadDb();
    const d = db.donations.find((x) => x.id === "d_103")!;
    d.expiresAt = new Date(Date.now() - 60_000).toISOString();
    saveDb(db);
    const res = req("POST", "/donations/d_103/claim", asUser("u_ngo1"));
    expect(res.status).toBe(409);
    const after = req("GET", "/donations/d_103", asUser("u_donor1")).data as Donation;
    expect(after.status).toBe("expired");
  });

  it("only claimed donations can be marked collected", () => {
    expect(req("PATCH", "/donations/d_101/status", asUser("u_donor1"), { status: "collected" }).status).toBe(409);
    const ok = req("PATCH", "/donations/d_106/status", asUser("u_ngo1"), { status: "collected" });
    expect(ok.status).toBe(200);
    expect((ok.data as Donation).status).toBe("collected");
  });

  it("NGOs only browse available donations", () => {
    const res = req("GET", "/donations", asUser("u_ngo1"));
    const items = (res.data as { items: Donation[] }).items;
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((d) => d.status === "available")).toBe(true);
  });

  it("admin approval verifies a pending NGO, which can then claim", () => {
    expect(req("PATCH", "/admin/ngos/u_ngo3/verify", asUser("u_admin"), { action: "approve" }).status).toBe(200);
    expect(req("POST", "/donations/d_101/claim", asUser("u_ngo3")).status).toBe(200);
  });

  it("rejecting an NGO requires a reason", () => {
    expect(req("PATCH", "/admin/ngos/u_ngo3/verify", asUser("u_admin"), { action: "reject" }).status).toBe(422);
  });

  it("non-admins cannot verify NGOs", () => {
    expect(req("PATCH", "/admin/ngos/u_ngo3/verify", asUser("u_donor1"), { action: "approve" }).status).toBe(403);
  });

  it("requests without a valid token get 401", () => {
    expect(req("GET", "/donations/mine", null).status).toBe(401);
  });
});

describe("tracking stepper", () => {
  it("shows Posted, Claimed and Pickup scheduled done, Collected current for a scheduled claim", () => {
    resetDb();
    const d = loadDb().donations.find((x) => x.id === "d_106")!;
    const steps = computeTrackingSteps(d);
    expect(steps.map((s) => [s.key, s.state])).toEqual([
      ["posted", "done"],
      ["claimed", "done"],
      ["pickup_scheduled", "done"],
      ["collected", "current"],
    ]);
  });

  it("ends with an Expired stop for expired donations", () => {
    resetDb();
    const d = loadDb().donations.find((x) => x.id === "d_109")!;
    const steps = computeTrackingSteps(d);
    expect(steps.at(-1)).toMatchObject({ key: "expired", state: "stopped" });
  });
});
