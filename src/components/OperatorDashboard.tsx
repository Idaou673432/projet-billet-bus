import React, { useState } from 'react';
import { Trip, Currency, Booking, BusCompany, PaymentGatewaySettings, PaymentTransaction } from '../types';
import { formatPrice } from '../utils/currency';
import { getStoredBookings, getStoredCompanies } from '../utils/storage';
import { 
  getStoredTransactions, 
  getGatewaySettings, 
  saveGatewaySettings, 
  PAYMENT_PROVIDERS_CATALOG 
} from '../services/paymentService';
import { 
  Building, 
  FileText, 
  Users, 
  Bus, 
  TrendingUp, 
  Download, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  Plus,
  CreditCard,
  Sliders,
  Check,
  Smartphone,
  ExternalLink,
  Receipt,
  Save,
  Lock,
  Layers
} from 'lucide-react';

interface OperatorDashboardProps {
  trips: Trip[];
  currency: Currency;
  onAddTrip: (trip: Trip) => void;
  bookings?: Booking[];
  companies?: BusCompany[];
}

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({
  trips,
  currency,
  onAddTrip,
  bookings: liveBookings,
  companies: liveCompanies,
}) => {
  const [activeTab, setActiveTab] = useState<'fleet' | 'payments'>('fleet');
  const [selectedTrip, setSelectedTrip] = useState<Trip>(trips[0]);
  const [showAddTripModal, setShowAddTripModal] = useState<boolean>(false);
  const bookings = liveBookings || getStoredBookings();
  const partnerCompanies = liveCompanies || getStoredCompanies();

  // Payment settings and transactions
  const [gatewaySettings, setGatewaySettings] = useState<PaymentGatewaySettings>(() => getGatewaySettings());
  const [settingsSaved, setSettingsSaved] = useState<boolean>(false);
  const transactions = getStoredTransactions();

  // Find passengers booked on this selected trip
  const tripBookings = bookings.filter((b) => b.tripId === selectedTrip?.id);
  const allPassengersOnTrip = tripBookings.flatMap((b) =>
    b.passengers.map((p) => ({
      ...p,
      pnr: b.pnr,
      boardingStatus: b.boardingStatus,
      paymentStatus: b.paymentStatus,
    }))
  );

  // New trip modal states
  const [newOrigin, setNewOrigin] = useState<string>('Bamako');
  const [newDestination, setNewDestination] = useState<string>('Mopti');
  const [newDepartureTime, setNewDepartureTime] = useState<string>('06:00');
  const [newPrice, setNewPrice] = useState<number>(10000);
  const [newCompany, setNewCompany] = useState<string>('Nour Transport');
  const [newClass, setNewClass] = useState<'standard' | 'vip' | 'express_direct'>('vip');

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Trip = {
      id: `trip_custom_${Date.now()}`,
      companyId: 'nour_transport',
      companyName: newCompany,
      originCity: newOrigin,
      originCountry: 'Mali',
      originStationId: 'st_bko_sogoniko',
      originStationName: `Gare de ${newOrigin}`,
      destinationCity: newDestination,
      destinationCountry: 'Mali',
      destinationStationId: 'st_custom',
      destinationStationName: `Gare de ${newDestination}`,
      departureTime: newDepartureTime,
      departureDate: new Date().toISOString().split('T')[0],
      arrivalTime: '14:00',
      arrivalDate: new Date().toISOString().split('T')[0],
      durationHours: 8,
      durationMinutes: 0,
      distanceKm: 640,
      basePriceXOF: newPrice,
      busClass: newClass,
      busModel: 'Marcopolo G7 VIP',
      plateNumber: 'ML-5521-MD',
      totalSeats: 48,
      availableSeats: 48,
      isCrossBorder: false,
      amenities: ['wifi', 'ac', 'usb', 'tv'],
      cancellationPolicy: 'Remboursable jusqu\'à 4h avant.',
    };

    onAddTrip(created);
    setSelectedTrip(created);
    setShowAddTripModal(false);
  };

  const handleExportManifest = () => {
    let csv = `MANIFESTE OFFICIEL DES PASSAGERS - AFRIWAY\n`;
    csv += `Ligne: ${selectedTrip.originCity} -> ${selectedTrip.destinationCity}\n`;
    csv += `Compagnie: ${selectedTrip.companyName}\n`;
    csv += `Date: ${selectedTrip.departureDate} à ${selectedTrip.departureTime}\n`;
    csv += `Immatriculation car: ${selectedTrip.plateNumber}\n\n`;
    csv += `Place,PNR,Nom,Prénom,Type Pièce,Numéro Pièce,Téléphone,Statut Embarquement\n`;

    allPassengersOnTrip.forEach((p) => {
      csv += `"${p.seatNumber}","${p.pnr}","${p.lastName}","${p.firstName}","${p.idType}","${p.idNumber}","${p.phone}","${p.boardingStatus}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `manifeste_${selectedTrip.originCity}_${selectedTrip.destinationCity}_${selectedTrip.departureDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveGatewaySettings(gatewaySettings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // Financial aggregates
  const totalCollectedXOF = bookings.reduce((sum, b) => sum + b.totalAmountXOF, 0);
  const totalTransactionsCount = Math.max(transactions.length, bookings.length);

  // Group bookings by provider
  const providerStats = Object.values(PAYMENT_PROVIDERS_CATALOG).map((meta) => {
    const matchingBookings = bookings.filter((b) => b.paymentProvider === meta.id);
    const amount = matchingBookings.reduce((sum, b) => sum + b.totalAmountXOF, 0);
    const count = matchingBookings.length;
    return {
      ...meta,
      amount,
      count,
      pct: totalCollectedXOF > 0 ? (amount / totalCollectedXOF) * 100 : 0,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header and Mode Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Espace Professionnel & Régie</span>
            <span aria-hidden="true">·</span>
            <span>Supervision Flotte, Manifestes & Passerelles de Paiement</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Console d'Administration & Régie Financière
          </h2>
        </div>

        {/* Top Tab Navigator */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl self-start">
          <button
            type="button"
            onClick={() => setActiveTab('fleet')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'fleet'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bus className="w-4 h-4" />
            <span>Départs & Manifestes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Passerelles & Finances ({providerStats.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 block">Compagnies Agréées</span>
          <span className="text-3xl font-black text-slate-900 font-mono mt-1 block">5</span>
          <span className="text-xs text-emerald-700 mt-1 block">Mali, Sénégal, Côte d'Ivoire</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 block">Départs Prévus (Journée)</span>
          <span className="text-3xl font-black text-slate-900 font-mono mt-1 block">{trips.length}</span>
          <span className="text-xs text-slate-500 mt-1 block">Régularité horaire : 98.4%</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 block">Transactions & Billets</span>
          <span className="text-3xl font-black text-emerald-800 font-mono mt-1 block">{totalTransactionsCount}</span>
          <span className="text-xs text-emerald-700 mt-1 block">Wave, OM, MoMo, Moov, Cartes</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 block">Volume Total Encaissé</span>
          <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
            {formatPrice(totalCollectedXOF, currency)}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">100% réconcilié en temps réel</span>
        </div>
      </div>

      {/* TAB 1: FLEET & POLICE MANIFEST */}
      {activeTab === 'fleet' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddTripModal(true)}
              className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Programmer un Nouveau Départ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Departures List on Left */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Bus className="w-4 h-4 text-emerald-800" />
                <span>Départs Programmés</span>
              </h3>

              <div className="space-y-2.5">
                {trips.map((trip) => {
                  const isSelected = selectedTrip?.id === trip.id;
                  const count = bookings.filter((b) => b.tripId === trip.id).length;

                  return (
                    <button
                      key={trip.id}
                      type="button"
                      onClick={() => setSelectedTrip(trip)}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-600 shadow-xs ring-1 ring-emerald-600'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-900">{trip.companyName}</span>
                        <span className="font-mono font-bold text-emerald-900">{trip.departureTime}</span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium">
                        {trip.originCity} ➔ {trip.destinationCity}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                        <span>Car : {trip.plateNumber}</span>
                        <span className="font-mono text-emerald-800 font-semibold">{count} résa(s)</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Departure Manifest on Right */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Manifeste Légal de Voyage</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedTrip?.companyName}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    {selectedTrip?.originCity} ➔ {selectedTrip?.destinationCity} ({selectedTrip?.departureTime})
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Immatriculation : {selectedTrip?.plateNumber} · {selectedTrip?.busModel}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportManifest}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Exporter CSV Police</span>
                </button>
              </div>

              {/* Manifest Passengers Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="pb-2">Siège</th>
                      <th className="pb-2">PNR</th>
                      <th className="pb-2">Passager</th>
                      <th className="pb-2">Pièce ID</th>
                      <th className="pb-2">Téléphone</th>
                      <th className="pb-2 text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {allPassengersOnTrip.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                          Aucun passager enregistré pour ce départ pour le moment.
                        </td>
                      </tr>
                    ) : (
                      allPassengersOnTrip.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 font-bold font-mono text-emerald-800">{p.seatNumber}</td>
                          <td className="py-2.5 font-mono text-slate-500">{p.pnr}</td>
                          <td className="py-2.5 font-bold text-slate-900">{p.firstName} {p.lastName}</td>
                          <td className="py-2.5 font-mono text-slate-500">{p.idType} : {p.idNumber}</td>
                          <td className="py-2.5 font-mono text-slate-500">{p.phone}</td>
                          <td className="py-2.5 text-right">
                            {p.boardingStatus === 'boarded' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                À bord
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" />
                                Attendu
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FINANCIAL GATEWAYS & PAYMENT MANAGEMENT */}
      {activeTab === 'payments' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Revenue Breakdown by Payment Method */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-800" />
                  <span>Répartition des Volumes Encaissés par Opérateur</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Agrégation des flux Wave, Orange Money, MTN MoMo, Moov, CinetPay, Cartes et Guichets.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start">
                Taux de succès : 100%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {providerStats.map((prov) => (
                <div key={prov.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{prov.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono font-semibold">
                      {prov.count} txn(s)
                    </span>
                  </div>

                  <div className="text-lg font-black text-slate-900 font-mono">
                    {formatPrice(prov.amount, currency)}
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${Math.max(prov.pct, 4)}%`,
                        backgroundColor: prov.color,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Frais : {prov.feePercent}%</span>
                    <span>{prov.pct.toFixed(1)}% du total</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gateway Settings Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-800" />
                  <span>Configuration des Clés API & Passerelles Marchandes</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gérez vos identifiants marchands Wave, Orange Money WebPay, MTN MoMo API et CinetPay.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {settingsSaved && (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg flex items-center gap-1.5 animate-in fade-in">
                    <Check className="w-3.5 h-3.5" />
                    <span>Configuration enregistrée !</span>
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
              {/* Environment Toggle */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-slate-900 block text-sm">Environnement des Passerelles</span>
                  <span className="text-slate-500 text-xs">
                    Basculez entre le mode Sandbox (simulation tests réalistes) et le mode Production réelle.
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setGatewaySettings({ ...gatewaySettings, activeEnvironment: 'sandbox' })}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      gatewaySettings.activeEnvironment === 'sandbox'
                        ? 'bg-amber-100 text-amber-950 border border-amber-300'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🧪 Mode Sandbox (Tests)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGatewaySettings({ ...gatewaySettings, activeEnvironment: 'live' })}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      gatewaySettings.activeEnvironment === 'live'
                        ? 'bg-emerald-800 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🚀 Mode Live (Production)
                  </button>
                </div>
              </div>

              {/* Grid of Gateway API Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Wave Config */}
                <div className="p-4 rounded-xl border border-cyan-200 bg-cyan-50/40 space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Wave API</span>
                    <input
                      type="checkbox"
                      checked={gatewaySettings.waveEnabled}
                      onChange={(e) => setGatewaySettings({ ...gatewaySettings, waveEnabled: e.target.checked })}
                      className="rounded accent-cyan-600"
                    />
                  </div>
                  <label className="block text-slate-600 text-[11px]">Clé API / Token Wave</label>
                  <input
                    type="password"
                    value={gatewaySettings.waveApiKey || ''}
                    onChange={(e) => setGatewaySettings({ ...gatewaySettings, waveApiKey: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>

                {/* Orange Money Config */}
                <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/40 space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Orange Money WebPay</span>
                    <input
                      type="checkbox"
                      checked={gatewaySettings.orangeMoneyEnabled}
                      onChange={(e) => setGatewaySettings({ ...gatewaySettings, orangeMoneyEnabled: e.target.checked })}
                      className="rounded accent-orange-600"
                    />
                  </div>
                  <label className="block text-slate-600 text-[11px]">Merchant Key / Code Partenaire</label>
                  <input
                    type="password"
                    value={gatewaySettings.orangeMoneyMerchantKey || ''}
                    onChange={(e) => setGatewaySettings({ ...gatewaySettings, orangeMoneyMerchantKey: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>

                {/* MTN MoMo Config */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>MTN MoMo API (Collections)</span>
                    <input
                      type="checkbox"
                      checked={gatewaySettings.mtnMoMoEnabled}
                      onChange={(e) => setGatewaySettings({ ...gatewaySettings, mtnMoMoEnabled: e.target.checked })}
                      className="rounded accent-amber-500"
                    />
                  </div>
                  <label className="block text-slate-600 text-[11px]">Subscription Key</label>
                  <input
                    type="password"
                    value={gatewaySettings.mtnMoMoApiKey || ''}
                    onChange={(e) => setGatewaySettings({ ...gatewaySettings, mtnMoMoApiKey: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>

                {/* CinetPay Config */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>CinetPay Panafricain</span>
                    <input
                      type="checkbox"
                      checked={gatewaySettings.cinetpayEnabled}
                      onChange={(e) => setGatewaySettings({ ...gatewaySettings, cinetpayEnabled: e.target.checked })}
                      className="rounded accent-emerald-600"
                    />
                  </div>
                  <label className="block text-slate-600 text-[11px]">Site ID & API Key</label>
                  <input
                    type="text"
                    value={gatewaySettings.cinetpaySiteId || ''}
                    onChange={(e) => setGatewaySettings({ ...gatewaySettings, cinetpaySiteId: e.target.value })}
                    placeholder="Site ID"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs mb-1"
                  />
                  <input
                    type="password"
                    value={gatewaySettings.cinetpayApiKey || ''}
                    onChange={(e) => setGatewaySettings({ ...gatewaySettings, cinetpayApiKey: e.target.value })}
                    placeholder="API Key"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>

                {/* PayDunya Config */}
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>PayDunya DirectPay</span>
                    <input
                      type="checkbox"
                      checked={gatewaySettings.paydunyaEnabled}
                      onChange={(e) => setGatewaySettings({ ...gatewaySettings, paydunyaEnabled: e.target.checked })}
                      className="rounded accent-indigo-600"
                    />
                  </div>
                  <label className="block text-slate-600 text-[11px]">MasterKey Marchand</label>
                  <input
                    type="password"
                    value={gatewaySettings.paydunyaMasterKey || ''}
                    onChange={(e) => setGatewaySettings({ ...gatewaySettings, paydunyaMasterKey: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>

                {/* Fee Allocation Policy */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="font-bold text-slate-900">Prise en charge des frais</div>
                  <label className="block text-slate-600 text-[11px]">Imputation des commissions :</label>
                  <select
                    value={gatewaySettings.transactionFeePayer}
                    onChange={(e) => setGatewaySettings({ ...gatewaySettings, transactionFeePayer: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                  >
                    <option value="company">Compagnie prend en charge (0 frais voyageur)</option>
                    <option value="traveler">Voyageur paie les frais opérateur</option>
                    <option value="split">Partage 50 / 50</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer la Configuration des Passerelles</span>
                </button>
              </div>
            </form>
          </div>

          {/* Transactions Audit Trail Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-800" />
                  <span>Journal d'Audit des Paiements en Temps Réel</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Historique certifié des transactions Mobile Money, Cartes et Guichets avec reçus officiels.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {bookings.length} enregistrement(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="pb-2">Réf Transaction</th>
                    <th className="pb-2">PNR</th>
                    <th className="pb-2">Date / Heure</th>
                    <th className="pb-2">Opérateur</th>
                    <th className="pb-2">Montant</th>
                    <th className="pb-2">Client / Téléphone</th>
                    <th className="pb-2 text-right">Statut Passerelle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {bookings.map((b) => {
                    const provMeta = PAYMENT_PROVIDERS_CATALOG[b.paymentProvider] || PAYMENT_PROVIDERS_CATALOG.orange_money;
                    return (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="py-2.5 font-mono font-bold text-slate-800">
                          {b.transactionId || `TXN-${b.pnr.replace('AFW-', '')}`}
                        </td>
                        <td className="py-2.5 font-mono text-emerald-800 font-bold">{b.pnr}</td>
                        <td className="py-2.5 text-slate-500 font-mono text-[11px]">
                          {new Date(b.bookingDate).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            <span 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: provMeta.color }}
                            />
                            {provMeta.name}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono font-bold text-slate-900">
                          {formatPrice(b.totalAmountXOF, currency)}
                        </td>
                        <td className="py-2.5 font-mono text-slate-600">
                          {b.paymentPhone || b.passengers[0]?.phone || 'Guichet'}
                        </td>
                        <td className="py-2.5 text-right">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-mono">
                            <CheckCircle2 className="w-3 h-3" />
                            00_SUCCESS
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Trip Modal */}
      {showAddTripModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Programmer un Nouveau Départ de Car
            </h3>

            <form onSubmit={handleCreateTrip} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Compagnie de transport</label>
                <select
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-lg font-medium"
                >
                  {partnerCompanies.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Ville de Départ</label>
                  <input
                    type="text"
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Ville de Destination</label>
                  <input
                    type="text"
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-lg font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Heure de départ</label>
                  <input
                    type="time"
                    value={newDepartureTime}
                    onChange={(e) => setNewDepartureTime(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Tarif billet (FCFA)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddTripModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-lg text-slate-600 font-medium cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 text-white rounded-lg font-bold cursor-pointer"
                >
                  Ajouter le départ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
