import React, { useState, useEffect, useRef } from 'react';
import { Booking } from '../types';
import { findBookingByPNR, updateBoardingStatus, getStoredBookings } from '../utils/storage';
import { updateBoardingStatusInCloud, subscribeToBookings } from '../services/firestoreSync';
import { 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Camera, 
  Search, 
  UserCheck, 
  Clock, 
  MapPin, 
  Armchair,
  Volume2,
  Smartphone,
  ShieldCheck
} from 'lucide-react';

interface BoardingScannerModalProps {
  initialPnr?: string;
  onClose?: () => void;
  onOpenControllerMode?: () => void;
}

export const BoardingScannerModal: React.FC<BoardingScannerModalProps> = ({
  initialPnr = '',
  onOpenControllerMode,
}) => {
  const [pnrInput, setPnrInput] = useState<string>(initialPnr);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'valid' | 'already_boarded' | 'not_found'>('idle');
  const [agentName] = useState<string>('Agent Contrôle Gare Sogoniko');
  const [isScanningCamera, setIsScanningCamera] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);

  useEffect(() => {
    // Initial local read
    setRecentBookings(getStoredBookings());

    // Subscribe to Firestore live bookings across all devices
    const unsubscribe = subscribeToBookings((live) => {
      setRecentBookings(live);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (initialPnr) {
      handleInspect(initialPnr);
    }
  }, [initialPnr]);

  const handleInspect = (pnrToInspect: string) => {
    // Check in live recentBookings first, fallback to storage
    const foundInLive = recentBookings.find(
      (b) => b.pnr.toUpperCase() === pnrToInspect.trim().toUpperCase()
    );
    const booking = foundInLive || findBookingByPNR(pnrToInspect);
    if (!booking) {
      setActiveBooking(null);
      setScanStatus('not_found');
      return;
    }

    setActiveBooking(booking);
    if (booking.boardingStatus === 'boarded') {
      setScanStatus('already_boarded');
    } else {
      setScanStatus('valid');
    }
  };

  const handleConfirmBoarding = () => {
    if (!activeBooking) return;
    const updated = updateBoardingStatus(activeBooking.pnr, 'boarded', agentName);
    updateBoardingStatusInCloud(activeBooking.id, 'boarded', agentName).catch((err) =>
      console.warn('Cloud boarding update fallback:', err)
    );
    if (updated) {
      setActiveBooking(updated);
      setScanStatus('already_boarded');
      setRecentBookings(getStoredBookings());
    }
  };

  const handleResetStatus = () => {
    if (!activeBooking) return;
    const updated = updateBoardingStatus(activeBooking.pnr, 'not_boarded');
    updateBoardingStatusInCloud(activeBooking.id, 'not_boarded', agentName).catch((err) =>
      console.warn('Cloud boarding update fallback:', err)
    );
    if (updated) {
      setActiveBooking(updated);
      setScanStatus('valid');
      setRecentBookings(getStoredBookings());
    }
  };

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
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        }
      } catch (err) {
        console.warn('Camera preview not supported or access denied, falling back to simulated scan:', err);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Editorial Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Terminal d'Embarquement</span>
            <span aria-hidden="true">·</span>
            <span>Contrôle & Validation des Billets en Gare</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-emerald-800">{agentName}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Scanner d'Embarquement Passagers
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Vérifiez l'authenticité des billets électroniques, confirmez la présence des voyageurs et empêchez toute fraude ou réutilisation de billets.
          </p>
        </div>

        {onOpenControllerMode && (
          <button
            onClick={onOpenControllerMode}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer shrink-0 self-start sm:self-center"
          >
            <Smartphone className="w-4 h-4 text-slate-950" />
            <span>Mode Contrôleur Téléphone (Plein Écran)</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Scanner input & viewfinder */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-800" />
              <span>Saisie PNR ou Scan Caméra</span>
            </h3>

            {/* Quick manual PNR form */}
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
                  onChange={(e) => setPnrInput(e.target.value)}
                  placeholder="Ex: AFW-94812-BKO"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono uppercase"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-xs whitespace-nowrap"
              >
                Vérifier
              </button>
            </form>

            {/* Camera Viewfinder Box */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex flex-col items-center justify-center p-4 text-center">
              {isScanningCamera ? (
                <>
                  <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
                  {/* Viewfinder crosshairs */}
                  <div className="absolute inset-10 border-2 border-emerald-400 rounded-2xl pointer-events-none flex items-center justify-center shadow-lg">
                    <div className="w-full h-0.5 bg-emerald-400/80 animate-pulse" />
                  </div>
                </>
              ) : (
                <div className="space-y-2 text-slate-400">
                  <QrCode className="w-12 h-12 mx-auto text-slate-600" />
                  <p className="text-xs">Caméra en veille</p>
                  <button
                    type="button"
                    onClick={toggleCamera}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Activer la caméra</span>
                  </button>
                </div>
              )}

              {isScanningCamera && (
                <button
                  type="button"
                  onClick={toggleCamera}
                  className="absolute bottom-3 bg-slate-900/80 text-white px-3 py-1 rounded-full text-xs font-medium border border-slate-700 cursor-pointer"
                >
                  Désactiver caméra
                </button>
              )}
            </div>

            {/* Quick Test Demo Shortcuts */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-600 block mb-2">
                Billets de test instantanés :
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                {recentBookings.slice(0, 3).map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setPnrInput(b.pnr);
                      handleInspect(b.pnr);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition-colors ${
                      pnrInput === b.pnr
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-mono text-[11px]">{b.pnr}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                      {b.passengers[0]?.firstName} {b.passengers[0]?.lastName} · {b.trip.destinationCity}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Scan Result & Validation Action */}
        <div className="lg:col-span-7">
          {scanStatus === 'idle' ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
              <QrCode className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">En attente de scan</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Scannez le QR Code sur le smartphone du passager ou saisissez la référence PNR du billet pour valider son accès au car.
              </p>
            </div>
          ) : scanStatus === 'not_found' ? (
            <div className="bg-red-50 rounded-2xl border border-red-200 p-8 text-center space-y-3">
              <XCircle className="w-12 h-12 text-red-600 mx-auto" />
              <h3 className="text-lg font-bold text-red-900">Billet Introuvable ou Invalide</h3>
              <p className="text-xs text-red-700 max-w-md mx-auto">
                Aucun billet correspondant au code PNR <strong>{pnrInput}</strong> n'a été trouvé dans le système officiel. Veuillez vérifier auprès du chef de gare.
              </p>
            </div>
          ) : activeBooking ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
              {/* Result Status Banner */}
              <div className={`p-5 flex items-center justify-between ${
                scanStatus === 'already_boarded'
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-700 text-white'
              }`}>
                <div className="flex items-center gap-3">
                  {scanStatus === 'already_boarded' ? (
                    <AlertTriangle className="w-8 h-8 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-8 h-8 shrink-0" />
                  )}
                  <div>
                    <h3 className="text-lg font-black tracking-tight">
                      {scanStatus === 'already_boarded'
                        ? 'BILLET DÉJÀ EMBARQUÉ !'
                        : 'BILLET AUTHENTIQUE & VALIDE'}
                    </h3>
                    <p className="text-xs opacity-90">
                      {scanStatus === 'already_boarded'
                        ? `Ce passager a déjà été enregistré le ${activeBooking.boardedAt ? new Date(activeBooking.boardedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''} par ${activeBooking.boardedByAgent || 'Agent'}`
                        : 'Accès autorisé à bord du car'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono opacity-80 uppercase block">Code PNR</span>
                  <span className="text-base font-black font-mono">{activeBooking.pnr}</span>
                </div>
              </div>

              {/* Passenger & Seat Highlight */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-400 block font-medium">Passager Principal</span>
                    <span className="text-base font-bold text-slate-900 block mt-1">
                      {activeBooking.passengers[0].firstName} {activeBooking.passengers[0].lastName.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {activeBooking.passengers[0].idType}: {activeBooking.passengers[0].idNumber}
                    </span>
                  </div>

                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                    <span className="text-xs text-emerald-800 block font-medium">Siège Assigné</span>
                    <span className="text-3xl font-black text-emerald-950 block mt-0.5 font-mono">
                      {activeBooking.passengers.map((p) => p.seatNumber).join(', ')}
                    </span>
                    <span className="text-[11px] text-emerald-800">
                      {activeBooking.trip.busClass === 'vip' ? 'VIP Grand Confort' : 'Place Standard'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-400 block font-medium">Départ Prévu</span>
                    <span className="text-2xl font-black text-slate-900 block mt-0.5 font-mono">
                      {activeBooking.trip.departureTime}
                    </span>
                    <span className="text-xs text-slate-500">
                      Car {activeBooking.trip.plateNumber}
                    </span>
                  </div>
                </div>

                {/* Trip Route Details */}
                <div className="border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Ligne :</span>
                    <span className="font-bold text-slate-900">
                      {activeBooking.trip.originCity} ({activeBooking.trip.originCountry}) ➔ {activeBooking.trip.destinationCity} ({activeBooking.trip.destinationCountry})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Compagnie :</span>
                    <span className="font-semibold text-slate-900">{activeBooking.trip.companyName}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Gare de départ :</span>
                    <span className="text-slate-900">{activeBooking.trip.originStationName}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Paiement :</span>
                    <span className="font-medium text-emerald-800">
                      RÉGLÉ VIA {activeBooking.paymentProvider.toUpperCase()} ({activeBooking.paymentPhone || 'Mobile'})
                    </span>
                  </div>
                </div>

                {/* Inspector Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  {scanStatus === 'already_boarded' ? (
                    <button
                      type="button"
                      onClick={handleResetStatus}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Annuler l'embarquement (Test)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConfirmBoarding}
                      className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Valider & Enregistrer l'Embarquement</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
