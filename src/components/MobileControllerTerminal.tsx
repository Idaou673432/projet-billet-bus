import React, { useState, useEffect, useRef } from 'react';
import { Booking, Trip, UserAccount, ScanLogRecord } from '../types';
import { findBookingByPNR, updateBoardingStatus, getStoredBookings } from '../utils/storage';
import { updateBoardingStatusInCloud, subscribeToBookings } from '../services/firestoreSync';
import { 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Camera, 
  CameraOff,
  Search, 
  UserCheck, 
  Clock, 
  MapPin, 
  Armchair,
  Volume2,
  VolumeX,
  LogOut,
  ShieldCheck,
  Zap,
  Users,
  Bus,
  RotateCcw,
  Sparkles,
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  CloudOff,
  CloudCheck,
  Copy,
  Check,
  FileText,
  Share2,
  Trash2,
  ListOrdered,
  History,
  Filter,
  ArrowUpRight,
  Moon,
  Sun,
  Flashlight,
  Lightbulb,
  SlidersHorizontal,
  X
} from 'lucide-react';
import {
  saveBookingsToControllerCache,
  getCachedBookingsForController,
  findBookingInControllerCache,
  updateBoardingInControllerCache,
  syncPendingOfflineQueue,
  getControllerCacheMetadata,
  getPendingOfflineQueue,
  clearOfflineQueue,
  clearControllerCache,
  ControllerCacheMetadata,
  OfflineQueueItem
} from '../services/controllerCacheService';

const SCAN_HISTORY_KEY = 'afriway_controller_scan_history_v1';

const DEFAULT_INITIAL_SCANS: ScanLogRecord[] = [
  {
    id: 'scan_init_1',
    pnr: 'AFW-84920',
    scannedAt: '08:45:12',
    scannedDate: new Date().toLocaleDateString('fr-FR'),
    passengerName: 'Amadou Diallo',
    tripSummary: 'Bamako ➔ Sikasso',
    seatNumber: '12',
    status: 'valid',
    agentName: 'Contrôleur Quai',
    companyName: 'Nour Transport',
    syncMode: 'cloud'
  },
  {
    id: 'scan_init_2',
    pnr: 'AFW-84920',
    scannedAt: '08:48:30',
    scannedDate: new Date().toLocaleDateString('fr-FR'),
    passengerName: 'Amadou Diallo',
    tripSummary: 'Bamako ➔ Sikasso',
    seatNumber: '12',
    status: 'already_boarded',
    agentName: 'Contrôleur Quai',
    companyName: 'Nour Transport',
    syncMode: 'cloud'
  },
  {
    id: 'scan_init_3',
    pnr: 'AFW-99214',
    scannedAt: '08:52:04',
    scannedDate: new Date().toLocaleDateString('fr-FR'),
    passengerName: 'Fatoumata Traoré',
    tripSummary: 'Bamako ➔ Ségou',
    seatNumber: '05',
    status: 'valid',
    agentName: 'Contrôleur Quai',
    companyName: 'Bani Transport',
    syncMode: 'cloud'
  },
  {
    id: 'scan_init_4',
    pnr: 'ERR-00042',
    scannedAt: '09:02:18',
    scannedDate: new Date().toLocaleDateString('fr-FR'),
    passengerName: 'Billet Introuvable',
    tripSummary: 'Gare Sogoniko',
    seatNumber: '-',
    status: 'invalid',
    agentName: 'Contrôleur Quai',
    companyName: 'Inconnue',
    syncMode: 'offline_cache'
  }
];

function getStoredScanHistory(): ScanLogRecord[] {
  if (typeof window === 'undefined') return DEFAULT_INITIAL_SCANS;
  try {
    const raw = localStorage.getItem(SCAN_HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 20);
    }
  } catch {}
  return DEFAULT_INITIAL_SCANS;
}

function saveStoredScanHistory(logs: ScanLogRecord[]): void {
  try {
    localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(logs.slice(0, 20)));
  } catch {}
}

interface MobileControllerTerminalProps {
  currentUser: UserAccount;
  onSignOut: () => void;
  trips: Trip[];
}

