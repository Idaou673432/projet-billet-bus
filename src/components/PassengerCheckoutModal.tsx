import React, { useState } from 'react';
import { Trip, Currency, Passenger, PaymentProvider, Booking } from '../types';
import { formatPrice } from '../utils/currency';
import { saveBooking } from '../utils/storage';
import { saveBookingToCloud } from '../services/firestoreSync';
import { PAYMENT_PROVIDERS_CATALOG } from '../services/paymentService';
import { generateTicketSecuritySignature, sanitizeInput } from '../services/securityService';
import { InteractivePaymentExecution } from './InteractivePaymentExecution';
import confetti from 'canvas-confetti';
import { 
  X, 
  ArrowLeft, 
  ShieldCheck, 
  Smartphone, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  Building2,
  Sparkles,
  Printer,
  Receipt,
  FileText
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

  const [paymentCategory, setPaymentCategory] = useState<'all' | 'mobile_money' | 'aggregator' | 'card' | 'cash'>('all');
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>('wave');
  const [payerPhone, setPayerPhone] = useState<string>('+223 76 12 34 56');
  const [paymentStep, setPaymentStep] = useState<'form' | 'authorization' | 'completed'>('form');
  
  // PNR generated when initiating checkout
  const [activePnr, setActivePnr] = useState<string>(() => {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const cityCode = trip.originCity.substring(0, 3).toUpperCase();
    return `AFW-${randomSuffix}-${cityCode}`;
  });

  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);

  const totalAmountXOF = selectedSeats.length * trip.basePriceXOF;
  const currentProviderMeta = PAYMENT_PROVIDERS_CATALOG[paymentProvider];
  const feeXOF = Math.round((totalAmountXOF * currentProviderMeta.feePercent) / 100);

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

    if (paymentProvider !== 'card' && !payerPhone.trim()) {
      alert('Veuillez renseigner un numéro de téléphone pour la réception du billet et le paiement.');
      return;
    }

    // Advance to interactive payment execution
    setPaymentStep('authorization');
  };

  const handlePaymentSuccess = async (transaction: any) => {
    const sanitizedPassengers = passengers.map((p) => ({
      ...p,
      firstName: sanitizeInput(p.firstName),
      lastName: sanitizeInput(p.lastName),
      idNumber: sanitizeInput(p.idNumber),
      phone: sanitizeInput(p.phone),
      nationality: sanitizeInput(p.nationality),
    }));

    // Compute cryptographic HMAC-SHA256 digital signature
    const signature = await generateTicketSecuritySignature({
      pnr: activePnr,
      tripId: trip.id,
      departureDate: trip.departureDate,
      seats: sanitizedPassengers.map((p) => p.seatNumber),
      totalAmountXOF,
      passengerLastName: sanitizedPassengers[0].lastName,
    });

    const newBooking: Booking = {
      id: `booking_${Date.now()}`,
      pnr: activePnr,
      tripId: trip.id,
      trip,
      passengers: sanitizedPassengers,
      totalAmountXOF,
      currency,
      paymentProvider,
      paymentPhone: sanitizeInput(payerPhone),
      paymentStatus: 'completed',
      bookingDate: new Date().toISOString(),
      boardingStatus: 'not_boarded',
      verificationHash: signature,
      notes: `Paiement certifié via ${currentProviderMeta.name}. Signature: ${signature}.`,
      transactionId: transaction.id,
      paymentReceiptNumber: transaction.receiptNumber,
    };

    saveBooking(newBooking);
    saveBookingToCloud(newBooking).catch((err) => console.warn('Cloud sync error (local fallback preserved):', err));

    setCompletedBooking(newBooking);
    setPaymentStep('completed');

    // Confetti celebration
    try {
      confetti({
        particleCount: 100,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#047857', '#0891b2', '#f59e0b', '#d97706'],
      });
    } catch {
      // ignore
    }
  };

  const providersList = Object.values(PAYMENT_PROVIDERS_CATALOG).filter((p) => {
    if (paymentCategory === 'all') return true;
    return p.category === paymentCategory;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            {paymentStep === 'authorization' ? (
              <button
                onClick={() => setPaymentStep('form')}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer mr-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer mr-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>{trip.companyName}</span>
                <span aria-hidden="true">·</span>
                <span>Sièges : {selectedSeats.join(', ')}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono font-bold text-emerald-800">PNR : {activePnr}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {paymentStep === 'form' && 'Finalisation de votre voyage & Paiement'}
                {paymentStep === 'authorization' && `Autorisation de Paiement — ${currentProviderMeta.name}`}
                {paymentStep === 'completed' && 'Paiement Réussi & Billet Officiel Émis'}
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

        {/* STEP 1: FORM WITH CATEGORIZED PAYMENT METHODS */}
        {paymentStep === 'form' && (
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

            {/* Comprehensive Payment Providers Section */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-800" />
                  <span>Moyens de Paiement Intégrés (Afrique de l'Ouest)</span>
                </h4>
                <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 self-start">
                  9 Passerelles Actives
                </span>
              </div>

              {/* Filter Tabs by Category */}
              <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPaymentCategory('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    paymentCategory === 'all'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tous (9)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentCategory('mobile_money')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    paymentCategory === 'mobile_money'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📱 Mobile Money (4)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentCategory('aggregator')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    paymentCategory === 'aggregator'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🌐 Agrégateurs (3)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentCategory('card')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    paymentCategory === 'card'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  💳 Cartes UEMOA & Inter
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentCategory('cash')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    paymentCategory === 'cash'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🏢 Guichet Gare
                </button>
              </div>

              {/* Payment Methods Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {providersList.map((prov) => {
                  const isSelected = paymentProvider === prov.id;
                  return (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => setPaymentProvider(prov.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? `ring-2 ring-emerald-600 bg-emerald-50/50 border-emerald-500 shadow-sm`
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div
                          className="w-8 h-8 rounded-lg text-white font-black text-xs flex items-center justify-center shadow-xs"
                          style={{ backgroundColor: prov.color }}
                        >
                          {prov.id === 'wave' && 'W'}
                          {prov.id === 'orange_money' && 'OM'}
                          {prov.id === 'mtn_momo' && 'MTN'}
                          {prov.id === 'moov_money' && 'Moov'}
                          {prov.id === 'cinetpay' && 'CP'}
                          {prov.id === 'paydunya' && 'PD'}
                          {prov.id === 'kkiapay' && 'KK'}
                          {prov.id === 'card' && <CreditCard className="w-4 h-4" />}
                          {prov.id === 'cash_counter' && <Building2 className="w-4 h-4" />}
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </div>
                        )}
                      </div>

                      <span className="block text-xs font-bold text-slate-900 leading-tight">
                        {prov.name}
                      </span>
                      <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {prov.tagline}
                      </span>
                      <div className="mt-1 text-[9px] font-semibold text-emerald-800 bg-emerald-100/60 px-1.5 py-0.5 rounded-sm inline-block">
                        {prov.badge}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Payer Phone Field */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Numéro de téléphone (Débit Mobile Money & Réception SMS Billet) *
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
                  Vous recevrez la notification de paiement sécurisée et votre billet électronique QR Code par SMS/WhatsApp.
                </p>
              </div>
            </div>

            {/* Total and Submit */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-500 block">Montant voyage net :</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-900 font-mono tabular-nums">
                    {formatPrice(totalAmountXOF, currency)}
                  </span>
                  {feeXOF > 0 && (
                    <span className="text-xs text-slate-500 font-mono">
                      (+{formatPrice(feeXOF, currency)} frais {currentProviderMeta.name})
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Continuer vers le paiement {currentProviderMeta.name}</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: INTERACTIVE AUTHORIZATION STEP */}
        {paymentStep === 'authorization' && (
          <InteractivePaymentExecution
            provider={paymentProvider}
            totalAmountXOF={totalAmountXOF}
            currency={currency}
            payerPhone={payerPhone}
            payerEmail={passengers[0]?.email}
            passengerName={`${passengers[0]?.firstName} ${passengers[0]?.lastName}`}
            pnr={activePnr}
            bookingId={`booking_${Date.now()}`}
            onPaymentSuccess={handlePaymentSuccess}
            onCancel={() => setPaymentStep('form')}
          />
        )}

        {/* STEP 3: COMPLETED OFFICIAL RECEIPT & TICKET ISSUANCE */}
        {paymentStep === 'completed' && completedBooking && (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Paiement Certifié & Billet Émis avec Succès</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                Merci {passengers[0]?.firstName} ! Bon voyage.
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                Votre transaction a été approuvée avec succès. Vos places sont officiellement réservées sur le car <strong>{trip.companyName}</strong>.
              </p>
            </div>

            {/* Official Fiscal Receipt Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-md mx-auto text-left space-y-3 font-mono text-xs shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-slate-900 uppercase">Quittance Officielle</span>
                </div>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                  00_SUCCESS
                </span>
              </div>

              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Numéro Reçu :</span>
                  <span className="font-bold text-slate-900">{completedBooking.paymentReceiptNumber || 'REC-2026-AFW'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Réf Dossier (PNR) :</span>
                  <span className="font-bold text-emerald-800">{completedBooking.pnr}</span>
                </div>
                <div className="flex justify-between">
                  <span>ID Transaction :</span>
                  <span className="font-bold text-slate-900">{completedBooking.transactionId || 'TXN-AFW-OK'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Passerelle / Opérateur :</span>
                  <span className="font-bold text-slate-900">{currentProviderMeta.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trajet :</span>
                  <span className="font-bold text-slate-900">{trip.originCity} ➔ {trip.destinationCity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Départ :</span>
                  <span className="font-bold text-slate-900">{trip.departureDate} à {trip.departureTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sièges réservés :</span>
                  <span className="font-bold text-slate-900">{selectedSeats.join(', ')}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm text-slate-900 font-bold">
                  <span>Montant total payé :</span>
                  <span className="text-emerald-900">{formatPrice(totalAmountXOF, currency)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onBookingSuccess(completedBooking)}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Afficher mon Billet & QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onBookingSuccess(completedBooking);
                }}
                className="w-full sm:w-auto px-5 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-800" />
                <span>Télécharger la Quittance & PDF</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
