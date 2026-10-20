import React, { useState } from 'react';
import { Trip, Currency, Passenger, PaymentProvider, Booking } from '../types';
import { formatPrice } from '../utils/currency';
import { saveBooking } from '../utils/storage';
import { saveBookingToCloud } from '../services/firestoreSync';
import confetti from 'canvas-confetti';
import { 
  X, 
  ArrowLeft, 
  ShieldCheck, 
  Smartphone, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';

interface PassengerCheckoutModalProps {
  trip: Trip;
  selectedSeats: string[];
  currency: Currency;
  onClose: () => void;
  onBookingSuccess: (booking: Booking) => void;
  userPhoneDefault?: string;
}

export const PassengerCheckoutModal: React.FC<PassengerCheckoutModalProps> = ({
  trip,
  selectedSeats,
  currency,
  onClose,
  onBookingSuccess,
}) => {
  // Initialize passengers array based on selected seats
  const [passengers, setPassengers] = useState<Passenger[]>(() =>
    selectedSeats.map((seatNum, idx) => ({
      firstName: idx === 0 ? 'Moussa' : '',
      lastName: idx === 0 ? 'Diallo' : '',
      phone: idx === 0 ? '+223 76 12 34 56' : '',
      email: idx === 0 ? 'moussa.diallo@email.com' : '',
      idType: 'CARTE_NINA',
      idNumber: idx === 0 ? 'ML-NINA-1994-55092' : '',
      nationality: 'Malienne',
      seatNumber: seatNum,
    }))
  );

  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>('orange_money');
  const [payerPhone, setPayerPhone] = useState<string>('+223 76 12 34 56');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentStep, setPaymentStep] = useState<'form' | 'push_prompt' | 'completed'>('form');
  const [countdown, setCountdown] = useState<number>(5);

  const totalAmountXOF = selectedSeats.length * trip.basePriceXOF;

  const handlePassengerChange = (index: number, field: keyof Passenger, value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const handleStartPayment = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    for (const p of passengers) {
      if (!p.firstName.trim() || !p.lastName.trim() || !p.idNumber.trim()) {
        alert('Veuillez remplir le nom, prénom et le numéro de pièce pour tous les passagers.');
        return;
      }
    }

    if (!payerPhone.trim()) {
      alert('Veuillez renseigner un numéro de téléphone pour le paiement Mobile Money.');
      return;
    }

    // Move to simulated USSD / Push screen
    setIsProcessing(true);
    setPaymentStep('push_prompt');
    setCountdown(5);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishPayment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finishPayment = () => {
    setIsProcessing(false);
    setPaymentStep('completed');

    // Create unique PNR
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const cityCode = trip.originCity.substring(0, 3).toUpperCase();
    const pnr = `AFW-${randomSuffix}-${cityCode}`;

    const newBooking: Booking = {
      id: `booking_${Date.now()}`,
      pnr,
      tripId: trip.id,
      trip,
      passengers,
      totalAmountXOF,
      currency,
      paymentProvider,
      paymentPhone: payerPhone,
      paymentStatus: 'completed',
      bookingDate: new Date().toISOString(),
      boardingStatus: 'not_boarded',
      verificationHash: `afriway_v_${randomSuffix}_${passengers[0].lastName.toLowerCase()}`,
      notes: `Réservation confirmée via ${paymentProvider.toUpperCase()}. Présentez le QR Code en gare.`,
    };

    saveBooking(newBooking);
    saveBookingToCloud(newBooking).catch((err) => console.warn('Cloud sync error (local fallback preserved):', err));

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#047857', '#d97706', '#059669', '#f59e0b'],
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      onBookingSuccess(newBooking);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer mr-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>{trip.companyName}</span>
                <span aria-hidden="true">·</span>
                <span>Sièges : {selectedSeats.join(', ')}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Finalisation de votre voyage & Paiement
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {paymentStep === 'form' ? (
          <form onSubmit={handleStartPayment} className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
            {/* International Border Warning if cross-border */}
            {trip.isCrossBorder && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-amber-900">
                    Trajet Transfrontalier : Formalités de Police & Douane
                  </h4>
                  <p className="text-amber-800 leading-relaxed">
                    Pour franchir la frontière entre le <strong>{trip.originCountry}</strong> et la <strong>{trip.destinationCountry}</strong>, chaque passager doit obligatoirement être muni d'un Passeport ou d'une Carte d'Identité CEDEAO en cours de validité, ainsi que du carnet international de vaccination (Fièvre jaune).
                  </p>
                </div>
              </div>
            )}

            {/* Passengers Info Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span>Passager(s) enregistré(s)</span>
                <span className="text-xs text-slate-400 normal-case font-normal">
                  Identité conforme à votre pièce de voyage
                </span>
              </h4>

              {passengers.map((passenger, idx) => (
                <div
                  key={`pass_${idx}`}
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-semibold text-slate-700">
                    <span>Voyageur {idx + 1} — Siège {passenger.seatNumber}</span>
                    <span className="text-emerald-800 font-mono">Place réservée</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Prénom *</label>
                      <input
                        type="text"
                        required
                        value={passenger.firstName}
                        onChange={(e) => handlePassengerChange(idx, 'firstName', e.target.value)}
                        placeholder="Ex: Amadou"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Nom de famille *</label>
                      <input
                        type="text"
                        required
                        value={passenger.lastName}
                        onChange={(e) => handlePassengerChange(idx, 'lastName', e.target.value)}
                        placeholder="Ex: Traoré"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Type de pièce d'identité *</label>
                      <select
                        value={passenger.idType}
                        onChange={(e) => handlePassengerChange(idx, 'idType', e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 font-medium"
                      >
                        <option value="CARTE_NINA">Carte NINA (Mali)</option>
                        <option value="CNI">Carte Nationale d'Identité (CNI)</option>
                        <option value="CARTE_CEDEAO">Carte Biométrique CEDEAO</option>
                        <option value="PASSPORT">Passeport International</option>
                        <option value="AUTRE">Autre Document de voyage</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Numéro de la pièce *</label>
                      <input
                        type="text"
                        required
                        value={passenger.idNumber}
                        onChange={(e) => handlePassengerChange(idx, 'idNumber', e.target.value)}
                        placeholder="Ex: NINA-1988-94812"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 font-medium font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Téléphone mobile (SMS / WhatsApp)</label>
                      <input
                        type="tel"
                        value={passenger.phone}
                        onChange={(e) => handlePassengerChange(idx, 'phone', e.target.value)}
                        placeholder="+223 70 00 00 00"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 font-medium font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Nationalité</label>
                      <input
                        type="text"
                        value={passenger.nationality}
                        onChange={(e) => handlePassengerChange(idx, 'nationality', e.target.value)}
                        placeholder="Ex: Malienne, Sénégalaise, Ivoirienne"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 font-medium"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Paiement Mobile Money & Carte
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* Orange Money */}
                <button
                  type="button"
                  onClick={() => setPaymentProvider('orange_money')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentProvider === 'orange_money'
                      ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center mb-1.5 shadow-xs">
                    OM
                  </div>
                  <span className="block text-xs font-bold text-slate-900">Orange Money</span>
                  <span className="text-[10px] text-slate-500">Mali, Sénégal, CI (#144#)</span>
                </button>

                {/* Wave */}
                <button
                  type="button"
                  onClick={() => setPaymentProvider('wave')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentProvider === 'wave'
                      ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-500 text-white font-black text-xs flex items-center justify-center mb-1.5 shadow-xs">
                    W
                  </div>
                  <span className="block text-xs font-bold text-slate-900">Wave</span>
                  <span className="text-[10px] text-slate-500">Sénégal, Côte d'Ivoire (1% frais)</span>
                </button>

                {/* Moov Money */}
                <button
                  type="button"
                  onClick={() => setPaymentProvider('moov_money')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentProvider === 'moov_money'
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center mb-1.5 shadow-xs">
                    Moov
                  </div>
                  <span className="block text-xs font-bold text-slate-900">Moov Money</span>
                  <span className="text-[10px] text-slate-500">Mali, Burkina, Togo, Bénin</span>
                </button>

                {/* MTN Mobile Money */}
                <button
                  type="button"
                  onClick={() => setPaymentProvider('mtn_momo')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentProvider === 'mtn_momo'
                      ? 'border-yellow-500 bg-yellow-50/70 ring-2 ring-yellow-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-yellow-500 text-slate-900 font-black text-xs flex items-center justify-center mb-1.5 shadow-xs">
                    MTN
                  </div>
                  <span className="block text-xs font-bold text-slate-900">MTN MoMo</span>
                  <span className="text-[10px] text-slate-500">Côte d'Ivoire, Bénin</span>
                </button>

                {/* Bank Card */}
                <button
                  type="button"
                  onClick={() => setPaymentProvider('card')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentProvider === 'card'
                      ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-1.5 shadow-xs">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="block text-xs font-bold text-slate-900">Carte Visa / Mastercard</span>
                  <span className="text-[10px] text-slate-500">Cartes UEMOA & Internationales</span>
                </button>
              </div>

              {/* Payer Phone Field */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Numéro de débit Mobile Money / Réception du billet *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={payerPhone}
                    onChange={(e) => setPayerPhone(e.target.value)}
                    placeholder="+223 76 12 34 56"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Vous recevrez un message de confirmation et votre lien vers le billet électronique QR Code.
                </p>
              </div>
            </div>

            {/* Total and Submit */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-500 block">Montant total net :</span>
                <span className="text-2xl font-black text-emerald-900 font-mono tabular-nums">
                  {formatPrice(totalAmountXOF, currency)}
                </span>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Payer et émettre mon billet</span>
              </button>
            </div>
          </form>
        ) : paymentStep === 'push_prompt' ? (
          /* Simulated USSD / Push Notification Screen */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-xl font-bold text-slate-900">
                Demande d'autorisation envoyée !
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Une notification de paiement de{' '}
                <strong className="text-emerald-900 font-mono">
                  {formatPrice(totalAmountXOF, currency)}
                </strong>{' '}
                a été envoyée sur votre téléphone{' '}
                <strong className="font-mono text-slate-900">{payerPhone}</strong>.
              </p>
            </div>

            <div className="bg-slate-100 rounded-2xl p-4 max-w-md mx-auto border border-slate-200 text-xs text-slate-700 space-y-2 text-left">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Smartphone className="w-4 h-4 text-emerald-700" />
                <span>Instructions sur votre téléphone :</span>
              </div>
              {paymentProvider === 'orange_money' && (
                <p>Composez le <strong>#144#</strong> ou ouvrez l'application <strong>Orange Money</strong>, saisissez votre code PIN secret pour approuver la transaction.</p>
              )}
              {paymentProvider === 'wave' && (
                <p>Ouvrez votre application <strong>Wave</strong> et appuyez sur « Confirmer le paiement ».</p>
              )}
              {(paymentProvider === 'moov_money' || paymentProvider === 'mtn_momo') && (
                <p>Confirmez le prompt USSD qui s'affiche sur votre écran avec votre code secret.</p>
              )}
              {paymentProvider === 'card' && (
                <p>Authentification 3D-Secure en cours de validation par votre établissement bancaire.</p>
              )}
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Validation automatique dans {countdown}s...
            </div>

            <div>
              <button
                type="button"
                onClick={finishPayment}
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Valider immédiatement (Accélérer démo)
              </button>
            </div>
          </div>
        ) : (
          /* Payment completed */
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">Paiement Réussi !</h3>
            <p className="text-sm text-slate-600">
              Votre billet électronique avec QR code sécurisé est généré.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