export const MobileControllerTerminal: React.FC<MobileControllerTerminalProps> = ({
  currentUser,
  onSignOut,
  trips,
}) => {
  const [pnrInput, setPnrInput] = useState<string>('');
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'valid' | 'already_boarded' | 'not_found'>('idle');
  const [isScanningCamera, setIsScanningCamera] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedTripFilter, setSelectedTripFilter] = useState<string>('all');
  const [scanHistory, setScanHistory] = useState<ScanLogRecord[]>(getStoredScanHistory);
  const [terminalTab, setTerminalTab] = useState<'scan' | 'history'>('scan');
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'valid' | 'already_boarded' | 'invalid'>('all');
  const [copiedPnr, setCopiedPnr] = useState<string | null>(null);
  const [reportExported, setReportExported] = useState<boolean>(false);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [lastScannedPnr, setLastScannedPnr] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [cacheMeta, setCacheMeta] = useState<ControllerCacheMetadata>(getControllerCacheMetadata);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [wasBoardedOffline, setWasBoardedOffline] = useState<boolean>(false);

  // Theme mode ('auto' | 'dark' | 'light')
  const [themeMode, setThemeMode] = useState<'auto' | 'dark' | 'light'>(() => {
    try {
      const stored = localStorage.getItem('afriway_controller_theme_v1');
      if (stored === 'dark' || stored === 'light' || stored === 'auto') return stored;
    } catch {}
    return 'auto';
  });

  // Forced offline mode state for quays and basements
  const [forcedOffline, setForcedOffline] = useState<boolean>(() => {
    try {
      return localStorage.getItem('afriway_controller_forced_offline_v1') === 'true';
    } catch {
      return false;
    }
  });

  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState<boolean>(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [pendingQueue, setPendingQueue] = useState<OfflineQueueItem[]>(getPendingOfflineQueue);
  const [isNightTimeNow, setIsNightTimeNow] = useState<boolean>(() => {
    const hour = new Date().getHours();
    return hour >= 18 || hour < 7;
  });

  // Check night time every minute for automatic dark mode
  useEffect(() => {
    const checkNight = () => {
      const hour = new Date().getHours();
      setIsNightTimeNow(hour >= 18 || hour < 7);
    };
    const timer = setInterval(checkNight, 60000);
    return () => clearInterval(timer);
  }, []);

  // Compute effective active theme (auto mode uses nocturnal station hours 18h-07h)
  const effectiveTheme: 'dark' | 'light' = themeMode === 'auto'
    ? (isNightTimeNow ? 'dark' : 'light')
    : themeMode;

  const effectiveIsOnline = isOnline && !forcedOffline;

  const handleSetTheme = (mode: 'auto' | 'dark' | 'light') => {
    setThemeMode(mode);
    setIsThemeMenuOpen(false);
    try {
      localStorage.setItem('afriway_controller_theme_v1', mode);
    } catch {}
  };

  const handleToggleForcedOffline = () => {
    const nextVal = !forcedOffline;
    setForcedOffline(nextVal);
    try {
      localStorage.setItem('afriway_controller_forced_offline_v1', String(nextVal));
    } catch {}
    if (nextVal) {
      setSyncNotice('⚡ Mode Hors-Ligne forcé : contrôle 100% autonome sur cache local.');
    } else {
      setSyncNotice('Mode En Ligne réactivé.');
      handleManualSync();
    }
    setTimeout(() => setSyncNotice(null), 3500);
  };

  const handleClearOfflineQueue = () => {
    if (window.confirm("Voulez-vous vider la file d'attente des validations hors-ligne ?")) {
      clearOfflineQueue();
      setPendingQueue([]);
      setCacheMeta(getControllerCacheMetadata());
      setSyncNotice("File d'attente réinitialisée.");
      setTimeout(() => setSyncNotice(null), 2500);
    }
  };

  const handleRefreshCacheData = () => {
    saveBookingsToControllerCache(recentBookings);
    setCacheMeta(getControllerCacheMetadata());
    setPendingQueue(getPendingOfflineQueue());
    setSyncNotice(`Cache local rafraîchi (${getControllerCacheMetadata().ticketCount} billets).`);
    setTimeout(() => setSyncNotice(null), 2500);
  };

  // Toggle physical camera torch or high-luminance screen illumination
  const toggleTorch = async () => {
    const nextState = !isTorchOn;
    setIsTorchOn(nextState);

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      if (track) {
        try {
          const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
          if (capabilities.torch) {
            await (track as any).applyConstraints({
              advanced: [{ torch: nextState }],
            });
          }
        } catch (err) {
          console.warn('Hardware torch error fallback:', err);
        }
      }
    }
  };

  // Helper to record any scan attempt to the 20-items rolling history
  const recordScanToHistory = (entry: Omit<ScanLogRecord, 'id' | 'scannedAt' | 'scannedDate'>) => {
    const now = new Date();
    const newLog: ScanLogRecord = {
      ...entry,
      id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      scannedAt: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      scannedDate: now.toLocaleDateString('fr-FR'),
    };

    setScanHistory((prev) => {
      // Keep strictly the latest 20 items
      const updated = [newLog, ...prev].slice(0, 20);
      saveStoredScanHistory(updated);
      return updated;
    });
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // 1. Online / Offline network listeners & auto-sync queue processing
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setSyncNotice('Réseau détecté. Synchronisation du cache...');
      setIsSyncing(true);
      const res = await syncPendingOfflineQueue();
      setIsSyncing(false);
      setCacheMeta(getControllerCacheMetadata());
      setPendingQueue(getPendingOfflineQueue());
      if (res.synced > 0) {
        setSyncNotice(`✅ ${res.synced} validation(s) synchronisée(s) vers le Cloud !`);
        setTimeout(() => setSyncNotice(null), 3500);
      } else {
        setTimeout(() => setSyncNotice(null), 1500);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setCacheMeta(getControllerCacheMetadata());
      setPendingQueue(getPendingOfflineQueue());
      setSyncNotice('⚡ Mode Hors-Ligne activé : validation sur cache local.');
      setTimeout(() => setSyncNotice(null), 4000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Initialize from local cache first (instant 0ms startup), then subscribe to Firestore
  useEffect(() => {
    const cached = getCachedBookingsForController();
    setRecentBookings(cached);
    setCacheMeta(getControllerCacheMetadata());
    setPendingQueue(getPendingOfflineQueue());

    const unsubscribe = subscribeToBookings((live) => {
      setRecentBookings(live);
      // Automatically keep offline cache fresh whenever cloud updates arrive
      saveBookingsToControllerCache(live);
      setCacheMeta(getControllerCacheMetadata());
      setPendingQueue(getPendingOfflineQueue());
    });

    return () => unsubscribe();
  }, []);

  // 3. Manual cache sync & refresh handler
  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncNotice('Synchronisation du cache...');
    try {
      const res = await syncPendingOfflineQueue();
      saveBookingsToControllerCache(recentBookings);
      setCacheMeta(getControllerCacheMetadata());
      setPendingQueue(getPendingOfflineQueue());
      if (res.synced > 0) {
        setSyncNotice(`✅ ${res.synced} billet(s) synchronisé(s) !`);
      } else {
        setSyncNotice(`Cache local vérifié (${getControllerCacheMetadata().ticketCount} billets).`);
      }
      setTimeout(() => setSyncNotice(null), 3000);
    } catch {
      setSyncNotice('Synchronisation reportée (hors-ligne).');
      setTimeout(() => setSyncNotice(null), 2500);
    } finally {
      setIsSyncing(false);
    }
  };

  // Web Audio Chime generator for instant mobile audio feedback
  const playAudioBeep = (type: 'success' | 'warning' | 'error') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        // High melodic double chime (Valid ticket)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'warning') {
        // Low double alert tone (Already boarded)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.setValueAtTime(200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else {
        // Low harsh buzz (Invalid/not found)
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  // Inspect ticket by PNR with Offline Cache Fallback
  const handleInspect = (pnrToInspect: string) => {
    let cleanPnr = pnrToInspect.trim().toUpperCase();
    if (!cleanPnr) return;

    // Detect if input is raw JSON from AFRIWAY QR Code
    if (cleanPnr.startsWith('{') && cleanPnr.includes('PNR')) {
      try {
        const parsed = JSON.parse(pnrToInspect);
        if (parsed.pnr) cleanPnr = parsed.pnr.trim().toUpperCase();
      } catch {}
    }

    setLastScannedPnr(cleanPnr);

    // 1. Check in-memory bookings
    let booking = recentBookings.find(
      (b) => b.pnr.toUpperCase() === cleanPnr || b.pnr.replace(/-/g, '').toUpperCase() === cleanPnr.replace(/-/g, '')
    );

    // 2. Resilient check in offline persistent cache
    if (!booking) {
      booking = findBookingInControllerCache(cleanPnr) || undefined;
    }

    // 3. Fallback to standard storage
    if (!booking) {
      booking = findBookingByPNR(cleanPnr);
    }

    if (!booking) {
      setActiveBooking(null);
      setScanStatus('not_found');
      playAudioBeep('error');
      recordScanToHistory({
        pnr: cleanPnr,
        passengerName: 'Billet Introuvable / Erroné',
        tripSummary: 'Gare / Quai',
        seatNumber: '-',
        status: 'invalid',
        agentName: currentUser.displayName,
        companyName: 'Inconnue',
        syncMode: isOnline ? 'cloud' : 'offline_cache',
      });
      return;
    }

    setActiveBooking(booking);
    if (booking.boardingStatus === 'boarded') {
      setScanStatus('already_boarded');
      playAudioBeep('warning');
      recordScanToHistory({
        pnr: booking.pnr,
        passengerName: `${booking.passengers[0]?.firstName} ${booking.passengers[0]?.lastName}`,
        tripSummary: `${booking.trip.originCity} ➔ ${booking.trip.destinationCity}`,
        seatNumber: booking.passengers.map(p => p.seatNumber).join(', '),
        status: 'already_boarded',
        agentName: currentUser.displayName,
        companyName: booking.trip.companyName,
        syncMode: isOnline ? 'cloud' : 'offline_cache',
      });
    } else {
      setScanStatus('valid');
      playAudioBeep('success');
      recordScanToHistory({
        pnr: booking.pnr,
        passengerName: `${booking.passengers[0]?.firstName} ${booking.passengers[0]?.lastName}`,
        tripSummary: `${booking.trip.originCity} ➔ ${booking.trip.destinationCity}`,
        seatNumber: booking.passengers.map(p => p.seatNumber).join(', '),
        status: 'valid',
        agentName: currentUser.displayName,
        companyName: booking.trip.companyName,
        syncMode: isOnline ? 'cloud' : 'offline_cache',
      });
    }
  };

  // Confirm Boarding Action (Offline-Resilient with Auto-Sync Queue)
  const handleConfirmBoarding = () => {
    if (!activeBooking) return;
    const agentLabel = `${currentUser.displayName} (${currentUser.assignedStation || 'Contrôleur Quai'})`;
    
    // 1. Update local cache immediately (works 100% offline)
    const { updatedBooking, queuedOffline } = updateBoardingInControllerCache(
      activeBooking.pnr,
      'boarded',
      agentLabel,
      forcedOffline
    );

    setWasBoardedOffline(queuedOffline);
    setPendingQueue(getPendingOfflineQueue());

    // 2. If online and not forced offline, also send to Firebase Cloud
    if (effectiveIsOnline && navigator.onLine) {
      updateBoardingStatusInCloud(activeBooking.id, 'boarded', agentLabel).catch((err) => {
        console.warn('Cloud update fallback to offline queue:', err);
      });
    }

    playAudioBeep('success');

    // 3. Record confirmed boarding into the 20-items rolling history
    recordScanToHistory({
      pnr: activeBooking.pnr,
      passengerName: `${activeBooking.passengers[0]?.firstName} ${activeBooking.passengers[0]?.lastName}`,
      tripSummary: `${activeBooking.trip.originCity} ➔ ${activeBooking.trip.destinationCity}`,
      seatNumber: activeBooking.passengers.map(p => p.seatNumber).join(', '),
      status: 'valid',
      agentName: currentUser.displayName,
      companyName: activeBooking.trip.companyName,
      syncMode: queuedOffline || !effectiveIsOnline ? 'offline_cache' : 'cloud',
    });

    if (updatedBooking) {
      setActiveBooking(updatedBooking);
      setScanStatus('already_boarded');
      setRecentBookings(getCachedBookingsForController());
      setCacheMeta(getControllerCacheMetadata());
      setPendingQueue(getPendingOfflineQueue());
    }
  };

  // Reset status (for testing or supervisor override)
  const handleResetBoarding = () => {
    if (!activeBooking) return;
    const updated = updateBoardingStatus(activeBooking.pnr, 'not_boarded');
    updateBoardingStatusInCloud(activeBooking.id, 'not_boarded', currentUser.displayName).catch((err) =>
      console.warn('Cloud reset fallback:', err)
    );

    if (updated) {
      setActiveBooking(updated);
      setScanStatus('valid');
      setRecentBookings(getStoredBookings());
    }
  };

  // Camera toggle with real video stream
  const toggleCamera = async () => {
    if (isScanningCamera) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      setIsScanningCamera(false);
    } else {
      setIsScanningCamera(true);
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        }
      } catch (err) {
        console.warn('Camera preview not available or permission denied:', err);
      }
    }
  };

  // Clean camera tracks on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Filtered manifest calculations
  const filteredBookings = selectedTripFilter === 'all'
    ? recentBookings
    : recentBookings.filter(b => b.tripId === selectedTripFilter);

  const boardedCount = filteredBookings.filter(b => b.boardingStatus === 'boarded').length;
  const totalPassengers = filteredBookings.reduce((sum, b) => sum + b.passengers.length, 0);

  // History calculations (20 most recent scans)
  const validHistoryCount = scanHistory.filter((h) => h.status === 'valid').length;
  const fraudHistoryCount = scanHistory.filter((h) => h.status === 'already_boarded').length;
  const invalidHistoryCount = scanHistory.filter((h) => h.status === 'invalid').length;

  const filteredHistory = scanHistory.filter((item) => {
    if (historyFilter !== 'all' && item.status !== historyFilter) return false;
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      const matchPnr = item.pnr.toLowerCase().includes(q);
      const matchName = item.passengerName.toLowerCase().includes(q);
      const matchTrip = item.tripSummary.toLowerCase().includes(q);
      return matchPnr || matchName || matchTrip;
    }
    return true;
  });

  const handleExportHistoryReport = () => {
    const lines = [
      `📋 RAPPORT DE QUART DE CONTRÔLE - AFRIWAY`,
      `Agent : ${currentUser.displayName} (${currentUser.assignedStation || 'Gare Sogoniko'})`,
      `Date : ${new Date().toLocaleDateString('fr-FR')} - Heure : ${new Date().toLocaleTimeString('fr-FR')}`,
      `Total scans récents : ${scanHistory.length} (Max 20)`,
      `✅ Billets Valides & Embarqués : ${validHistoryCount}`,
      `🚨 Alertes Fraude (Déjà scannés) : ${fraudHistoryCount}`,
      `❌ Billets Invalides / Erreurs : ${invalidHistoryCount}`,
      `---------------------------------------`,
      ...scanHistory.map((s, i) =>
        `${i + 1}. [${s.scannedAt} - ${s.scannedDate || ''}] PNR: ${s.pnr} | Passager: ${s.passengerName} | Siège: ${s.seatNumber} | Statut: ${
          s.status === 'valid'
            ? 'VALIDE & EMBARQUÉ'
            : s.status === 'already_boarded'
            ? 'DÉJÀ SCANNÉ (FRAUDE)'
            : 'BILLET INVALIDE'
        } (${s.tripSummary})`
      ),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setReportExported(true);
    setTimeout(() => setReportExported(false), 3000);
  };

  const handleCopyHistoryPnr = (pnr: string) => {
    navigator.clipboard.writeText(pnr);
    setCopiedPnr(pnr);
    setTimeout(() => setCopiedPnr(null), 2000);
  };

  const handleReinspectFromHistory = (pnr: string) => {
    setPnrInput(pnr);
    setTerminalTab('scan');
    handleInspect(pnr);
  };

  const handleClearHistory = () => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser l'historique des scans pour démarrer un nouveau quart ?")) {
      setScanHistory([]);
      saveStoredScanHistory([]);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col antialiased transition-colors duration-200 ${
      effectiveTheme === 'dark'
        ? 'bg-slate-950 text-slate-100'
        : 'bg-slate-100 text-slate-900'
    }`}>
      {/* 1. TOP MOBILE CONTROLLER RESTRICTED BAR */}
      <header className={`sticky top-0 z-40 px-3.5 py-2.5 shadow-md flex items-center justify-between border-b transition-colors ${
        effectiveTheme === 'dark'
          ? 'bg-slate-950 border-emerald-900/60'
          : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs">
            <ShieldCheck className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-black tracking-tight uppercase ${effectiveTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                MODE CONTRÔLEUR
              </span>
              <span className={`w-2 h-2 rounded-full ${effectiveIsOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            </div>
            <p className={`text-[11px] font-medium truncate max-w-[170px] ${effectiveTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {currentUser.displayName} · {currentUser.assignedStation || 'Gare Sogoniko'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Network & Offline Center Button */}
          <button
            onClick={() => setIsOfflineModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              effectiveIsOnline
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                : 'bg-amber-950/80 text-amber-300 border-amber-700 hover:bg-amber-900'
            }`}
            title="Ouvrir le Centre Hors-Ligne & Gestion du Cache"
          >
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
            ) : effectiveIsOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="hidden xs:inline">
              {effectiveIsOnline ? 'En Ligne' : 'Hors-Ligne'}
            </span>
            {cacheMeta.pendingSyncCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full animate-bounce">
                {cacheMeta.pendingSyncCount}
              </span>
            )}
          </button>

          {/* Theme Mode Switcher (Auto, Dark, Light) */}
          <div className="relative">
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className={`p-2 rounded-lg transition-colors cursor-pointer border ${
                effectiveTheme === 'dark'
                  ? 'bg-slate-800 border-slate-700 text-amber-300 hover:text-amber-200'
                  : 'bg-slate-100 border-slate-300 text-slate-800 hover:text-slate-950'
              }`}
              title={`Visibilité : ${
                themeMode === 'auto'
                  ? `Automatique (${effectiveTheme === 'dark' ? 'Sombre nuit' : 'Clair jour'})`
                  : themeMode === 'dark'
                  ? 'Mode Sombre Quai'
                  : 'Mode Jour Soleil'
              }`}
            >
              {themeMode === 'auto' ? (
                <div className="relative flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="absolute -bottom-1 -right-1 text-[7px] font-black uppercase tracking-tighter">A</span>
                </div>
              ) : themeMode === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </button>

            {/* Dropdown Menu for Theme */}
            {isThemeMenuOpen && (
              <div className={`absolute right-0 mt-1.5 w-52 rounded-xl shadow-2xl p-1.5 z-50 text-xs border animate-in fade-in zoom-in-95 ${
                effectiveTheme === 'dark'
                  ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-black/80'
                  : 'bg-white border-slate-200 text-slate-900 shadow-xl'
              }`}>
                <div className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border-b mb-1 ${
                  effectiveTheme === 'dark' ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-100'
                }`}>
                  Visibilité de l'écran
                </div>
                <button
                  onClick={() => handleSetTheme('auto')}
                  className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer ${
                    themeMode === 'auto' 
                      ? 'bg-emerald-600/20 text-emerald-400 font-bold border border-emerald-500/30' 
                      : effectiveTheme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <div>
                      <span className="block font-semibold">Automatique</span>
                      <span className="text-[10px] opacity-75">Nuit dès 18h ({isNightTimeNow ? 'Sombre' : 'Clair'})</span>
                    </div>
                  </div>
                  {themeMode === 'auto' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
                <button
                  onClick={() => handleSetTheme('dark')}
                  className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer mt-0.5 ${
                    themeMode === 'dark' 
                      ? 'bg-emerald-600/20 text-emerald-400 font-bold border border-emerald-500/30' 
                      : effectiveTheme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <div>
                      <span className="block font-semibold">Mode Sombre</span>
                      <span className="text-[10px] opacity-75">Nuit & quais obscurs</span>
                    </div>
                  </div>
                  {themeMode === 'dark' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
                <button
                  onClick={() => handleSetTheme('light')}
                  className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer mt-0.5 ${
                    themeMode === 'light' 
                      ? 'bg-emerald-600/20 text-emerald-500 font-bold border border-emerald-500/30' 
                      : effectiveTheme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <div>
                      <span className="block font-semibold">Mode Jour</span>
                      <span className="text-[10px] opacity-75">Plein soleil & extérieur</span>
                    </div>
                  </div>
                  {themeMode === 'light' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
              </div>
            )}
          </div>

          {/* Flashlight / Torche for dark outdoor station platforms */}
          <button
            onClick={toggleTorch}
            className={`p-2 rounded-lg transition-all cursor-pointer border ${
              isTorchOn
                ? 'bg-amber-400 border-amber-300 text-slate-950 font-black shadow-[0_0_15px_rgba(251,191,36,0.7)] animate-pulse'
                : effectiveTheme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900'
            }`}
            title={isTorchOn ? 'Éteindre la torche / flash quai' : 'Allumer la torche / flash quai pour éclairer en zone sombre'}
          >
            <Flashlight className={`w-4 h-4 ${isTorchOn ? 'text-slate-950 fill-amber-300' : ''}`} />
          </button>

          {/* Sound Mute/Unmute */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors cursor-pointer border ${
              effectiveTheme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900'
            }`}
            title={soundEnabled ? 'Désactiver les signaux sonores' : 'Activer les signaux sonores'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Sign Out */}
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800/60 text-rose-200 text-xs font-bold transition-colors cursor-pointer"
            title="Quitter la session de contrôle"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quitter</span>
          </button>
        </div>
      </header>

      {/* Offline Alert & Cache Notification Banner */}
      {(!effectiveIsOnline || syncNotice) && (
        <div className={`px-4 py-2 text-xs flex items-center justify-between border-b transition-all ${
          !effectiveIsOnline 
            ? 'bg-amber-950/90 border-amber-800 text-amber-200' 
            : 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {!effectiveIsOnline ? (
              <Database className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <CloudCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="font-medium text-[11px] leading-tight">
              {syncNotice || (forcedOffline
                ? `Mode Hors-Ligne Forcé : ${cacheMeta.ticketCount} billets en cache local. Opération autonome active.`
                : `Mode Hors-Ligne Détecté : ${cacheMeta.ticketCount} billets en cache local. Vérification 100% opérationnelle.`)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOfflineModalOpen(true)}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-[10px] font-bold cursor-pointer shrink-0"
            >
              Gérer Cache
            </button>
            {effectiveIsOnline && cacheMeta.pendingSyncCount > 0 && (
              <button
                onClick={handleManualSync}
                className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer shrink-0"
              >
                Synchroniser
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. TAB SWITCHER: SCANNER vs HISTORIQUE (20 SCANS) */}
      <div className={`px-4 pt-2.5 border-b flex gap-2 transition-colors ${
        effectiveTheme === 'dark'
          ? 'bg-slate-950 border-slate-800'
          : 'bg-white border-slate-200'
      }`}>
        <button
          onClick={() => setTerminalTab('scan')}
          className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-t-xl flex items-center justify-center gap-2 transition-all cursor-pointer border-t border-x ${
            terminalTab === 'scan'
              ? effectiveTheme === 'dark'
                ? 'bg-slate-800 text-white border-slate-700 shadow-sm'
                : 'bg-slate-100 text-emerald-800 border-slate-300 shadow-xs'
              : effectiveTheme === 'dark'
              ? 'bg-slate-900/40 text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
              : 'bg-slate-50 text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Camera className="w-4 h-4 text-emerald-500" />
          <span>Scanner & Contrôle</span>
        </button>

        <button
          onClick={() => setTerminalTab('history')}
          className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-t-xl flex items-center justify-center gap-2 transition-all cursor-pointer border-t border-x ${
            terminalTab === 'history'
              ? effectiveTheme === 'dark'
                ? 'bg-slate-800 text-white border-slate-700 shadow-sm'
                : 'bg-slate-100 text-amber-800 border-slate-300 shadow-xs'
              : effectiveTheme === 'dark'
              ? 'bg-slate-900/40 text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
              : 'bg-slate-50 text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4 text-amber-500" />
          <span>Historique</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            effectiveTheme === 'dark' ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-700'
          }`}>
            {scanHistory.length}/20
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: SCANNER & CONTRÔLE VIEW */}
      {/* ======================================================== */}
      {terminalTab === 'scan' && (
        <>
          {/* STATS PILLS (BOARDED / WAITING) */}
          <div className={`px-4 py-2 border-b flex items-center justify-between text-xs transition-colors ${
            effectiveTheme === 'dark'
              ? 'bg-slate-950/60 border-slate-800 text-slate-400'
              : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}>
            <div className="flex items-center gap-2">
              <span className={effectiveTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Embarqués :</span>
              <span className={`font-mono font-black px-2 py-0.5 rounded border ${
                effectiveTheme === 'dark'
                  ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-300'
              }`}>
                {boardedCount} / {totalPassengers || recentBookings.length}
              </span>
            </div>

            {/* Bus selector if multiple departures */}
            <div className="flex items-center gap-1">
              <Bus className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedTripFilter}
                onChange={(e) => setSelectedTripFilter(e.target.value)}
                className={`text-[11px] rounded px-2 py-0.5 border outline-none transition-colors ${
                  effectiveTheme === 'dark'
                    ? 'bg-slate-800 text-slate-200 border-slate-700'
                    : 'bg-white text-slate-800 border-slate-300'
                }`}
              >
                <option value="all">Tous les Départs</option>
                {trips.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.companyName} · {t.destinationCity} ({t.departureTime})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MAIN SCANNING INTERFACE */}
          <main className="flex-1 max-w-lg w-full mx-auto p-4 space-y-4">
            
            {/* Phone Camera Scanner Card */}
            <div className={`rounded-2xl border p-4 shadow-xl overflow-hidden transition-colors ${
              effectiveTheme === 'dark'
                ? 'bg-slate-800/90 border-slate-700 text-slate-100 shadow-black/40'
                : 'bg-white border-slate-200 text-slate-900 shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-500" />
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${
                    effectiveTheme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    Scanner Caméra Mobile
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleTorch}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer border ${
                      isTorchOn
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-[0_0_10px_rgba(251,191,36,0.6)] animate-pulse'
                        : effectiveTheme === 'dark'
                        ? 'bg-slate-700 border-slate-600 text-slate-300 hover:text-white'
                        : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900'
                    }`}
                    title={isTorchOn ? 'Éteindre la torche' : 'Allumer la torche (scan nocturne/quai)'}
                  >
                    <Flashlight className={`w-3.5 h-3.5 ${isTorchOn ? 'fill-amber-400' : ''}`} />
                    <span className="hidden xs:inline">{isTorchOn ? 'Torche ON' : 'Torche'}</span>
                  </button>

                  <button
                    onClick={toggleCamera}
                    className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      isScanningCamera 
                        ? 'bg-rose-700 hover:bg-rose-800 text-white shadow-xs' 
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                    }`}
                  >
                    {isScanningCamera ? (
                      <>
                        <CameraOff className="w-3.5 h-3.5" />
                        <span>Arrêter</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-3.5 h-3.5" />
                        <span>Activer Caméra</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Camera Viewfinder */}
              {isScanningCamera ? (
                <div className="relative aspect-4/3 bg-black rounded-xl overflow-hidden border-2 border-emerald-500 shadow-inner">
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover" 
                    playsInline 
                    muted 
                  />
                  {/* Animated Laser Scanning Line */}
                  <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-[bounce_2s_infinite]" />
                  
                  {/* Torch active indicator overlay */}
                  {isTorchOn && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-400/90 text-slate-950 font-black text-[9px] flex items-center gap-1 shadow-md">
                      <Flashlight className="w-2.5 h-2.5" />
                      <span>TORCHE ACTIVE</span>
                    </div>
                  )}

                  {/* Corner targeting brackets */}
                  <div className="absolute inset-6 pointer-events-none border-2 border-dashed border-emerald-400/70 rounded-lg flex items-center justify-center">
                    <span className="text-[10px] bg-black/60 px-2 py-0.5 rounded text-emerald-300 font-mono">
                      Pointez vers le QR Code du billet
                    </span>
                  </div>
                </div>
              ) : (
                <div className={`aspect-16/9 rounded-xl border border-dashed flex flex-col items-center justify-center p-4 text-center transition-colors ${
                  effectiveTheme === 'dark'
                    ? 'bg-slate-900/80 border-slate-700 text-slate-400'
                    : 'bg-slate-50 border-slate-300 text-slate-500'
                }`}>
                  <QrCode className={`w-10 h-10 mb-2 ${effectiveTheme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`} />
                  <p className="text-xs max-w-[240px]">
                    Activez la caméra arrière pour scanner instantanément les e-billets présentés sur smartphone ou papier.
                  </p>
                </div>
              )}

              {/* Quick Demo Scan Buttons for Testing on Phone */}
              <div className={`mt-3 pt-3 border-t ${effectiveTheme === 'dark' ? 'border-slate-700/60' : 'border-slate-200'}`}>
                <span className={`text-[10px] uppercase font-bold block mb-1.5 ${
                  effectiveTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Billets de test rapides (Cliquez pour tester) :
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {recentBookings.slice(0, 3).map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setPnrInput(b.pnr);
                        handleInspect(b.pnr);
                      }}
                      className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded border transition-colors cursor-pointer ${
                        effectiveTheme === 'dark'
                          ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      }`}
                    >
                      {b.pnr} ({b.passengers[0]?.firstName})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Manual PNR Saisie Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleInspect(pnrInput);
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={pnrInput}
                  onChange={(e) => setPnrInput(e.target.value.toUpperCase())}
                  placeholder="Saisir PNR (ex: AFW-84920)"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border font-mono text-sm tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                    effectiveTheme === 'dark'
                      ? 'bg-slate-800 text-white border-slate-700 placeholder-slate-500'
                      : 'bg-white text-slate-900 border-slate-300 placeholder-slate-400 shadow-xs'
                  }`}
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shrink-0"
              >
                <span>Vérifier</span>
              </button>
            </form>

            {/* 4. VERIFICATION RESULT BANNER (GIANT FEEDBACK) */}
            {scanStatus === 'valid' && activeBooking && (
              <div className="bg-emerald-950 border-2 border-emerald-500 rounded-2xl p-5 shadow-2xl animate-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-900/80 px-2 py-0.5 rounded">
                      Billet Authentifié · Prêt à Monter
                    </span>
                    <h4 className="text-xl font-black text-white mt-0.5 truncate">
                      {activeBooking.passengers[0]?.firstName} {activeBooking.passengers[0]?.lastName}
                    </h4>
                  </div>
                </div>

                {/* Travel details summary */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-900/80 p-3 rounded-xl border border-emerald-800/60 font-medium">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Compagnie</span>
                    <span className="font-bold text-white">{activeBooking.trip.companyName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Siège(s)</span>
                    <span className="font-black text-amber-300 font-mono">
                      Place {activeBooking.passengers.map(p => p.seatNumber).join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Trajet</span>
                    <span className="font-bold text-slate-200">
                      {activeBooking.trip.originCity} ➔ {activeBooking.trip.destinationCity}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Départ</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {activeBooking.trip.departureTime} ({activeBooking.trip.departureDate})
                    </span>
                  </div>
                </div>

                {/* Big Action Button to Validate Boarding */}
                <button
                  onClick={handleConfirmBoarding}
                  className="mt-4 w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-sm font-black rounded-xl flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-all uppercase tracking-wider"
                >
                  <UserCheck className="w-5 h-5" />
                  <span>Valider l'Embarquement</span>
                </button>
              </div>
            )}

            {scanStatus === 'already_boarded' && activeBooking && (
              <div className="bg-rose-950/90 border-2 border-rose-500 rounded-2xl p-5 shadow-2xl animate-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 bg-rose-900/80 px-2 py-0.5 rounded">
                      Alerte Fraude / Déjà Utilisé
                    </span>
                    <h4 className="text-xl font-black text-white mt-0.5 truncate">
                      {activeBooking.passengers[0]?.firstName} {activeBooking.passengers[0]?.lastName}
                    </h4>
                  </div>
                </div>

                <div className="mt-3 text-xs bg-slate-900/90 p-3 rounded-xl border border-rose-800 text-rose-200 space-y-1">
                  <p className="font-semibold text-rose-300">
                    Ce billet a DÉJÀ été scanné et validé pour l'embarquement.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Validé par : <strong className="text-slate-200">{activeBooking.boardedByAgent || 'Agent Quai'}</strong>
                  </p>
                  {activeBooking.boardedAt && (
                    <p className="text-[11px] text-slate-400">
                      Heure de scan : <strong className="text-slate-200">{new Date(activeBooking.boardedAt).toLocaleTimeString('fr-FR')}</strong>
                    </p>
                  )}
                </div>

                {wasBoardedOffline && (
                  <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-amber-950/80 border border-amber-800 text-[11px] text-amber-200">
                    <Database className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      Validation sécurisée enregistrée en <strong>cache local (hors-ligne)</strong>. Le billet ne peut plus être réutilisé sur ce quai.
                    </span>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleResetBoarding}
                    className="flex-1 py-2 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Réinitialiser (Correction)</span>
                  </button>
                </div>
              </div>
            )}

            {scanStatus === 'not_found' && (
              <div className="bg-amber-950/90 border-2 border-amber-500 rounded-2xl p-5 shadow-2xl animate-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-lg">
                    <XCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-900/80 px-2 py-0.5 rounded">
                      Billet Introuvable
                    </span>
                    <h4 className="text-lg font-black text-white mt-0.5">
                      Aucun Billet pour "{lastScannedPnr}"
                    </h4>
                  </div>
                </div>
                <p className="text-xs text-amber-200/90 mt-3 bg-slate-900/80 p-3 rounded-xl border border-amber-800">
                  Vérifiez le code PNR ou dirigez le voyageur vers le guichet de gare pour édition ou confirmation de paiement.
                </p>
              </div>
            )}

            {/* Quick Link to Historique Tab */}
            <div className="pt-2">
              <button
                onClick={() => setTerminalTab('history')}
                className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-400" />
                  <span>Consulter la vue Historique ({scanHistory.length} scans récents)</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </main>
        </>
      )}

      {/* ======================================================== */}
      {/* TAB 2: VUE 'HISTORIQUE' (20 DERNIERS BILLETS SCANNÉS)    */}
      {/* ======================================================== */}
      {terminalTab === 'history' && (
        <main className="flex-1 max-w-lg w-full mx-auto p-4 space-y-4 animate-in fade-in duration-150">
          
          {/* Header of History View */}
          <div className={`rounded-2xl border p-4 shadow-xl transition-colors ${
            effectiveTheme === 'dark'
              ? 'bg-slate-800/90 border-slate-700 text-slate-100 shadow-black/40'
              : 'bg-white border-slate-200 text-slate-900 shadow-md'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-base font-black flex items-center gap-2 ${
                  effectiveTheme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  <History className="w-5 h-5 text-amber-500" />
                  <span>Historique des Scans Récents</span>
                </h3>
                <p className={`text-xs mt-0.5 ${
                  effectiveTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Journal des 20 dernières vérifications effectuées sur ce téléphone
                </p>
              </div>
              <span className={`px-2.5 py-1 text-xs font-mono font-black rounded-lg border ${
                effectiveTheme === 'dark'
                  ? 'bg-slate-900 text-emerald-400 border-slate-700'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300'
              }`}>
                {scanHistory.length}/20 max
              </span>
            </div>

            {/* KPI STAT CARDS */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-emerald-950/70 border border-emerald-800/80 rounded-xl p-2.5 text-center">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Valides
                </span>
                <span className="text-xl font-black text-white font-mono">
                  {validHistoryCount}
                </span>
              </div>

              <div className="bg-rose-950/70 border border-rose-800/80 rounded-xl p-2.5 text-center">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                  Fraudes
                </span>
                <span className="text-xl font-black text-white font-mono">
                  {fraudHistoryCount}
                </span>
              </div>

              <div className="bg-amber-950/70 border border-amber-800/80 rounded-xl p-2.5 text-center">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Invalides
                </span>
                <span className="text-xl font-black text-white font-mono">
                  {invalidHistoryCount}
                </span>
              </div>
            </div>

            {/* Search Input for History */}
            <div className="mt-3 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Rechercher dans l'historique (PNR, nom, ville)..."
                className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors ${
                  effectiveTheme === 'dark'
                    ? 'bg-slate-900 text-white border-slate-700 placeholder-slate-500'
                    : 'bg-slate-50 text-slate-900 border-slate-300 placeholder-slate-400'
                }`}
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex gap-1.5 mt-2.5 overflow-x-auto pb-1 text-[11px] font-bold">
              <button
                onClick={() => setHistoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  historyFilter === 'all'
                    ? effectiveTheme === 'dark'
                      ? 'bg-slate-700 text-white border border-slate-600'
                      : 'bg-slate-200 text-slate-900 border border-slate-300'
                    : effectiveTheme === 'dark'
                    ? 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Tous ({scanHistory.length})
              </button>
              <button
                onClick={() => setHistoryFilter('valid')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  historyFilter === 'valid'
                    ? 'bg-emerald-900 text-emerald-200 border border-emerald-700'
                    : effectiveTheme === 'dark'
                    ? 'bg-slate-900/60 text-emerald-400 hover:text-emerald-300'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Valides ({validHistoryCount})</span>
              </button>
              <button
                onClick={() => setHistoryFilter('already_boarded')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  historyFilter === 'already_boarded'
                    ? 'bg-rose-900 text-rose-200 border border-rose-700'
                    : effectiveTheme === 'dark'
                    ? 'bg-slate-900/60 text-rose-400 hover:text-rose-300'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Fraudes ({fraudHistoryCount})</span>
              </button>
              <button
                onClick={() => setHistoryFilter('invalid')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  historyFilter === 'invalid'
                    ? 'bg-amber-900 text-amber-200 border border-amber-700'
                    : effectiveTheme === 'dark'
                    ? 'bg-slate-900/60 text-amber-400 hover:text-amber-300'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                <XCircle className="w-3 h-3" />
                <span>Invalides ({invalidHistoryCount})</span>
              </button>
            </div>
          </div>

          {/* LIST OF THE 20 SCANNED TICKETS */}
          <div className="space-y-2.5">
            {filteredHistory.length === 0 ? (
              <div className={`rounded-2xl border p-8 text-center space-y-2 transition-colors ${
                effectiveTheme === 'dark'
                  ? 'bg-slate-800/60 border-slate-700 text-slate-400'
                  : 'bg-white border-slate-200 text-slate-500 shadow-xs'
              }`}>
                <Clock className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
                <p className="text-sm font-semibold">Aucun scan correspondant</p>
                <p className="text-xs opacity-75">
                  Les 20 derniers billets scannés s'affichent automatiquement ici.
                </p>
              </div>
            ) : (
              filteredHistory.map((item, index) => {
                const isValid = item.status === 'valid';
                const isFraud = item.status === 'already_boarded';
                const isInvalid = item.status === 'invalid';

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-3.5 transition-all shadow-md ${
                      isValid
                        ? effectiveTheme === 'dark'
                          ? 'bg-slate-800/90 border-emerald-800/80 hover:border-emerald-600'
                          : 'bg-white border-emerald-300 hover:border-emerald-500 shadow-xs'
                        : isFraud
                        ? effectiveTheme === 'dark'
                          ? 'bg-rose-950/40 border-rose-800/80 hover:border-rose-600'
                          : 'bg-rose-50/80 border-rose-300 hover:border-rose-500 shadow-xs'
                        : effectiveTheme === 'dark'
                        ? 'bg-amber-950/40 border-amber-800/80 hover:border-amber-600'
                        : 'bg-amber-50/80 border-amber-300 hover:border-amber-500 shadow-xs'
                    }`}
                  >
                    {/* Top Row: Status badge & exact Timestamp */}
                    <div className={`flex items-center justify-between gap-2 pb-2 border-b ${
                      effectiveTheme === 'dark' ? 'border-slate-700/60' : 'border-slate-100'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                          #{index + 1}
                        </span>
                        {isValid && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Billet Valide</span>
                          </span>
                        )}
                        {isFraud && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-700">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>Alerte Fraude (Déjà Utilisé)</span>
                          </span>
                        )}
                        {isInvalid && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-700">
                            <XCircle className="w-3 h-3 text-amber-400" />
                            <span>Billet Invalide</span>
                          </span>
                        )}
                      </div>

                      {/* Exact Timestamp */}
                      <div className={`flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border ${
                        effectiveTheme === 'dark'
                          ? 'text-slate-300 bg-slate-900/80 border-slate-700'
                          : 'text-slate-700 bg-slate-100 border-slate-200'
                      }`}>
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="font-bold">{item.scannedAt}</span>
                        {item.scannedDate && (
                          <span className="text-slate-400 text-[10px] hidden sm:inline">
                            · {item.scannedDate}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Details */}
                    <div className="pt-2.5 flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className={`text-sm font-black truncate ${
                          effectiveTheme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                          {item.passengerName}
                        </h4>
                        <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${
                          effectiveTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{item.tripSummary}</span>
                          </span>
                          {item.seatNumber && item.seatNumber !== '-' && (
                            <span className="text-amber-500 font-mono font-bold flex items-center gap-1">
                              <Armchair className="w-3 h-3 text-amber-500" />
                              <span>Siège {item.seatNumber}</span>
                            </span>
                          )}
                        </div>
                        {item.companyName && (
                          <p className={`text-[11px] ${effectiveTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                            Compagnie : <span className={`font-medium ${effectiveTheme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{item.companyName}</span>
                          </p>
                        )}
                      </div>

                      {/* PNR & Re-inspect Action */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <button
                          onClick={() => handleCopyHistoryPnr(item.pnr)}
                          className={`px-2 py-1 font-mono text-xs font-bold rounded-lg border flex items-center gap-1 transition-colors cursor-pointer ${
                            effectiveTheme === 'dark'
                              ? 'bg-slate-900 hover:bg-slate-700 text-emerald-400 border-slate-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                          }`}
                          title="Copier le code PNR"
                        >
                          <span>{item.pnr}</span>
                          {copiedPnr === item.pnr ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>

                        <button
                          onClick={() => handleReinspectFromHistory(item.pnr)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors cursor-pointer flex items-center gap-1 ${
                            effectiveTheme === 'dark'
                              ? 'text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700'
                              : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          <span>Re-contrôler</span>
                          <ArrowUpRight className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Metadata */}
                    <div className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] ${
                      effectiveTheme === 'dark' ? 'border-slate-700/40 text-slate-400' : 'border-slate-100 text-slate-500'
                    }`}>
                      <span>Agent : <strong className={effectiveTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>{item.agentName}</strong></span>
                      <span className="flex items-center gap-1">
                        {item.syncMode === 'offline_cache' ? (
                          <>
                            <Database className="w-2.5 h-2.5 text-amber-500" />
                            <span className="text-amber-500 font-semibold">Cache local</span>
                          </>
                        ) : (
                          <>
                            <Wifi className="w-2.5 h-2.5 text-emerald-500" />
                            <span className="text-emerald-500 font-semibold">Cloud Sync</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Action Bar for History */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleExportHistoryReport}
              className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              {reportExported ? <Check className="w-4 h-4 text-white" /> : <Share2 className="w-4 h-4" />}
              <span>{reportExported ? 'Rapport Copié ! (Prêt à coller)' : 'Exporter le Rapport du Quart'}</span>
            </button>

            <button
              onClick={handleClearHistory}
              className={`py-2.5 px-3 border text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                effectiveTheme === 'dark'
                  ? 'bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 hover:border-rose-800 border-slate-700'
                  : 'bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 hover:border-rose-300 border-slate-300 shadow-xs'
              }`}
              title="Vider l'historique des scans"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vider</span>
            </button>

            <button
              onClick={() => setTerminalTab('scan')}
              className={`py-2.5 px-3 border text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                effectiveTheme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-xs'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-emerald-500" />
              <span>Nouveau Scan</span>
            </button>
          </div>
        </main>
      )}

      {/* 3. OFFLINE & LOCAL CACHE MANAGEMENT MODAL */}
      {isOfflineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className={`relative w-full max-w-lg rounded-2xl border p-5 shadow-2xl max-h-[90vh] overflow-y-auto ${
            effectiveTheme === 'dark'
              ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-black/80'
              : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between pb-3 border-b ${
              effectiveTheme === 'dark' ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
                  effectiveIsOnline ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                }`}>
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">
                    Centre Hors-Ligne & Cache Local
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${effectiveIsOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    <span className={`text-[11px] font-bold ${
                      effectiveIsOnline ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      {effectiveIsOnline ? 'Connecté au Cloud Firebase' : 'Mode Hors-Ligne (Opération Locale Autonome)'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOfflineModalOpen(false)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  effectiveTheme === 'dark'
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Force Offline Toggle Switch */}
            <div className={`mt-4 p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
              forcedOffline
                ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                : effectiveTheme === 'dark'
                ? 'bg-slate-800/60 border-slate-700/80'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black">Forcer le Mode Hors-Ligne</span>
                  {forcedOffline && (
                    <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[9px] font-black rounded uppercase">
                      Actif
                    </span>
                  )}
                </div>
                <p className={`text-[11px] max-w-[280px] ${
                  forcedOffline ? 'text-amber-300/80' : effectiveTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Simule l'absence de réseau pour les quais en sous-sol, gares isolées ou tests sans connexion internet.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleForcedOffline}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  forcedOffline ? 'bg-amber-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    forcedOffline ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Cache & Queue KPI Stats */}
            <div className="grid grid-cols-2 gap-2.5 mt-3">
              <div className={`p-3 rounded-xl border ${
                effectiveTheme === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Billets en Cache Local
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black font-mono text-emerald-500">
                    {cacheMeta.ticketCount}
                  </span>
                  <span className="text-[11px] text-slate-400">billets préchargés</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Dernier rafraîchissement : {cacheMeta.lastUpdated || 'Initialisé'}
                </p>
              </div>

              <div className={`p-3 rounded-xl border ${
                effectiveTheme === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  File d'Attente Cloud
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className={`text-2xl font-black font-mono ${
                    cacheMeta.pendingSyncCount > 0 ? 'text-amber-500' : 'text-slate-400'
                  }`}>
                    {cacheMeta.pendingSyncCount}
                  </span>
                  <span className="text-[11px] text-slate-400">validations à synchroniser</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {cacheMeta.pendingSyncCount > 0 ? 'En attente de connexion' : 'Tout est synchronisé'}
                </p>
              </div>
            </div>

            {/* List of Pending Validations (if any) */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Validations Hors-Ligne en Attente ({pendingQueue.length})
                </span>
                {pendingQueue.length > 0 && (
                  <button
                    onClick={handleClearOfflineQueue}
                    className="text-[10px] text-rose-500 hover:text-rose-400 font-semibold cursor-pointer"
                  >
                    Vider la file
                  </button>
                )}
              </div>

              {pendingQueue.length === 0 ? (
                <div className={`p-3.5 rounded-xl border text-center text-xs ${
                  effectiveTheme === 'dark'
                    ? 'bg-slate-800/40 border-slate-800 text-slate-400'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <span>Aucun billet en attente de synchronisation. Tous les scans sont à jour.</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {pendingQueue.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                        effectiveTheme === 'dark'
                          ? 'bg-slate-800/80 border-amber-800/60'
                          : 'bg-amber-50 border-amber-200 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-amber-500">{item.pnr}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 font-bold border border-amber-700">
                            Embarqué Hors-Ligne
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {new Date(item.timestamp).toLocaleTimeString('fr-FR')} · {item.agentLabel}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {item.attempts > 0 ? `${item.attempts} tent.` : 'Prêt'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3-Step Offline Field Controller Guide */}
            <div className={`mt-4 p-3 rounded-xl border text-[11px] space-y-1.5 ${
              effectiveTheme === 'dark'
                ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="font-bold flex items-center gap-1.5 text-xs text-emerald-500">
                <ShieldCheck className="w-4 h-4" />
                <span>Fonctionnement Garanti sur le Quai :</span>
              </div>
              <p>• <strong>Zéro Latence :</strong> Même sans signal 4G/WiFi, chaque billet est authentifié instantanément grâce au cache local.</p>
              <p>• <strong>Anti-Fraude Sécurisé :</strong> Tout billet scanné est marqué invalide pour les scans suivants sur ce terminal, empêchant la fraude même hors-ligne.</p>
              <p>• <strong>Synchronisation Automatique :</strong> Dès le retour de la connexion, les billets embarqués sont poussés vers Firebase sans action requise.</p>
            </div>

            {/* Modal Action Buttons */}
            <div className="mt-5 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Synchronisation...' : 'Synchroniser avec le Cloud'}</span>
              </button>

              <button
                onClick={handleRefreshCacheData}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  effectiveTheme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-amber-500" />
                <span>Rafraîchir Cache</span>
              </button>

              <button
                onClick={() => setIsOfflineModalOpen(false)}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                  effectiveTheme === 'dark'
                    ? 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-300'
                }`}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Screen Illuminator Overlay when Torch is ON (for scanning in pitch dark outdoor terminals) */}
      {isTorchOn && (
        <div className="pointer-events-none fixed inset-0 z-30 ring-8 ring-amber-400/80 shadow-[inset_0_0_100px_rgba(255,255,255,0.4)] animate-pulse" />
      )}
    </div>
  );
};
