import { Booking, BrandConfig, Trip, BusCompany } from '../types';
import { INITIAL_BOOKINGS, INITIAL_TRIPS, BUS_COMPANIES } from '../data/mockData';
import { DEFAULT_COMPANY_LOGOS } from './companyLogos';

const BOOKINGS_KEY = 'afriway_bookings_v1';
const BRAND_KEY = 'afriway_brand_config_v1';
const TRIPS_KEY = 'afriway_trips_v1';
const COMPANIES_KEY = 'afriway_companies_v1';

export const DEFAULT_BRAND_CONFIG: BrandConfig = {
  brandName: 'AFRIWAY',
  slogan: 'Votre voyage, partout en Afrique.',
  primaryColor: 'emerald',
  supportPhone: '+223 20 28 00 00',
  supportEmail: 'contact@afriway.africa',
  serviceFeeXOF: 0,
  ticketNotice: 'Présentation obligatoire 30 minutes avant le départ avec une pièce d\'identité valide.',
};

export function getStoredBrandConfig(): BrandConfig {
  try {
    const raw = localStorage.getItem(BRAND_KEY);
    if (!raw) return DEFAULT_BRAND_CONFIG;
    return { ...DEFAULT_BRAND_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BRAND_CONFIG;
  }
}

export function saveBrandConfig(config: BrandConfig): void {
  try {
    localStorage.setItem(BRAND_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving brand config:', err);
  }
}

export function getStoredCompanies(): BusCompany[] {
  try {
    const raw = localStorage.getItem(COMPANIES_KEY);
    if (!raw) {
      localStorage.setItem(COMPANIES_KEY, JSON.stringify(BUS_COMPANIES));
      return BUS_COMPANIES;
    }
    const parsed: BusCompany[] = JSON.parse(raw);
    // ensure default logos are filled if missing
    return parsed.map((c) => ({
      ...c,
      logoUrl: c.logoUrl || DEFAULT_COMPANY_LOGOS[c.id] || DEFAULT_COMPANY_LOGOS.nour_transport,
    }));
  } catch {
    return BUS_COMPANIES;
  }
}

export function saveCompanies(companies: BusCompany[]): void {
  try {
    localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
  } catch (err) {
    console.error('Error saving companies:', err);
  }
}

export function updateCompany(updatedCompany: BusCompany): BusCompany[] {
  const current = getStoredCompanies();
  const idx = current.findIndex((c) => c.id === updatedCompany.id);
  let updatedList: BusCompany[];
  if (idx >= 0) {
    updatedList = [...current];
    updatedList[idx] = updatedCompany;
  } else {
    updatedList = [updatedCompany, ...current];
  }
  saveCompanies(updatedList);
  return updatedList;
}

export function getCompanyById(companyId: string): BusCompany | undefined {
  const companies = getStoredCompanies();
  return companies.find((c) => c.id === companyId || c.name.toLowerCase() === companyId.toLowerCase());
}

export function getStoredBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    if (!raw) {
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(INITIAL_BOOKINGS));
      return INITIAL_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_BOOKINGS;
  }
}

export function saveBooking(booking: Booking): void {
  try {
    const current = getStoredBookings();
    const updated = [booking, ...current.filter((b) => b.id !== booking.id && b.pnr !== booking.pnr)];
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving booking:', err);
  }
}

export function findBookingByPNR(pnrQuery: string): Booking | undefined {
  const bookings = getStoredBookings();
  const clean = pnrQuery.trim().toUpperCase();
  return bookings.find(
    (b) => b.pnr.toUpperCase() === clean || b.pnr.replace(/-/g, '').toUpperCase() === clean.replace(/-/g, '')
  );
}

export function updateBoardingStatus(
  pnr: string,
  status: 'boarded' | 'not_boarded',
  agentName: string = 'Agent de Contrôle'
): Booking | null {
  const bookings = getStoredBookings();
  const index = bookings.findIndex((b) => b.pnr.toUpperCase() === pnr.toUpperCase());
  if (index === -1) return null;

  bookings[index] = {
    ...bookings[index],
    boardingStatus: status,
    boardedAt: status === 'boarded' ? new Date().toISOString() : undefined,
    boardedByAgent: status === 'boarded' ? agentName : undefined,
  };

  try {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  } catch (err) {
    console.error('Error updating boarding status:', err);
  }

  return bookings[index];
}

export function getStoredTrips(): Trip[] {
  try {
    const raw = localStorage.getItem(TRIPS_KEY);
    if (!raw) {
      localStorage.setItem(TRIPS_KEY, JSON.stringify(INITIAL_TRIPS));
      return INITIAL_TRIPS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TRIPS;
  }
}

export function addCustomTrip(trip: Trip): void {
  try {
    const current = getStoredTrips();
    localStorage.setItem(TRIPS_KEY, JSON.stringify([trip, ...current]));
  } catch (err) {
    console.error('Error adding custom trip:', err);
  }
}
