import React, { useState } from 'react';
import { City, Country, Language, Currency } from '../types';
import { CITIES, COUNTRIES } from '../data/mockData';
import { t } from '../utils/i18n';
import { ArrowRightLeft, Calendar, MapPin, Users, Sparkles, ShieldCheck, Clock } from 'lucide-react';

interface HeroSearchProps {
  originCity: string;
  setOriginCity: (city: string) => void;
  destinationCity: string;
  setDestinationCity: (city: string) => void;
  travelDate: string;
  setTravelDate: (date: string) => void;
  passengerCount: number;
  setPassengerCount: (count: number) => void;
  tripType: 'one_way' | 'round_trip';
  setTripType: (type: 'one_way' | 'round_trip') => void;
  onSearch: () => void;
  language: Language;
  currency: Currency;
  slogan: string;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  originCity,
  setOriginCity,
  destinationCity,
  setDestinationCity,
  travelDate,
  setTravelDate,
  passengerCount,
  setPassengerCount,
  tripType,
  setTripType,
  onSearch,
  language,
  slogan,
}) => {
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('ALL');

  const filteredCities = selectedCountryFilter === 'ALL'
    ? CITIES
    : CITIES.filter((c) => c.countryCode === selectedCountryFilter);

  const swapCities = () => {
    const temp = originCity;
    setOriginCity(destinationCity);
    setDestinationCity(temp);
  };

  const setCorridor = (from: string, to: string) => {
    setOriginCity(from);
    setDestinationCity(to);
    onSearch();
  };

  return (
    <div className="relative bg-slate-900 text-white overflow-hidden">
      {/* Background Hero Image with Measured Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/afriway_modern_coach_bus_1792325148725.jpg"
          alt="Car grand confort voyageant sur les routes d'Afrique de l'Ouest"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center brightness-60 scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-900/60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pt-14 sm:pb-20">
        {/* Editorial Value Statement */}
        <div className="max-w-3xl mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 tracking-wider uppercase mb-3">
            <span>Réseau Panafricain de Billetterie Digitale</span>
            <span aria-hidden="true">·</span>
            <span>Mali & Afrique de l'Ouest</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white text-balance leading-tight">
            {slogan}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-200 text-balance leading-relaxed">
            {t('search_subtitle', language)}
          </p>
        </div>

        {/* Search Engine Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-7 text-slate-900 border border-slate-100">
          {/* Top Options Bar: Trip Type & Country Filter */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            {/* Trip Type Segmented Control */}
            <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setTripType('one_way')}
                className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  tripType === 'one_way'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aller simple
              </button>
              <button
                type="button"
                onClick={() => setTripType('round_trip')}
                className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  tripType === 'round_trip'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aller-retour
              </button>
            </div>

            {/* Country Selector Filter */}
            <div className="flex items-center gap-2 text-xs text-slate-500 overflow-x-auto py-1 max-w-full">
              <span className="font-medium text-slate-700 whitespace-nowrap">Marché cible :</span>
              <button
                type="button"
                onClick={() => setSelectedCountryFilter('ALL')}
                className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCountryFilter === 'ALL'
                    ? 'bg-emerald-100 text-emerald-900 font-semibold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Tous
              </button>
              {COUNTRIES.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => setSelectedCountryFilter(country.code)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                    selectedCountryFilter === country.code
                      ? 'bg-emerald-100 text-emerald-900 font-semibold'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 mt-5">
            {/* Origin City */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('from', language)}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-700">
                  <MapPin className="w-4 h-4" />
                </div>
                <select
                  value={originCity}
                  onChange={(e) => setOriginCity(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                >
                  {filteredCities.map((c) => (
                    <option key={`orig_${c.id}`} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Button (between origin and destination) */}
            <div className="hidden lg:flex lg:col-span-1 items-end justify-center pb-2">
              <button
                type="button"
                onClick={swapCities}
                title="Inverser les villes"
                className="p-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4 text-emerald-800" />
              </button>
            </div>

            {/* Destination City */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('to', language)}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-700">
                  <MapPin className="w-4 h-4" />
                </div>
                <select
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                >
                  {filteredCities.map((c) => (
                    <option key={`dest_${c.id}`} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Departure Date */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('date', language)}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  value={travelDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Passenger Count */}
            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 truncate">
                {t('passengers', language)}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
                  <Users className="w-4 h-4" />
                </div>
                <select
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(Number(e.target.value))}
                  className="w-full pl-8 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Submit CTA */}
            <div className="lg:col-span-2 flex items-end">
              <button
                type="button"
                onClick={onSearch}
                className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer h-[42px]"
              >
                <span>{t('search_btn', language)}</span>
              </button>
            </div>
          </div>

          {/* Popular Corridors Quick Shortcuts */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">Corridors Fréquents :</span>
            <button
              type="button"
              onClick={() => setCorridor('Bamako', 'Sikasso')}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 transition-colors cursor-pointer"
            >
              Bamako ➔ Sikasso (ML)
            </button>
            <button
              type="button"
              onClick={() => setCorridor('Bamako', 'Abidjan')}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 transition-colors cursor-pointer"
            >
              Bamako ➔ Abidjan (Corridor International)
            </button>
            <button
              type="button"
              onClick={() => setCorridor('Bamako', 'Dakar')}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 transition-colors cursor-pointer"
            >
              Bamako ➔ Dakar (Sénégal)
            </button>
            <button
              type="button"
              onClick={() => setCorridor('Abidjan', 'Bouaké')}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 transition-colors cursor-pointer"
            >
              Abidjan ➔ Bouaké (CI)
            </button>
          </div>
        </div>

        {/* 3 Pillars of Trust Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-6 border-t border-slate-800/80">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-700/40 flex items-center justify-center shrink-0 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Compagnies Officielles Agréées</h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Partenariats directs avec Nour, Bani, SONEF, ATT. Tarifs officiels sans surcoût gare.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-900/40 border border-amber-700/40 flex items-center justify-center shrink-0 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Mobile Money Sans Déplacement</h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Payez par Orange Money, Wave ou Moov depuis chez vous et recevez votre billet par SMS/WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900/40 border border-blue-700/40 flex items-center justify-center shrink-0 text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Embarquement Garanti par QR Code</h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Votre place est réservée nominativement. Présentation directe du téléphone au quai de la gare.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
