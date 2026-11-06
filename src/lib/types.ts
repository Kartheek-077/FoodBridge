export type Role = "donor" | "ngo" | "admin";

export type OrgType = "restaurant" | "hotel" | "marriage_hall" | "hostel" | "event_organizer";

export type VerificationStatus = "pending" | "verified" | "rejected";

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  /** Donor only */
  organizationType?: OrgType;
  /** NGO only */
  organizationName?: string;
  registrationNumber?: string;
  serviceArea?: string;
  verificationStatus?: VerificationStatus;
  verificationDocumentUrl?: string | null;
  verificationDocumentName?: string | null;
  rejectionReason?: string | null;
  verifiedAt?: string | null;
}

export type DonationStatus = "available" | "claimed" | "collected" | "expired" | "cancelled";
export type FoodType = "veg" | "non-veg" | "both";
export type QuantityUnit = "servings" | "kg";

export interface DonationClaim {
  ngoId: string;
  ngoName: string;
  ngoPhone: string;
  claimedAt: string;
  pickupTime?: string | null;
}

export interface DonationHistoryEntry {
  status: DonationStatus | "posted" | "pickup_scheduled";
  at: string;
  note?: string;
}

export interface Donation {
  id: string;
  title: string;
  description: string;
  foodType: FoodType;
  quantity: number;
  unit: QuantityUnit;
  imageUrl?: string | null;
  pickupAddress: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  expiresAt: string;
  notes?: string;
  status: DonationStatus;
  donor: {
    id: string;
    name: string;
    organizationType?: OrgType;
    phone: string;
  };
  claim?: DonationClaim | null;
  collectedAt?: string | null;
  cancelledAt?: string | null;
  expiredAt?: string | null;
  cancelReason?: string | null;
  location?: { lat: number; lng: number } | null;
  distanceKm?: number | null;
  createdAt: string;
  updatedAt: string;
  history?: DonationHistoryEntry[];
}

export type NotificationType =
  | "donation:new"
  | "donation:claimed"
  | "donation:collected"
  | "donation:cancelled"
  | "ngo:verified"
  | "ngo:rejected"
  | "ngo:registered";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  donationId?: string | null;
  read: boolean;
  createdAt: string;
}

/** Payload pushed over the socket for every real-time event. */
export interface SocketEventPayload {
  notification: AppNotification;
  donation?: Donation | null;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
}

export interface AdminStats {
  mealsSaved: number;
  activeDonors: number;
  verifiedNgos: number;
  pendingNgos?: number;
  totalDonations?: number;
  totalUsers?: number;
  byStatus?: Record<DonationStatus, number>;
  byFoodType?: { name: string; value: number }[];
  daily?: { date: string; posted: number; collected: number }[];
  byOrgType?: { name: string; value: number }[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DonationListParams {
  status?: DonationStatus;
  foodType?: FoodType;
  search?: string;
  page?: number;
  location?: string;
  expiringSoon?: boolean;
}

export interface DonorRegisterPayload {
  role: "donor";
  name: string;
  organizationType: OrgType;
  email: string;
  phone: string;
  address: string;
  password: string;
}

export interface NgoRegisterPayload {
  role: "ngo";
  organizationName: string;
  registrationNumber: string;
  email: string;
  phone: string;
  address: string;
  serviceArea: string;
  password: string;
  document: File;
}

export type RegisterPayload = DonorRegisterPayload | NgoRegisterPayload;

export interface DonationInput {
  title: string;
  description: string;
  foodType: FoodType;
  quantity: number;
  unit: QuantityUnit;
  pickupAddress: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  expiresAt: string;
  notes?: string;
  image?: File | null;
}
