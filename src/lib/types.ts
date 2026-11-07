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
  organizationType?: OrgType | undefined;
  /** NGO only */
  organizationName?: string | undefined;
  registrationNumber?: string | undefined;
  serviceArea?: string | undefined;
  verificationStatus?: VerificationStatus | undefined;
  verificationDocumentUrl?: string | null | undefined;
  verificationDocumentName?: string | null | undefined;
  rejectionReason?: string | null | undefined;
  verifiedAt?: string | null | undefined;
}

export type DonationStatus = "available" | "claimed" | "collected" | "expired" | "cancelled";
export type FoodType = "veg" | "non-veg" | "both";
export type QuantityUnit = "servings" | "kg";

export interface DonationClaim {
  ngoId: string;
  ngoName: string;
  ngoPhone: string;
  claimedAt: string;
  pickupTime?: string | null | undefined;
}

export interface DonationHistoryEntry {
  status: DonationStatus | "posted" | "pickup_scheduled";
  at: string;
  note?: string | undefined;
}

export interface Donation {
  id: string;
  title: string;
  description: string;
  foodType: FoodType;
  quantity: number;
  unit: QuantityUnit;
  imageUrl?: string | null | undefined;
  pickupAddress: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  expiresAt: string;
  notes?: string | undefined;
  status: DonationStatus;
  donor: {
    id: string;
    name: string;
    organizationType?: OrgType | undefined;
    phone: string;
  };
  claim?: DonationClaim | null | undefined;
  collectedAt?: string | null | undefined;
  cancelledAt?: string | null | undefined;
  expiredAt?: string | null | undefined;
  cancelReason?: string | null | undefined;
  location?: { lat: number; lng: number } | null | undefined;
  distanceKm?: number | null | undefined;
  createdAt: string;
  updatedAt: string;
  history?: DonationHistoryEntry[] | undefined;
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
  donationId?: string | null | undefined;
  read: boolean;
  createdAt: string;
}

/** Payload pushed over the socket for every real-time event. */
export interface SocketEventPayload {
  notification: AppNotification;
  donation?: Donation | null | undefined;
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
  pendingNgos?: number | undefined;
  totalDonations?: number | undefined;
  totalUsers?: number | undefined;
  byStatus?: Record<DonationStatus, number> | undefined;
  byFoodType?: { name: string; value: number }[] | undefined;
  daily?: { date: string; posted: number; collected: number }[] | undefined;
  byOrgType?: { name: string; value: number }[] | undefined;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DonationListParams {
  status?: DonationStatus | undefined;
  foodType?: FoodType | undefined;
  search?: string | undefined;
  page?: number | undefined;
  location?: string | undefined;
  expiringSoon?: boolean | undefined;
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
  notes?: string | undefined;
  image?: File | null | undefined;
}
