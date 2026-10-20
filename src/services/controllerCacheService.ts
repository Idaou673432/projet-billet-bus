import { Booking } from '../types';
import { getStoredBookings, updateBoardingStatus } from '../utils/storage';
import { updateBoardingStatusInCloud } from './firestoreSync';

const CACHE_KEY = 'afriway_controller_offline_cache_v1';
const QUEUE_KEY = 'afriway_controller_offline_queue_v1';
const META_KEY = 'afriway_controller_offline_meta_v1';

export interface OfflineQueueItem {
  id: string;
  bookingId: string;
  pnr: string;
  status: 'boarded' | 'not_boarded';
  agentLabel: string;
  timestamp: string;
  attempts: number;
}

export interface ControllerCacheMetadata {
  lastUpdated: string | null;
  ticketCount: number;
  pendingSyncCount: number;
}

/**
 * Save and refresh offline local cache with all currently known bookings.
 * Preserves any offline boarding validations that haven't synced yet.
 */
export function saveBookingsToControllerCache(liveBookings: Booking[]): void {
  if (typeof window === 'undefined') return;

  try {
    // Check if there are pending offline boardings in queue
    const queue = getPendingOfflineQueue();
    const queuedBoardedPnrs = new Set(
      queue.filter((q) => q.status === 'boarded').map((q) => q.pnr.toUpperCase())
    );

    // Merge live bookings with locally boarded tickets
    const merged = liveBookings.map((b) => {
      if (queuedBoardedPnrs.has(b.pnr.toUpperCase())) {
        const queuedItem = queue.find((q) => q.pnr.toUpperCase() === b.pnr.toUpperCase());
        return {
          ...b,
          boardingStatus: 'boarded' as const,
          boardedAt: queuedItem?.timestamp || new Date().toISOString(),
          boardedByAgent: queuedItem?.agentLabel || 'Contrôleur Hors-Ligne',
        };
      }
      return b;
    });

    localStorage.setItem(CACHE_KEY, JSON.stringify(merged));

    const meta: ControllerCacheMetadata = {
      lastUpdated: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      ticketCount: merged.length,
      pendingSyncCount: queue.length,
    };
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch (err) {
    console.error('Failed to save controller offline cache:', err);
  }
}

/**
 * Retrieve cached bookings from local storage.
 * Falls back to localStorage bookings or default list.
 */
export function getCachedBookingsForController(): Booking[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading controller cache:', err);
  }

  // Fallback to standard local storage bookings
  const fallback = getStoredBookings();
  saveBookingsToControllerCache(fallback);
  return fallback;
}

/**
 * Look up a booking from the local controller cache by PNR.
 */
export function findBookingInControllerCache(pnrQuery: string): Booking | null {
  const list = getCachedBookingsForController();
  const clean = pnrQuery.trim().toUpperCase();
  const cleanNoDash = clean.replace(/-/g, '');

  const match = list.find((b) => {
    const pnrUpper = b.pnr.toUpperCase();
    return pnrUpper === clean || pnrUpper.replace(/-/g, '') === cleanNoDash;
  });

  return match || null;
}

/**
 * Update boarding status in local cache and add to offline sync queue.
 */
