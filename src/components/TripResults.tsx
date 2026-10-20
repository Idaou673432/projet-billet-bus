import React, { useState } from 'react';
import { Trip, Currency, Language } from '../types';
import { formatPrice } from '../utils/currency';
import { getCompanyById } from '../utils/storage';
import { DEFAULT_COMPANY_LOGOS } from '../utils/companyLogos';
import { 
  Wifi, 
  Wind, 
  Zap, 
  Tv, 
  Clock, 
  MapPin, 
  Info, 
  ArrowRight, 
  ShieldAlert, 
  Bus
} from 'lucide-react';

interface TripResultsProps {
  trips: Trip[];
  currency: Currency;
  language: Language;
  onSelectTrip: (trip: Trip) => void;
  originCity: string;
  destinationCity: string;
}

export const TripResults: React.FC<TripResultsProps> = ({
  trips,
  currency,
  onSelectTrip,
  originCity,
  destinationCity,
}) => {
  const [filterClass, setFilterClass] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'departure' | 'price' | 'duration'>('departure');

  // Filter trips
  const filtered = trips.filter((t) => {
    if (filterClass !== 'all' && t.busClass !== filterClass) return false;
    
    if (timeFilter !== 'all') {
      const hour = parseInt(t.departureTime.split(':')[0], 10);
      if (timeFilter === 'morning' && (hour < 5 || hour >= 12)) return false;
      if (timeFilter === 'afternoon' && (hour < 12 || hour >= 18)) return false;
      if (timeFilter === 'night' && hour < 18) return false;
    }

    return true;
  });

  // Sort trips
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price') return a.basePriceXOF - b.basePriceXOF;
    if (sortBy === 'duration') return (a.durationHours * 60 + a.durationMinutes) - (b.durationHours * 60 + b.durationMinutes);
    return a.departureTime.localeCompare(b.departureTime);
  });

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case 'wifi':
        return <span key="wifi" className="flex items-center gap-1 text-slate-600" title="Wifi Starlink à bord"><Wifi className="w-3.5 h-3.5" /> Wifi</span>;
      case 'ac':
        return <span key="ac" className="flex items-center gap-1 text-slate-600" title="Climatisation intégrale"><Wind className="w-3.5 h-3.5" /> Climatisation</span>;
      case 'usb':
        return <span key="usb" className="flex items-center gap-1 text-slate-600" title="Prises USB individuelles"><Zap className="w-3.5 h-3.5" /> Prises USB</span>;
      case 'tv':
        return <span key="tv" className="flex items-center gap-1 text-slate-600" title="Écran multimédia"><Tv className="w-3.5 h-3.5" /> TV</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header and Results Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Trajets disponibles</span>
            <span aria-hidden="true">·</span>
            <span>{originCity} ➔ {destinationCity}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-emerald-800 font-mono tabular-nums">{filtered.length} départs trouvés</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Choisissez votre départ
          </h2>
        </div>

        {/* Filter Toolbar (Segmented Controls) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Class Filter */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setFilterClass('all')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filterClass === 'all' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterClass('vip')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filterClass === 'vip' ? 'bg-white text-emerald-800 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              VIP Climatisé
            </button>
            <button
              onClick={() => setFilterClass('standard')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filterClass === 'standard' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Standard
            </button>
          </div>

          {/* Time Filter */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                timeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Toute heure
            </button>
            <button
              onClick={() => setTimeFilter('morning')}
              className={`px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                timeFilter === 'morning' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Matin (05h-12h)
            </button>
            <button
              onClick={() => setTimeFilter('afternoon')}
              className={`px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                timeFilter === 'afternoon' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Après-midi
            </button>
          </div>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
          >
            <option value="departure">Trier : Heure de départ</option>
            <option value="price">Trier : Prix le plus bas</option>
            <option value="duration">Trier : Trajet le plus rapide</option>
          </select>
        </div>
      </div>

      {/* Trips List */}
      {sorted.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center my-8">
          <Bus className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800">Aucun départ trouvé pour ces critères</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
            Essayez de réinitialiser vos filtres d'horaire ou consultez nos lignes principales (ex: Bamako ➔ Sikasso, Bamako ➔ Abidjan).
          </p>
          <button
            onClick={() => {
              setFilterClass('all');
              setTimeFilter('all');
            }}
            className="px-4 py-2 bg-emerald-800 text-white text-xs font-medium rounded-lg hover:bg-emerald-900 transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {sorted.map((trip) => {
            return (
              <div
                key={trip.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-600/60 transition-all p-5 shadow-xs hover:shadow-md"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                  {/* Column 1: Company & Class Metadata */}
                  <div className="lg:col-span-3">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const comp = getCompanyById(trip.companyId);
                        const logo = comp?.logoUrl || DEFAULT_COMPANY_LOGOS[trip.companyId];
                        return logo ? (
                          <div className="h-12 w-20 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center p-1 shrink-0">
                            <img src={logo} alt={trip.companyName} className="max-h-full max-w-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-base tracking-wider shrink-0 shadow-xs">
                            {trip.companyName.split(' ')[0].substring(0, 3).toUpperCase()}
                          </div>
                        );
                      })()}
                      <div>
                        <h4 className="font-bold text-slate-900 text-base leading-tight">
                          {trip.companyName}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <span className="font-medium text-emerald-800">
                            {trip.busClass === 'vip' ? 'Classe VIP' : trip.busClass === 'express_direct' ? 'Express Direct' : 'Classe Standard'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate max-w-[130px]">{trip.busModel}</span>
                        </div>
                      </div>
                    </div>

                    {/* Available seats notice */}
                    <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
                      <span className="font-semibold text-emerald-700 font-mono tabular-nums">
                        {trip.availableSeats} places
                      </span>
                      <span>restantes sur {trip.totalSeats}</span>
                    </div>
                  </div>

                  {/* Column 2: Departure, Journey Duration & Arrival */}
                  <div className="lg:col-span-5">
                    <div className="flex items-center justify-between gap-4">
                      {/* Departure */}
                      <div className="text-left min-w-[90px]">
                        <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
                          {trip.departureTime}
                        </span>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5 truncate max-w-[130px]" title={trip.originStationName}>
                          {trip.originCity}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[130px]" title={trip.originStationName}>
                          {trip.originStationName.split('(')[0]}
                        </p>
                      </div>

                      {/* Travel Trajectory Line */}
                      <div className="flex-1 flex flex-col items-center px-2">
                        <div className="text-[11px] font-medium text-slate-500 mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{trip.durationHours}h{trip.durationMinutes > 0 ? `${trip.durationMinutes}` : '00'}</span>
                          <span aria-hidden="true">·</span>
                          <span>{trip.distanceKm} km</span>
                        </div>
                        <div className="w-full flex items-center">
                          <div className="w-2 h-2 rounded-full bg-emerald-700 shrink-0" />
                          <div className="h-[2px] flex-1 bg-slate-200 relative">
                            {trip.isCrossBorder && (
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded border border-amber-300 whitespace-nowrap">
                                Frontière
                              </div>
                            )}
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 -ml-1" />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1">Direct sans escale</span>
                      </div>

                      {/* Arrival */}
                      <div className="text-right min-w-[90px]">
                        <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
                          {trip.arrivalTime}
                        </span>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5 truncate max-w-[130px]" title={trip.destinationStationName}>
                          {trip.destinationCity}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[130px]" title={trip.destinationStationName}>
                          {trip.destinationStationName.split('(')[0]}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Price & Action CTA */}
                  <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between lg:justify-center gap-3 pt-3 lg:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left lg:text-right">
                      <div className="text-2xl sm:text-3xl font-black text-emerald-900 font-mono tabular-nums">
                        {formatPrice(trip.basePriceXOF, currency)}
                      </div>
                      <p className="text-[11px] text-slate-500">Par passager, taxes et bagages inclus</p>
                    </div>

                    <button
                      onClick={() => onSelectTrip(trip)}
                      className="w-full sm:w-auto px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      Choisir mon siège
                    </button>
                  </div>
                </div>

                {/* Amenities & Cross-Border Advisory strip */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  {/* Amenities */}
                  <div className="flex flex-wrap items-center gap-4">
                    {trip.amenities.map((a) => getAmenityIcon(a))}
                    <span className="text-slate-400 text-[11px]">25 kg bagage soute inclus</span>
                  </div>

                  {/* Cross-Border Advice */}
                  {trip.isCrossBorder ? (
                    <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md text-[11px] font-medium border border-amber-200">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>Formalités frontière : Carte CEDEAO ou Passeport + Carnet jaune requis</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                      <span>{trip.cancellationPolicy}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
