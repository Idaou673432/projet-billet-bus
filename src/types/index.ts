export type Currency = 'XOF' | 'XAF' | 'GNF' | 'MRU' | 'EUR';
export type Language = 'fr' | 'bm' | 'wo' | 'en';
export type UserRole = 'traveler' | 'controller' | 'counter_agent' | 'company_manager' | 'platform_admin';

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  assignedStation?: string; // Ex: "Gare Routière Sogoniko, Bamako"
  assignedCompanyId?: string; // Ex: "nour_transport"
  assignedCompanyName?: string;
  createdAt?: string;
}

export interface ScanLogRecord {
  id: string;
  pnr: string;
  scannedAt: string;
  scannedDate?: string;
  passengerName: string;
  tripSummary: string;
  seatNumber: string;
  status: 'valid' | 'already_boarded' | 'invalid';
  agentName: string;
  companyName?: string;
  syncMode?: 'cloud' | 'offline_cache';
}

export interface Country {
  code: string; // ML, SN, CI, BF, GN, NE, TG, BJ, MR
  name: string;
  flag: string;
  currency: Currency;
  phonePrefix: string;
}

export interface City {
  id: string;
  name: string;
  countryCode: string;
  isPopular?: boolean;
}

export interface Station {
  id: string;
  name: string;
  cityName: string;
  countryCode: string;
  address: string;
  phone?: string;
}

export interface BusCompany {
  id: string;
  name: string;
  logoText: string;
  logoUrl?: string;
  brandColor?: string;
  rating: number;
  totalReviews: number;
  phone: string;
  headquarters: string;
  amenitiesDescription: string;
  verified: boolean;
}

export type BusClass = 'standard' | 'vip' | 'express_direct';

export interface BusSeat {
  id: string;
  number: string;
  row: number;
  column: number; // 1, 2 (corridor) 3, 4
  status: 'available' | 'occupied' | 'selected' | 'reserved_female';
  priceMultiplier?: number;
  isWindow?: boolean;
}

export interface Amenity {
  id: string;
  label: string;
  icon: string;
}

export interface Trip {
  id: string;
  companyId: string;
  companyName: string;
  companyLogoUrl?: string;
  originCity: string;
  originCountry: string;
  originStationId: string;
  originStationName: string;
  destinationCity: string;
  destinationCountry: string;
  destinationStationId: string;
  destinationStationName: string;
  departureTime: string; // ISO or HH:mm
  departureDate: string; // YYYY-MM-DD
  arrivalTime: string;
  arrivalDate: string;
  durationHours: number;
  durationMinutes: number;
  distanceKm: number;
  basePriceXOF: number;
  busClass: BusClass;
  busModel: string;
  plateNumber: string;
  totalSeats: number;
  availableSeats: number;
  isCrossBorder: boolean;
  borderRequirements?: string[];
  amenities: string[]; // 'wifi', 'ac', 'usb', 'wc', 'tv', 'water'
  cancellationPolicy: string;
}

export interface Passenger {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  idType: 'CNI' | 'PASSPORT' | 'CARTE_NINA' | 'CARTE_CEDEAO' | 'AUTRE';
  idNumber: string;
  nationality: string;
  seatNumber: string;
}

export type PaymentProvider = 
  | 'orange_money' 
  | 'wave' 
  | 'moov_money' 
  | 'mtn_momo' 
  | 'card' 
  | 'cash_counter';

export interface Booking {
  id: string;
  pnr: string; // Unique ticket booking reference (e.g. AFW-84920)
  tripId: string;
  trip: Trip;
  companyLogoUrl?: string;
  passengers: Passenger[];
  totalAmountXOF: number;
  currency: Currency;
  paymentProvider: PaymentProvider;
  paymentPhone?: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  bookingDate: string;
  boardingStatus: 'not_boarded' | 'boarded' | 'cancelled';
  boardedAt?: string;
  boardedByAgent?: string;
  verificationHash: string;
  notes?: string;
}

export interface BrandConfig {
  brandName: string;
  slogan: string;
  logoUrl?: string;
  primaryColor: string; // emerald, forest, gold
  supportPhone: string;
  supportEmail: string;
  serviceFeeXOF?: number;
  ticketNotice?: string;
}
