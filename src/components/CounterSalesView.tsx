import React, { useState } from 'react';
import { Trip, Currency, Booking, Passenger } from '../types';
import { formatPrice } from '../utils/currency';
import { saveBooking } from '../utils/storage';
import { saveBookingToCloud } from '../services/firestoreSync';
import { 
  Building2, 
  Printer, 
  CheckCircle, 
  Banknote, 
  Smartphone, 
  User, 
  MapPin, 
  Calendar, 
  Ticket 
} from 'lucide-react';

interface CounterSalesViewProps {
  trips: Trip[];
  currency: Currency;
  onOpenTicket: (booking: Booking) => void;
}

export const CounterSalesView: React.FC<CounterSalesViewProps> = ({
  trips,
  currency,
  onOpenTicket,
}) => {
  const [selectedTripId, setSelectedTripId] = useState<string>(trips[0]?.id || '');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [idNumber, setIdNumber] = useState<string>('');
  const [seatNumber, setSeatNumber] = useState<string>('04A');
  const [paymentMode, setPaymentMode] = useState<'cash_counter' | 'orange_money' | 'wave'>('cash_counter');
  const [issuedBooking, setIssuedBooking] = useState<Booking | null>(null);

  const selectedTrip = trips.find((t) => t.id === selectedTripId) || trips[0];

  const handleIssueTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !idNumber) {
      alert('Veuillez renseigner le prénom, nom et le numéro de pièce du voyageur.');
      return;
    }

    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const pnr = `GCH-${randomSuffix}-${selectedTrip.originCity.substring(0, 3).toUpperCase()}`;

    const passenger: Passenger = {
      firstName,
      lastName,
      phone: phone || '+223 70 00 00 00',
      idType: 'CARTE_NINA',
      idNumber,
      nationality: 'Malienne',
      seatNumber,
    };

    const newBooking: Booking = {
      id: `counter_${Date.now()}`,
      pnr,
      tripId: selectedTrip.id,
      trip: selectedTrip,
      passengers: [passenger],
      totalAmountXOF: selectedTrip.basePriceXOF,
      currency,
      paymentProvider: paymentMode,
      paymentStatus: 'completed',
      bookingDate: new Date().toISOString(),
      boardingStatus: 'not_boarded',
      verificationHash: `guichet_${randomSuffix}_${lastName.toLowerCase()}`,
      notes: 'Billet émis en guichet physique de gare.',
    };

    saveBooking(newBooking);
    saveBookingToCloud(newBooking).catch((err) => console.warn('Cloud sync error (local fallback preserved):', err));
    setIssuedBooking(newBooking);

    // Reset form
    setFirstName('');
    setLastName('');
    setIdNumber('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Station Terminal Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 mb-8 bg-slate-900 text-white shadow-sm">
        <img
          src="/src/assets/images/afriway_station_terminal_1792325150100.jpg"
          alt="Gare routière moderne avec quais et cars organisés"
          referrerPolicy="no-referrer"
          className="w-full h-48 sm:h-56 object-cover object-center opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent p-6 sm:p-8 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">
            <span>Guichet de Vente en Gare</span>
            <span aria-hidden="true">·</span>
            <span>Émission Express & Impression Thermique</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Vente Directe aux Voyageurs Présents
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
            Pour les passagers sans smartphone ou payant en espèces au guichet : émission instantanée de tickets avec QR code et impression du reçu de voyage.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Ticket Issuing */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-emerald-800" />
            <span>Formulaire d'Émission Guichet</span>
          </h3>

          <form onSubmit={handleIssueTicket} className="space-y-4 text-xs">
            {/* Select Active Trip Departure */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Choisir le car & horaire de départ :
              </label>
              <select
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs focus:ring-2 focus:ring-emerald-700"
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.departureTime} — {t.originCity} ➔ {t.destinationCity} ({t.companyName}) · {formatPrice(t.basePriceXOF, currency)}
                  </option>
                ))}
              </select>
            </div>

            {/* Passenger Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Prénom du passager *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ex: Bakary"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Nom de famille *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ex: Keita"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Téléphone (Optionnel)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+223 70 00 00 00"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Numéro de pièce (CNI/NINA) *</label>
                <input
                  type="text"
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="Ex: ML-NINA-2001-921"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Siège attribué</label>
                <input
                  type="text"
                  required
                  value={seatNumber}
                  onChange={(e) => setSeatNumber(e.target.value)}
                  placeholder="Ex: 04A"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-emerald-900 font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Encaissement</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('cash_counter')}
                    className={`p-2 rounded-lg border text-center font-semibold cursor-pointer ${
                      paymentMode === 'cash_counter'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-600'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Espèces (Cash)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('orange_money')}
                    className={`p-2 rounded-lg border text-center font-semibold cursor-pointer ${
                      paymentMode === 'orange_money'
                        ? 'bg-orange-100 text-orange-900 border-orange-600'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    OM / Wave
                  </button>
                </div>
              </div>
            </div>

            {/* Total and Submit */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px]">Prix du billet :</span>
                <span className="text-xl font-black text-emerald-900 font-mono">
                  {formatPrice(selectedTrip.basePriceXOF, currency)}
                </span>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Encaisser & Émettre le Ticket</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Last Issued Ticket Preview / Receipt */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
              <span>Dernier Ticket Émis au Guichet</span>
              {issuedBooking && (
                <span className="text-emerald-700 font-mono font-semibold">
                  {issuedBooking.pnr}
                </span>
              )}
            </h4>

            {issuedBooking ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-4 space-y-3 font-mono text-xs">
                <div className="text-center border-b border-slate-200 pb-2">
                  <div className="font-black text-sm text-slate-900">AFRIWAY BILLETTERIE GARE</div>
                  <div className="text-[10px] text-slate-500">SOGONIKO TERMINAL BAMAKO</div>
                  <div className="text-[11px] font-bold text-emerald-900 mt-1">PNR: {issuedBooking.pnr}</div>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>LIGNE:</span>
                    <span className="font-bold">{issuedBooking.trip.originCity} ➔ {issuedBooking.trip.destinationCity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DÉPART:</span>
                    <span>{issuedBooking.trip.departureDate} à {issuedBooking.trip.departureTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VOYAGEUR:</span>
                    <span className="font-bold">{issuedBooking.passengers[0].firstName} {issuedBooking.passengers[0].lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SIÈGE:</span>
                    <span className="font-black text-emerald-800 text-xs">{issuedBooking.passengers[0].seatNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PAIEMENT:</span>
                    <span>ESPÈCES REÇUES</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                    <span>TOTAL:</span>
                    <span>{formatPrice(issuedBooking.totalAmountXOF, currency)}</span>
                  </div>
                </div>

                <div className="pt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onOpenTicket(issuedBooking)}
                    className="col-span-2 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold text-center cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Afficher & Envoyer le Billet (PDF, WhatsApp, Snap, Email)</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimer Reçu</span>
                  </button>
                  <button
                    onClick={() => {
                      const text = `🚌 *BILLET GUICHET AFRIWAY*\nPNR : ${issuedBooking.pnr}\nTrajet : ${issuedBooking.trip.originCity} ➔ ${issuedBooking.trip.destinationCity}\nDépart : ${issuedBooking.trip.departureDate} à ${issuedBooking.trip.departureTime}\nVoyageur : ${issuedBooking.passengers[0].firstName} ${issuedBooking.passengers[0].lastName}\nSiège : ${issuedBooking.passengers[0].seatNumber}\nLien : ${window.location.href}`;
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="py-1.5 px-3 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                Aucun ticket n'a encore été émis lors de cette session de guichet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
