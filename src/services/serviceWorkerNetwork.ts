/**
 * Service Worker & Network Connectivity Monitor
 * Real-time monitoring of online/offline status, Service Worker controller state,
 * PWA cache readiness, and live network latency for terminal controllers.
 */

export interface ServiceWorkerNetworkStatus {
  isOnline: boolean;
  effectiveMode: 'cloud_online' | 'sw_offline' | 'forced_offline';
  swSupported: boolean;
  swRegistered: boolean;
  swControlled: boolean;
  swState: 'activated' | 'installing' | 'waiting' | 'redundant' | 'unregistered' | 'unsupported';
  cacheStorageReady: boolean;
  lastChecked: string;
  latencyMs: number | null;
  connectionType: string;
  isProbing: boolean;
}

type NetworkStatusListener = (status: ServiceWorkerNetworkStatus) => void;

let currentStatus: ServiceWorkerNetworkStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  effectiveMode: 'cloud_online',
  swSupported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
  swRegistered: false,
  swControlled: typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller,
  swState: 'unregistered',
  cacheStorageReady: typeof window !== 'undefined' && 'caches' in window,
  lastChecked: new Date().toLocaleTimeString('fr-FR'),
  latencyMs: null,
  connectionType: 'unknown',
  isProbing: false,
};

const listeners = new Set<NetworkStatusListener>();
let probeIntervalId: any = null;

function notifyListeners() {
  const snapshot = { ...currentStatus };
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch (e) {
      console.warn('Network listener error:', e);
    }
  });
}

/**
 * Inspect Service Worker registration and controller status
 */
async function inspectServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    currentStatus.swSupported = false;
    currentStatus.swState = 'unsupported';
    notifyListeners();
    return;
  }

  currentStatus.swSupported = true;
  currentStatus.swControlled = !!navigator.serviceWorker.controller;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      currentStatus.swRegistered = true;
      if (registration.active) {
        currentStatus.swState = 'activated';
      } else if (registration.installing) {
        currentStatus.swState = 'installing';
      } else if (registration.waiting) {
        currentStatus.swState = 'waiting';
      }
    } else {
      currentStatus.swRegistered = false;
      currentStatus.swState = 'unregistered';
    }

    if (typeof window !== 'undefined' && 'caches' in window) {
      const keys = await caches.keys();
      currentStatus.cacheStorageReady = keys.length > 0;
    }
  } catch (err) {
    console.warn('Error inspecting Service Worker:', err);
  }

  notifyListeners();
}

/**
 * Measure live network reachability and latency via fast probe
 */
export async function probeNetworkConnectivity(): Promise<{ isOnline: boolean; latencyMs: number | null }> {
  currentStatus.isProbing = true;
  notifyListeners();

  const start = performance.now();
  let online = false;
  let latency: number | null = null;

  // 1. Basic navigator online check
  const navOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (!navOnline) {
    online = false;
    latency = null;
  } else {
    // 2. Active network probe to verify genuine internet access
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // Probe a lightweight, reliable endpoint with cache busting
      const response = await fetch(`/favicon.ico?probe=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (response.ok || response.status === 304 || response.type === 'opaque') {
        online = true;
        latency = Math.round(performance.now() - start);
      } else {
        online = false;
      }
    } catch (err: any) {
      // Aborted or network error: offline
      online = false;
    }
  }

  // Detect connection type if Network Information API is available
  let connType = 'inconnue';
  if (typeof navigator !== 'undefined' && (navigator as any).connection) {
    const conn = (navigator as any).connection;
    connType = conn.effectiveType || conn.type || 'cellulaire/wifi';
  } else {
    connType = online ? 'en ligne' : 'hors-ligne';
  }

  currentStatus = {
    ...currentStatus,
    isOnline: online,
    effectiveMode: online ? 'cloud_online' : 'sw_offline',
    latencyMs: latency,
    connectionType: connType,
    lastChecked: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    isProbing: false,
  };

  notifyListeners();
  return { isOnline: online, latencyMs: latency };
}

/**
 * Initialize listeners for Service Worker and Network events
 */
export function initServiceWorkerNetworkMonitor(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => {
    probeNetworkConnectivity();
  };

  const handleOffline = () => {
    currentStatus = {
      ...currentStatus,
      isOnline: false,
      effectiveMode: 'sw_offline',
      latencyMs: null,
      lastChecked: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    notifyListeners();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Service Worker Controller Change (e.g. SW activated or updated)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      currentStatus.swControlled = !!navigator.serviceWorker.controller;
      inspectServiceWorker();
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_NETWORK_UPDATE') {
        currentStatus.isOnline = event.data.online;
        currentStatus.effectiveMode = event.data.online ? 'cloud_online' : 'sw_offline';
        notifyListeners();
      }
    });

    // Check service worker when ready
    navigator.serviceWorker.ready.then((reg) => {
      currentStatus.swRegistered = true;
      currentStatus.swState = reg.active ? 'activated' : 'waiting';
      currentStatus.swControlled = !!navigator.serviceWorker.controller;
      notifyListeners();
    }).catch(() => {});
  }

  // Initial inspection and probing
  inspectServiceWorker();
  probeNetworkConnectivity();

  // Periodic probe every 20 seconds for continuous live awareness
  probeIntervalId = setInterval(() => {
    probeNetworkConnectivity();
  }, 20000);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (probeIntervalId) {
      clearInterval(probeIntervalId);
      probeIntervalId = null;
    }
  };
}

/**
 * Subscribe to real-time Service Worker & Network status updates
 */
export function subscribeToServiceWorkerNetwork(listener: NetworkStatusListener): () => void {
  listeners.add(listener);
  listener({ ...currentStatus });

  return () => {
    listeners.delete(listener);
  };
}

/**
 * Get instantaneous snapshot of connectivity status
 */
export function getServiceWorkerNetworkSnapshot(): ServiceWorkerNetworkStatus {
  return { ...currentStatus };
}