export function updateBoardingInControllerCache(
  pnr: string,
  status: 'boarded' | 'not_boarded',
  agentLabel: string,
  forceOffline = false
): { updatedBooking: Booking | null; queuedOffline: boolean } {
  const currentList = getCachedBookingsForController();
  const clean = pnr.trim().toUpperCase();
  const idx = currentList.findIndex((b) => b.pnr.toUpperCase() === clean);

  if (idx === -1) {
    // If not found in cache list, also check general storage
    const fallbackUpdate = updateBoardingStatus(pnr, status, agentLabel);
    const shouldQueue = !navigator.onLine || forceOffline;
    if (fallbackUpdate && shouldQueue) {
      enqueueOfflineBoarding(fallbackUpdate.id, pnr, status, agentLabel, new Date().toISOString());
    }
    return { updatedBooking: fallbackUpdate, queuedOffline: shouldQueue };
  }

  const timestamp = new Date().toISOString();
  const updatedBooking: Booking = {
    ...currentList[idx],
    boardingStatus: status,
    boardedAt: status === 'boarded' ? timestamp : undefined,
    boardedByAgent: status === 'boarded' ? agentLabel : undefined,
  };

  currentList[idx] = updatedBooking;

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(currentList));
    // Also keep main storage in sync
    updateBoardingStatus(pnr, status, agentLabel);
  } catch (e) {
    console.error('Error writing to controller cache:', e);
  }

  // Queue for cloud sync
  let queuedOffline = false;
  if (!navigator.onLine || forceOffline) {
    enqueueOfflineBoarding(updatedBooking.id, pnr, status, agentLabel, timestamp);
    queuedOffline = true;
  }

  return { updatedBooking, queuedOffline };
}

/**
 * Enqueue an offline boarding event to be synchronized once internet returns.
 */
export function enqueueOfflineBoarding(
  bookingId: string,
  pnr: string,
  status: 'boarded' | 'not_boarded',
  agentLabel: string,
  timestamp: string
): void {
  try {
    const queue = getPendingOfflineQueue();
    // Remove duplicate entry for same PNR if exists
    const filtered = queue.filter((q) => q.pnr.toUpperCase() !== pnr.toUpperCase());
    filtered.push({
      id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      bookingId,
      pnr,
      status,
      agentLabel,
      timestamp,
      attempts: 0,
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));

    // Update metadata
    updateCacheMetadataCount();
  } catch (err) {
    console.error('Error enqueuing offline boarding action:', err);
  }
}

/**
 * Get the current queue of pending offline boarding actions.
 */
export function getPendingOfflineQueue(): OfflineQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Synchronize all pending offline boarding events to Firebase Cloud.
 */
export async function syncPendingOfflineQueue(): Promise<{ synced: number; failed: number }> {
  const queue = getPendingOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remaining: OfflineQueueItem[] = [];

  for (const item of queue) {
    try {
      await updateBoardingStatusInCloud(item.bookingId, item.status, item.agentLabel);
      synced++;
    } catch (err) {
      console.warn(`Failed to sync queued item for PNR ${item.pnr}:`, err);
      failed++;
      remaining.push({ ...item, attempts: item.attempts + 1 });
    }
  }

  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    updateCacheMetadataCount();
  } catch (e) {
    console.error('Error saving updated queue:', e);
  }

  return { synced, failed };
}

/**
 * Helper to update metadata cache count
 */
function updateCacheMetadataCount() {
  try {
    const queue = getPendingOfflineQueue();
    const cache = getCachedBookingsForController();
    const meta: ControllerCacheMetadata = {
      lastUpdated: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      ticketCount: cache.length,
      pendingSyncCount: queue.length,
    };
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {}
}

/**
 * Get current metadata
 */
export function getControllerCacheMetadata(): ControllerCacheMetadata {
  if (typeof window === 'undefined') {
    return { lastUpdated: null, ticketCount: 0, pendingSyncCount: 0 };
  }
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  const cache = getCachedBookingsForController();
  const queue = getPendingOfflineQueue();
  return {
    lastUpdated: 'Actif',
    ticketCount: cache.length,
    pendingSyncCount: queue.length,
  };
}

/**
 * Clear the offline sync queue
 */
export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(QUEUE_KEY);
    updateCacheMetadataCount();
  } catch {}
}

/**
 * Clear the controller cache and re-initialize from storage
 */
export function clearControllerCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(QUEUE_KEY);
    localStorage.removeItem(META_KEY);
    const fresh = getStoredBookings();
    saveBookingsToControllerCache(fresh);
  } catch {}
}
