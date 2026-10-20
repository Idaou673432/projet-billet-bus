import React, { useState } from 'react';
import { Trip, Currency, BusSeat } from '../types';
import { generateBusSeats } from '../data/mockData';
import { formatPrice } from '../utils/currency';
import { X, Check, ArrowRight, ShieldCheck, Armchair } from 'lucide-react';

interface SeatSelectorModalProps {
  trip: Trip;
  passengerCount: number;
  currency: Currency;
  onClose: () => void;
  onConfirmSeats: (selectedSeats: string[]) => void;
}

export const SeatSelectorModal: React.FC<SeatSelectorModalProps> = ({
  trip,
  passengerCount,
  currency,
  onClose,
  onConfirmSeats,
}) => {
  // Generate seats once based on trip class
  const [seats] = useState<BusSeat[]>(() => generateBusSeats(trip.totalSeats, trip.busClass));
  const [selectedSeatNumbers, setSelectedSeatNumbers] = useState<string[]>([]);

  const handleSeatClick = (seat: BusSeat) => {
    if (seat.status === 'occupied') return;

    if (selectedSeatNumbers.includes(seat.number)) {
      setSelectedSeatNumbers(selectedSeatNumbers.filter((n) => n !== seat.number));
    } else {
      if (selectedSeatNumbers.length < passengerCount) {
        setSelectedSeatNumbers([...selectedSeatNumbers, seat.number]);
      } else {
        // If already selected max, replace first selected
        setSelectedSeatNumbers([...selectedSeatNumbers.slice(1), seat.number]);
      }
    }
  };

  const totalPrice = selectedSeatNumbers.length * trip.basePriceXOF;
  const isComplete = selectedSeatNumbers.length === passengerCount;

  // Group seats by row for authentic bus aisle layout
  const rowsMap = new Map<number, BusSeat[]>();
  seats.forEach((seat) => {
    const r = rowsMap.get(seat.row) || [];
    r.push(seat);
    rowsMap.set(seat.row, r);
  });
  const rowNumbers = Array.from(rowsMap.keys()).sort((a, b) => a - b);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{trip.companyName}</span>
              <span aria-hidden="true">·</span>
              <span>{trip.originCity} ➔ {trip.destinationCity}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-emerald-800">{trip.departureTime}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Sélectionnez vos places dans le car
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8 max-h-[75vh] overflow-y-auto">
          {/* Left Column: Authentic Bus Deck Plan */}
          <div className="md:col-span-7 flex flex-col items-center">
            {/* Legend */}
            <div className="flex items-center justify-center gap-5 text-xs text-slate-600 mb-6 bg-slate-100 p-2.5 rounded-xl w-full">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-white border border-slate-300 shadow-xs" />
                <span>Libre</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                  <Check className="w-3 h-3" />
                </div>
                <span>Votre choix</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-slate-300 text-slate-500 flex items-center justify-center text-[10px]">
                  ✕
                </div>
                <span>Déjà réservé</span>
              </div>
            </div>

            {/* Bus Deck Frame */}
            <div className="w-full max-w-[340px] bg-slate-100 rounded-3xl p-5 border-2 border-slate-300 relative shadow-inner">
              {/* Bus Front Cap (Windshield / Driver cabin) */}
              <div className="pb-4 mb-4 border-b-2 border-dashed border-slate-300 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5 bg-slate-200 px-3 py-1.5 rounded-lg font-medium text-[11px]">
                  <span>Poste Conducteur</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Avant du Car ➔
                </div>
                <div className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded">
                  Porte d'accès
                </div>
              </div>

              {/* Rows Layout */}
              <div className="space-y-2.5">
                {rowNumbers.map((rNum) => {
                  const rowSeats = rowsMap.get(rNum) || [];
                  const leftSeats = rowSeats.filter((s) => s.column <= 2);
                  const rightSeats = rowSeats.filter((s) => s.column >= 3);

                  return (
                    <div key={`row_${rNum}`} className="flex items-center justify-between gap-4">
                      {/* Left seats pair (A, B) */}
                      <div className="flex items-center gap-1.5">
                        {leftSeats.map((seat) => {
                          const isSelected = selectedSeatNumbers.includes(seat.number);
                          const isOccupied = seat.status === 'occupied';

                          return (
                            <button
                              key={seat.id}
                              type="button"
                              disabled={isOccupied}
                              onClick={() => handleSeatClick(seat)}
                              className={`w-9 h-9 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center cursor-pointer ${
                                isOccupied
                                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300'
                                  : isSelected
                                  ? 'bg-emerald-800 text-white shadow-md scale-105 ring-2 ring-emerald-500 ring-offset-1'
                                  : 'bg-white hover:bg-emerald-50 text-slate-800 border border-slate-300 shadow-xs hover:border-emerald-600'
                              }`}
                              title={`Siège ${seat.number} ${isOccupied ? '(Occupé)' : '(Disponible)'}`}
                            >
                              {seat.number}
                            </button>
                          );
                        })}
                      </div>

                      {/* Central Walking Aisle */}
                      <div className="w-5 text-center text-[10px] text-slate-300 font-mono select-none">
                        ·
                      </div>

                      {/* Right seats pair (C, D) or single for VIP */}
                      <div className="flex items-center gap-1.5">
                        {rightSeats.map((seat) => {
                          const isSelected = selectedSeatNumbers.includes(seat.number);
                          const isOccupied = seat.status === 'occupied';

                          return (
                            <button
                              key={seat.id}
                              type="button"
                              disabled={isOccupied}
                              onClick={() => handleSeatClick(seat)}
                              className={`w-9 h-9 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center cursor-pointer ${
                                isOccupied
                                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300'
                                  : isSelected
                                  ? 'bg-emerald-800 text-white shadow-md scale-105 ring-2 ring-emerald-500 ring-offset-1'
                                  : 'bg-white hover:bg-emerald-50 text-slate-800 border border-slate-300 shadow-xs hover:border-emerald-600'
                              }`}
                              title={`Siège ${seat.number} ${isOccupied ? '(Occupé)' : '(Disponible)'}`}
                            >
                              {seat.number}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rear of bus */}
              <div className="mt-4 pt-3 border-t-2 border-dashed border-slate-300 text-center text-[11px] text-slate-400 font-medium">
                Arrière du car · Toilettes & Issue de secours
              </div>
            </div>
          </div>

          {/* Right Column: Cabin comfort photo & Price Summary */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Comfort Photo Preview */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 relative group">
                <img
                  src="/src/assets/images/afriway_seat_interior_1792325148754.jpg"
                  alt="Intérieur car VIP climatisé avec sièges confortables"
                  referrerPolicy="no-referrer"
                  className="w-full h-36 object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-3">
                  <div className="text-white">
                    <p className="text-xs font-semibold">Cabine {trip.busModel}</p>
                    <p className="text-[11px] text-slate-300">Sièges ergonomiques avec accoudoirs et climatisation continue</p>
                  </div>
                </div>
              </div>

              {/* Selection Summary Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Récapitulatif de votre réservation
                </h4>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Nombre de voyageurs :</span>
                    <span className="font-semibold text-slate-900">{passengerCount} passager(s)</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Sièges sélectionnés :</span>
                    <span className="font-bold text-emerald-800 font-mono">
                      {selectedSeatNumbers.length > 0 ? selectedSeatNumbers.join(', ') : 'Aucun siège choisi'}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Prix unitaire :</span>
                    <span className="font-mono">{formatPrice(trip.basePriceXOF, currency)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">Total à régler :</span>
                  <span className="text-xl font-black text-emerald-900 font-mono tabular-nums">
                    {formatPrice(totalPrice, currency)}
                  </span>
                </div>
              </div>

              {/* Selection Instruction Message */}
              {!isComplete ? (
                <div className="bg-amber-50 text-amber-900 p-3 rounded-xl text-xs border border-amber-200 flex items-center gap-2">
                  <Armchair className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Veuillez sélectionner <strong>{passengerCount - selectedSeatNumbers.length}</strong> place(s) de plus pour continuer.
                  </span>
                </div>
              ) : (
                <div className="bg-emerald-50 text-emerald-900 p-3 rounded-xl text-xs border border-emerald-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Vos places sont temporairement bloquées pour la finalisation.</span>
                </div>
              )}
            </div>

            {/* Next Action Button */}
            <div className="pt-6 border-t border-slate-100">
              <button
                type="button"
                disabled={!isComplete}
                onClick={() => onConfirmSeats(selectedSeatNumbers)}
                className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                  isComplete
                    ? 'bg-emerald-800 hover:bg-emerald-900 text-white active:scale-[0.98]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <span>Continuer vers les coordonnées passagers</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
