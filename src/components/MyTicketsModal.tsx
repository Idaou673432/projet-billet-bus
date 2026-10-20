import React, { useState } from 'react';
import { Booking, Currency } from '../types';
import { formatPrice } from '../utils/currency';
import { X, Search, Ticket, Calendar, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';

interface MyTicketsModalProps {
  bookings: Booking[];
  currency: Currency;
  onClose: () => void;
  onSelectBooking: (booking: Booking) => void;
}

export const MyTicketsModal: React.FC<MyTicketsModalProps> = ({
  bookings,
  currency,
  onClose,
  onSelectBooking,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = bookings.filter((b) => {
    const q = searchQuery.toLowerCase();
    const pnr = b.pnr.toLowerCase();
    const passengerName = b.passengers.map((p) => `${p.firstName} ${p.lastName}`).join(' ').toLowerCase();
    const city = `${b.trip.originCity} ${b.trip.destinationCity}`.toLowerCase();
    return pnr.includes(q) || passengerName.includes(q) || city.includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Portefeuille Voyageur</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-emerald-800">{bookings.length} billet(s) enregistré(s)</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Mes Billets de Car</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search filter input */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par référence PNR, nom de voyageur ou ville..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
        </div>

        {/* Bookings List */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Aucun billet trouvé correspondant à votre recherche.
            </div>
          ) : (
            filtered.map((booking) => (
              <div
                key={booking.id}
                onClick={() => onSelectBooking(booking)}
                className="bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 hover:border-emerald-600 p-4 transition-all cursor-pointer shadow-xs hover:shadow-md space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-emerald-900">{booking.pnr}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-slate-500 font-medium">{booking.trip.companyName}</span>
                  </div>

                  {booking.boardingStatus === 'boarded' ? (
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      Embarqué
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Valide
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {booking.trip.originCity} ➔ {booking.trip.destinationCity}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {booking.passengers.map((p) => `${p.firstName} ${p.lastName}`).join(', ')} · Siège(s) {booking.passengers.map((p) => p.seatNumber).join(', ')}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-slate-900 block">
                      {formatPrice(booking.totalAmountXOF, currency)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {booking.trip.departureDate} à {booking.trip.departureTime}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Payé via {booking.paymentProvider.toUpperCase()}</span>
                  <span className="text-emerald-800 font-semibold flex items-center gap-1">
                    <span>Afficher le QR Code</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
