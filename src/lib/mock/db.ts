import type { AppNotification, Donation, User } from "../types";
import foodBiryani from "@/assets/food-biryani.jpg";
import foodBakery from "@/assets/food-bakery.jpg";
import foodBuffet from "@/assets/food-buffet.jpg";
import heroImg from "@/assets/hero-food-sharing.jpg";

export interface MockUser extends User {
  password: string;
  lat?: number;
  lng?: number;
}

export interface MockDb {
  version: number;
  users: MockUser[];
  donations: Donation[];
  notifications: AppNotification[];
}

const STORAGE_KEY = "foodbridge_mock_db";
const DB_VERSION = 1;

export const DEMO_ACCOUNTS = [
  { label: "Donor", email: "donor@foodbridge.org", password: "password123" },
  { label: "Verified NGO", email: "ngo@foodbridge.org", password: "password123" },
  { label: "Pending NGO", email: "pending@foodbridge.org", password: "password123" },
  { label: "Admin", email: "admin@foodbridge.org", password: "password123" },
] as const;

export const AREAS: Record<string, { lat: number; lng: number }> = {
  "Banjara Hills": { lat: 17.4156, lng: 78.4347 },
  Gachibowli: { lat: 17.4401, lng: 78.3489 },
  Kukatpally: { lat: 17.4948, lng: 78.3996 },
  Secunderabad: { lat: 17.4399, lng: 78.4983 },
  Madhapur: { lat: 17.4483, lng: 78.3915 },
  Ameerpet: { lat: 17.4375, lng: 78.4482 },
  "Jubilee Hills": { lat: 17.4326, lng: 78.4071 },
  Begumpet: { lat: 17.4447, lng: 78.4664 },
};

