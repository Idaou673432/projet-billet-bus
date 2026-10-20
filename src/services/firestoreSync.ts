import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  updateDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Booking, Trip, BusCompany, BrandConfig } from '../types';
import { INITIAL_BOOKINGS, INITIAL_TRIPS, BUS_COMPANIES } from '../data/mockData';
import { DEFAULT_BRAND_CONFIG } from '../utils/storage';

// Collection references
const BOOKINGS_COL = 'bookings';
const TRIPS_COL = 'trips';
const COMPANIES_COL = 'companies';
const SETTINGS_COL = 'settings';

// 1. Initialize Firestore collections with seeds if empty
export async function initializeFirestoreDatabase() {
  try {
    // Check if bookings exists
    const bookingsSnap = await getDocs(collection(db, BOOKINGS_COL));
    if (bookingsSnap.empty) {
      for (const booking of INITIAL_BOOKINGS) {
        await setDoc(doc(db, BOOKINGS_COL, booking.id), booking);
      }
    }

    // Check if trips exists
    const tripsSnap = await getDocs(collection(db, TRIPS_COL));
    if (tripsSnap.empty) {
      for (const trip of INITIAL_TRIPS) {
        await setDoc(doc(db, TRIPS_COL, trip.id), trip);
      }
    }

    // Check if companies exists
    const companiesSnap = await getDocs(collection(db, COMPANIES_COL));
    if (companiesSnap.empty) {
      for (const company of BUS_COMPANIES) {
        await setDoc(doc(db, COMPANIES_COL, company.id), company);
      }
    }

    // Check if settings exists
    await setDoc(doc(db, SETTINGS_COL, 'brand'), DEFAULT_BRAND_CONFIG, { merge: true });
  } catch (error) {
    console.warn('Initial seeding note (will use existing or local fallback):', error);
  }
}

// 2. Real-time Bookings Listener (All machines get instant booking updates)
export function subscribeToBookings(onUpdate: (bookings: Booking[]) => void) {
  const path = BOOKINGS_COL;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate(INITIAL_BOOKINGS);
        return;
      }
      const list: Booking[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Booking);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
      onUpdate(list);
    },
    (error) => {
      console.warn('Snapshot bookings fallback:', error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// 3. Real-time Trips Listener (Seat count & new routes sync across all devices)
export function subscribeToTrips(onUpdate: (trips: Trip[]) => void) {
  const path = TRIPS_COL;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate(INITIAL_TRIPS);
        return;
      }
      const list: Trip[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Trip);
      });
      onUpdate(list);
    },
    (error) => {
      console.warn('Snapshot trips fallback:', error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// 4. Real-time Companies & Logos Listener (Logos update live on all screens)
export function subscribeToCompanies(onUpdate: (companies: BusCompany[]) => void) {
  const path = COMPANIES_COL;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate(BUS_COMPANIES);
        return;
      }
      const list: BusCompany[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as BusCompany);
      });
      onUpdate(list);
    },
    (error) => {
      console.warn('Snapshot companies fallback:', error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// 5. Real-time Brand Settings Listener
export function subscribeToBrandConfig(onUpdate: (config: BrandConfig) => void) {
  const path = `${SETTINGS_COL}/brand`;
  return onSnapshot(
    doc(db, SETTINGS_COL, 'brand'),
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as BrandConfig);
      } else {
        onUpdate(DEFAULT_BRAND_CONFIG);
      }
    },
    (error) => {
      console.warn('Snapshot brand settings fallback:', error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// 6. Write operations synchronized across all machines

// Save or broadcast a new booking
export async function saveBookingToCloud(booking: Booking): Promise<void> {
  const path = `${BOOKINGS_COL}/${booking.id}`;
  try {
    await setDoc(doc(db, BOOKINGS_COL, booking.id), booking);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Update boarding status (Conductor QR Scanner)
export async function updateBoardingStatusInCloud(
  bookingId: string,
  status: 'boarded' | 'not_boarded',
  agentName: string = 'Agent Contrôle'
): Promise<void> {
  const path = `${BOOKINGS_COL}/${bookingId}`;
  try {
    await updateDoc(doc(db, BOOKINGS_COL, bookingId), {
      boardingStatus: status,
      boardedAt: status === 'boarded' ? new Date().toISOString() : null,
      boardedByAgent: status === 'boarded' ? agentName : null,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Save or update partner company with custom logo
export async function saveCompanyToCloud(company: BusCompany): Promise<void> {
  const path = `${COMPANIES_COL}/${company.id}`;
  try {
    await setDoc(doc(db, COMPANIES_COL, company.id), company, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Save or update brand settings
export async function saveBrandConfigToCloud(config: BrandConfig): Promise<void> {
  const path = `${SETTINGS_COL}/brand`;
  try {
    await setDoc(doc(db, SETTINGS_COL, 'brand'), config, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Save a newly scheduled trip
export async function saveTripToCloud(trip: Trip): Promise<void> {
  const path = `${TRIPS_COL}/${trip.id}`;
  try {
    await setDoc(doc(db, TRIPS_COL, trip.id), trip);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