let idCounter = 0;
export function newId(prefix: string) {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function iso(offsetMs: number, now: number) {
  return new Date(now + offsetMs).toISOString();
}

const H = 3600_000;
const D = 24 * H;

function buildSeed(): MockDb {
  const now = Date.now();
  const users: MockUser[] = [
    {
      id: "u_admin",
      role: "admin",
      name: "Ananya Rao",
      email: "admin@foodbridge.org",
      password: "password123",
      phone: "+91 98480 11111",
      address: "FoodBridge HQ, Begumpet, Hyderabad",
      createdAt: iso(-90 * D, now),
    },
    {
      id: "u_donor1",
      role: "donor",
      name: "Spice Route Kitchen",
      organizationType: "restaurant",
      email: "donor@foodbridge.org",
      password: "password123",
      phone: "+91 98480 22222",
      address: "Road No. 12, Banjara Hills, Hyderabad",
      createdAt: iso(-60 * D, now),
      ...AREAS["Banjara Hills"],
    },
    {
      id: "u_donor2",
      role: "donor",
      name: "Grand Kakatiya Hotel",
      organizationType: "hotel",
      email: "hotel@foodbridge.org",
      password: "password123",
      phone: "+91 98480 33333",
      address: "Begumpet Main Road, Hyderabad",
      createdAt: iso(-45 * D, now),
      ...AREAS.Begumpet,
    },
    {
      id: "u_donor3",
      role: "donor",
      name: "Sri Lakshmi Convention Hall",
      organizationType: "marriage_hall",
      email: "hall@foodbridge.org",
      password: "password123",
      phone: "+91 98480 44444",
      address: "KPHB Colony, Kukatpally, Hyderabad",
      createdAt: iso(-30 * D, now),
      ...AREAS.Kukatpally,
    },
    {
      id: "u_donor4",
      role: "donor",
      name: "Campus Hostel Mess",
      organizationType: "hostel",
      email: "hostel@foodbridge.org",
      password: "password123",
      phone: "+91 98480 55555",
      address: "Financial District, Gachibowli, Hyderabad",
      createdAt: iso(-20 * D, now),
      ...AREAS.Gachibowli,
    },
    {
      id: "u_ngo1",
      role: "ngo",
      name: "Annam Seva Foundation",
      organizationName: "Annam Seva Foundation",
      registrationNumber: "TS/NGO/2019/04512",
      email: "ngo@foodbridge.org",
      password: "password123",
      phone: "+91 90000 11111",
      address: "Ameerpet X Roads, Hyderabad",
      serviceArea: "Ameerpet, Banjara Hills, Begumpet",
      verificationStatus: "verified",
      verificationDocumentUrl: heroImg,
      verificationDocumentName: "registration-certificate.jpg",
      verifiedAt: iso(-50 * D, now),
      createdAt: iso(-55 * D, now),
      ...AREAS.Ameerpet,
    },
    {
      id: "u_ngo2",
      role: "ngo",
      name: "Roti Bank Hyderabad",
      organizationName: "Roti Bank Hyderabad",
      registrationNumber: "TS/NGO/2020/08877",
      email: "rotibank@foodbridge.org",
      password: "password123",
      phone: "+91 90000 22222",
      address: "Secunderabad Station Road, Hyderabad",
      serviceArea: "Secunderabad, Begumpet",
      verificationStatus: "verified",
      verificationDocumentUrl: heroImg,
      verificationDocumentName: "trust-deed.jpg",
      verifiedAt: iso(-25 * D, now),
      createdAt: iso(-28 * D, now),
      ...AREAS.Secunderabad,
    },
    {
      id: "u_ngo3",
      role: "ngo",
      name: "Hope Meals Trust",
      organizationName: "Hope Meals Trust",
      registrationNumber: "TS/NGO/2024/11230",
      email: "pending@foodbridge.org",
      password: "password123",
      phone: "+91 90000 33333",
      address: "Madhapur, Hyderabad",
      serviceArea: "Madhapur, Gachibowli",
      verificationStatus: "pending",
      verificationDocumentUrl: heroImg,
      verificationDocumentName: "12A-certificate.jpg",
      createdAt: iso(-2 * D, now),
      ...AREAS.Madhapur,
    },
    {
      id: "u_ngo4",
      role: "ngo",
      name: "Little Hands Shelter",
      organizationName: "Little Hands Shelter",
      registrationNumber: "TS/NGO/2023/09981",
      email: "littlehands@foodbridge.org",
      password: "password123",
      phone: "+91 90000 44444",
      address: "Jubilee Hills, Hyderabad",
      serviceArea: "Jubilee Hills, Banjara Hills",
      verificationStatus: "pending",
      verificationDocumentUrl: heroImg,
      verificationDocumentName: "society-registration.jpg",
      createdAt: iso(-1 * D, now),
      ...AREAS["Jubilee Hills"],
    },
  ];

  const donorRef = (id: string) => {
    const u = users.find((x) => x.id === id)!;
    return { id: u.id, name: u.name, organizationType: u.organizationType, phone: u.phone };
  };
  const ngo1 = users.find((u) => u.id === "u_ngo1")!;
  const ngo2 = users.find((u) => u.id === "u_ngo2")!;

  type Seed = Omit<Donation, "updatedAt" | "history"> & { history?: Donation["history"] };
  const seeds: Seed[] = [
    {
      id: "d_101",
      title: "Veg biryani & paneer curry",
      description: "Freshly cooked for a corporate lunch order that was reduced last minute. Packed in clean steel trays.",
      foodType: "veg",
      quantity: 60,
      unit: "servings",
      imageUrl: foodBiryani,
      pickupAddress: "Road No. 12, Banjara Hills, Hyderabad",
      pickupWindowStart: iso(-1 * H, now),
      pickupWindowEnd: iso(3 * H, now),
      expiresAt: iso(4 * H, now),
      notes: "Please bring your own containers. Ask for Ravi at the back gate.",
      status: "available",
      donor: donorRef("u_donor1"),
      location: AREAS["Banjara Hills"],
      createdAt: iso(-2 * H, now),
    },
    {
      id: "d_102",
      title: "Hotel buffet surplus – rice, dal, grilled chicken",
      description: "Untouched buffet trays from tonight's dinner service, kept in hot holding.",
      foodType: "both",
      quantity: 85,
      unit: "servings",
      imageUrl: foodBuffet,
      pickupAddress: "Begumpet Main Road, Hyderabad",
      pickupWindowStart: iso(0, now),
      pickupWindowEnd: iso(2 * H, now),
      expiresAt: iso(2.5 * H, now),
      notes: "Veg and non-veg are packed separately.",
      status: "available",
      donor: donorRef("u_donor2"),
      location: AREAS.Begumpet,
      createdAt: iso(-1 * H, now),
    },
    {
      id: "d_103",
      title: "Sandwiches, salads & fresh bread",
      description: "End-of-day packed sandwiches, salad bowls and bread loaves. All prepared this morning.",
      foodType: "veg",
      quantity: 12,
      unit: "kg",
      imageUrl: foodBakery,
      pickupAddress: "Road No. 12, Banjara Hills, Hyderabad",
      pickupWindowStart: iso(1 * H, now),
      pickupWindowEnd: iso(6 * H, now),
      expiresAt: iso(10 * H, now),
      status: "available",
      donor: donorRef("u_donor1"),
      location: AREAS["Banjara Hills"],
      createdAt: iso(-30 * 60_000, now),
    },
    {
      id: "d_104",
      title: "Wedding reception surplus",
      description: "Pulao, mixed veg curry, chicken 65 and sweets from a 600-guest reception.",
      foodType: "both",
      quantity: 150,
      unit: "servings",
      imageUrl: foodBiryani,
      pickupAddress: "KPHB Colony, Kukatpally, Hyderabad",
      pickupWindowStart: iso(2 * H, now),
      pickupWindowEnd: iso(8 * H, now),
      expiresAt: iso(20 * H, now),
      notes: "Large quantity – a van is recommended.",
      status: "available",
      donor: donorRef("u_donor3"),
      location: AREAS.Kukatpally,
      createdAt: iso(-3 * H, now),
    },
    {
      id: "d_105",
      title: "Hostel mess dinner – chapati & dal",
      description: "Extra chapatis, dal tadka and jeera rice from the evening mess.",
      foodType: "veg",
      quantity: 40,
      unit: "servings",
      imageUrl: foodBuffet,
      pickupAddress: "Financial District, Gachibowli, Hyderabad",
      pickupWindowStart: iso(3 * H, now),
      pickupWindowEnd: iso(7 * H, now),
      expiresAt: iso(30 * H, now),
      status: "available",
      donor: donorRef("u_donor4"),
      location: AREAS.Gachibowli,
      createdAt: iso(-20 * 60_000, now),
    },
    {
      id: "d_106",
      title: "Lunch thalis – mixed",
      description: "Leftover thalis from a catering order. Sealed portions.",
      foodType: "both",
      quantity: 35,
      unit: "servings",
      imageUrl: foodBuffet,
      pickupAddress: "Road No. 12, Banjara Hills, Hyderabad",
      pickupWindowStart: iso(-2 * H, now),
      pickupWindowEnd: iso(2 * H, now),
      expiresAt: iso(5 * H, now),
      status: "claimed",
      donor: donorRef("u_donor1"),
      claim: {
        ngoId: ngo1.id,
        ngoName: ngo1.organizationName!,
        ngoPhone: ngo1.phone,
        claimedAt: iso(-90 * 60_000, now),
        pickupTime: iso(1 * H, now),
      },
      location: AREAS["Banjara Hills"],
      createdAt: iso(-4 * H, now),
    },
    {
      id: "d_107",
      title: "Breakfast buffet – idli, upma, fruit",
      description: "Morning buffet surplus.",
      foodType: "veg",
      quantity: 50,
      unit: "servings",
      imageUrl: foodBakery,
      pickupAddress: "Begumpet Main Road, Hyderabad",
      pickupWindowStart: iso(-1 * D, now),
      pickupWindowEnd: iso(-1 * D + 3 * H, now),
      expiresAt: iso(-1 * D + 5 * H, now),
      status: "collected",
      donor: donorRef("u_donor2"),
      claim: {
        ngoId: ngo2.id,
        ngoName: ngo2.organizationName!,
        ngoPhone: ngo2.phone,
        claimedAt: iso(-1 * D + 20 * 60_000, now),
        pickupTime: iso(-1 * D + 2 * H, now),
      },
      collectedAt: iso(-1 * D + 2 * H, now),
      location: AREAS.Begumpet,
      createdAt: iso(-1 * D, now),
    },
    {
      id: "d_108",
      title: "Party trays – paneer tikka & naan",
      description: "Event leftovers, kept refrigerated.",
      foodType: "veg",
      quantity: 70,
      unit: "servings",
      imageUrl: foodBiryani,
      pickupAddress: "Road No. 12, Banjara Hills, Hyderabad",
      pickupWindowStart: iso(-3 * D, now),
      pickupWindowEnd: iso(-3 * D + 4 * H, now),
      expiresAt: iso(-3 * D + 6 * H, now),
      status: "collected",
      donor: donorRef("u_donor1"),
      claim: {
        ngoId: ngo1.id,
        ngoName: ngo1.organizationName!,
        ngoPhone: ngo1.phone,
        claimedAt: iso(-3 * D + 30 * 60_000, now),
        pickupTime: iso(-3 * D + 2 * H, now),
      },
      collectedAt: iso(-3 * D + 2 * H, now),
      location: AREAS["Banjara Hills"],
      createdAt: iso(-3 * D, now),
    },
    {
      id: "d_109",
      title: "Leftover rice & curry",
      description: "Dinner surplus.",
      foodType: "non-veg",
      quantity: 20,
      unit: "servings",
      imageUrl: foodBuffet,
      pickupAddress: "Road No. 12, Banjara Hills, Hyderabad",
      pickupWindowStart: iso(-2 * D, now),
      pickupWindowEnd: iso(-2 * D + 2 * H, now),
      expiresAt: iso(-2 * D + 3 * H, now),
      status: "expired",
      expiredAt: iso(-2 * D + 3 * H, now),
      donor: donorRef("u_donor1"),
      location: AREAS["Banjara Hills"],
      createdAt: iso(-2 * D, now),
    },
    {
      id: "d_110",
      title: "Sweets & snacks box",
      description: "Mithai boxes from a cancelled event.",
      foodType: "veg",
      quantity: 8,
      unit: "kg",
      imageUrl: foodBakery,
      pickupAddress: "KPHB Colony, Kukatpally, Hyderabad",
      pickupWindowStart: iso(-4 * D, now),
      pickupWindowEnd: iso(-4 * D + 4 * H, now),
      expiresAt: iso(-3 * D, now),
      status: "collected",
      donor: donorRef("u_donor3"),
      claim: {
        ngoId: ngo2.id,
        ngoName: ngo2.organizationName!,
        ngoPhone: ngo2.phone,
        claimedAt: iso(-4 * D + H, now),
        pickupTime: iso(-4 * D + 3 * H, now),
      },
      collectedAt: iso(-4 * D + 3 * H, now),
      location: AREAS.Kukatpally,
      createdAt: iso(-4 * D, now),
    },
    {
      id: "d_111",
      title: "Mess lunch – sambar rice",
      description: "Lunch surplus from hostel mess.",
      foodType: "veg",
      quantity: 45,
      unit: "servings",
      imageUrl: foodBuffet,
      pickupAddress: "Financial District, Gachibowli, Hyderabad",
      pickupWindowStart: iso(-5 * D, now),
      pickupWindowEnd: iso(-5 * D + 3 * H, now),
      expiresAt: iso(-5 * D + 6 * H, now),
      status: "collected",
      donor: donorRef("u_donor4"),
      claim: {
        ngoId: ngo1.id,
        ngoName: ngo1.organizationName!,
        ngoPhone: ngo1.phone,
        claimedAt: iso(-5 * D + H, now),
        pickupTime: iso(-5 * D + 2 * H, now),
      },
      collectedAt: iso(-5 * D + 2 * H, now),
      location: AREAS.Gachibowli,
      createdAt: iso(-5 * D, now),
    },
    {
      id: "d_112",
      title: "Cake & pastries",
      description: "Bakery counter leftovers.",
      foodType: "veg",
      quantity: 5,
      unit: "kg",
      imageUrl: foodBakery,
      pickupAddress: "Begumpet Main Road, Hyderabad",
      pickupWindowStart: iso(-6 * D, now),
      pickupWindowEnd: iso(-6 * D + 3 * H, now),
      expiresAt: iso(-6 * D + 8 * H, now),
      status: "cancelled",
      cancelledAt: iso(-6 * D + H, now),
      cancelReason: "Donor used the food for staff meals",
      donor: donorRef("u_donor2"),
      location: AREAS.Begumpet,
      createdAt: iso(-6 * D, now),
    },
  ];

  const donations: Donation[] = seeds.map((s) => {
    const history: Donation["history"] = [{ status: "posted", at: s.createdAt }];
    if (s.claim) history.push({ status: "claimed", at: s.claim.claimedAt });
    if (s.claim?.pickupTime) history.push({ status: "pickup_scheduled", at: s.claim.pickupTime });
    if (s.collectedAt) history.push({ status: "collected", at: s.collectedAt });
    if (s.cancelledAt) history.push({ status: "cancelled", at: s.cancelledAt });
    if (s.expiredAt) history.push({ status: "expired", at: s.expiredAt });
    return { ...s, history, updatedAt: s.createdAt };
  });

  const notifications: AppNotification[] = [
    {
      id: "n_1",
      userId: "u_donor1",
      type: "donation:claimed",
      title: "Donation claimed",
      message: "Annam Seva Foundation claimed “Lunch thalis – mixed”.",
      donationId: "d_106",
      read: false,
      createdAt: iso(-90 * 60_000, now),
    },
    {
      id: "n_2",
      userId: "u_donor1",
      type: "donation:collected",
      title: "Donation collected",
      message: "“Party trays – paneer tikka & naan” was collected. 70 servings saved!",
      donationId: "d_108",
      read: true,
      createdAt: iso(-3 * D + 2 * H, now),
    },
    {
      id: "n_3",
      userId: "u_ngo1",
      type: "donation:new",
      title: "New donation nearby",
      message: "Spice Route Kitchen posted “Sandwiches, salads & fresh bread” (12 kg).",
      donationId: "d_103",
      read: false,
      createdAt: iso(-30 * 60_000, now),
    },
    {
      id: "n_4",
      userId: "u_ngo1",
      type: "donation:new",
      title: "New donation nearby",
      message: "Grand Kakatiya Hotel posted “Hotel buffet surplus” (85 servings).",
      donationId: "d_102",
      read: false,
      createdAt: iso(-1 * H, now),
    },
    {
      id: "n_5",
      userId: "u_admin",
      type: "ngo:registered",
      title: "New NGO awaiting verification",
      message: "Little Hands Shelter submitted documents for review.",
      read: false,
      createdAt: iso(-1 * D, now),
    },
    {
      id: "n_6",
      userId: "u_ngo3",
      type: "ngo:registered",
      title: "Documents received",
      message: "Thanks for registering! Our team is reviewing your documents.",
      read: false,
      createdAt: iso(-2 * D, now),
    },
  ];

  return { version: DB_VERSION, users, donations, notifications };
}

let memoryDb: MockDb | null = null;

export function loadDb(): MockDb {
  if (memoryDb) return memoryDb;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MockDb;
        if (parsed.version === DB_VERSION) {
          memoryDb = parsed;
          return parsed;
        }
      }
    } catch {
      /* fall through to seed */
    }
  }
  memoryDb = buildSeed();
  saveDb(memoryDb);
  return memoryDb;
}

export function saveDb(db: MockDb) {
  memoryDb = db;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Storage full (large images) – keep working in memory.
  }
}

/** Re-read from storage (another tab may have written). */
export function refreshDbFromStorage() {
  memoryDb = null;
}

export function resetDb() {
  memoryDb = buildSeed();
  saveDb(memoryDb);
}

export function publicUser(u: MockUser): User {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, lat, lng, ...rest } = u;
  return rest;
}

export function coordsForAddress(address: string): { lat: number; lng: number } | null {
  const lower = address.toLowerCase();
  for (const [name, c] of Object.entries(AREAS)) {
    if (lower.includes(name.toLowerCase())) return c;
  }
  return null;
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)) * 10) / 10;
}
