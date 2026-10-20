import React, { useState } from 'react';
import { Trip, Currency, Booking, BusCompany } from '../types';
import { formatPrice } from '../utils/currency';
import { getStoredBookings, getStoredCompanies } from '../utils/storage';
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
  Plus
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
  const [selectedTrip, setSelectedTrip] = useState<Trip>(trips[0]);
  const [showAddTripModal, setShowAddTripModal] = useState<boolean>(false);
  const bookings = liveBookings || getStoredBookings();
  const partnerCompanies = liveCompanies || getStoredCompanies();

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header and KPI Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Espace Professionnel</span>
            <span aria-hidden="true">·</span>
            <span>Gestion de Flotte & Manifestes de Police</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Supervision des Compagnies & Départs
          </h2>
        </div>

        <button
          onClick={() => setShowAddTripModal(true)}
          className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Programmer un Nouveau Départ</span>
        </button>
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
          <span className="text-xs font-semibold text-slate-500 block">Billets Émis en Ligne</span>
          <span className="text-3xl font-black text-emerald-800 font-mono mt-1 block">{bookings.length}</span>
          <span className="text-xs text-emerald-700 mt-1 block">Paiements 100% Mobile Money</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 block">Volume Encaissé (FCFA)</span>
          <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
            {formatPrice(
              bookings.reduce((sum, b) => sum + b.totalAmountXOF, 0),
              currency
            )}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">Commissions versées sans délai</span>
        </div>
      </div>

      {/* Main Departures & Manifest Section */}
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
                <span>{selectedTrip.companyName}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {selectedTrip.originCity} ➔ {selectedTrip.destinationCity} ({selectedTrip.departureTime})
              </h3>
            </div>

            <button
              onClick={handleExportManifest}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter CSV (Gendarmerie)</span>
            </button>
          </div>

          {/* Bus characteristics strip */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-xs border border-slate-200">
            <div>
              <span className="text-slate-400 block">Modèle de car</span>
              <span className="font-bold text-slate-900">{selectedTrip.busModel}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Plaque d'immatriculation</span>
              <span className="font-mono font-bold text-slate-900">{selectedTrip.plateNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Capacité</span>
              <span className="font-mono font-bold text-slate-900">{selectedTrip.totalSeats} places</span>
            </div>
          </div>

          {/* Passenger Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Passagers enregistrés pour ce départ ({allPassengersOnTrip.length})
            </h4>

            {allPassengersOnTrip.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Aucun passager n'a encore réservé sur ce car.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-3">Siège</th>
                      <th className="p-3">Voyageur</th>
                      <th className="p-3">Pièce d'Identité</th>
                      <th className="p-3">PNR</th>
                      <th className="p-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {allPassengersOnTrip.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-emerald-800">{p.seatNumber}</td>
                        <td className="p-3 text-slate-900 font-semibold">
                          {p.firstName} {p.lastName.toUpperCase()}
                        </td>
                        <td className="p-3 font-mono text-slate-600 text-[11px]">
                          {p.idType}: {p.idNumber}
                        </td>
                        <td className="p-3 font-mono text-slate-500">{p.pnr}</td>
                        <td className="p-3">
                          {p.boardingStatus === 'boarded' ? (
                            <span className="text-emerald-700 font-bold">À bord (Validé)</span>
                          ) : (
                            <span className="text-slate-400">Non embarqué</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Partner Companies Showcase */}
      <div className="pt-6 border-t border-slate-200">
        <h3 className="text-base font-bold text-slate-900 mb-4">
          Compagnies de Transport Partenaires Agréées
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {getStoredCompanies().map((company) => (
            <div key={company.id} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                {company.logoUrl ? (
                  <div className="h-10 w-24 bg-slate-50 border border-slate-200 rounded-lg p-1 flex items-center justify-center">
                    <img src={company.logoUrl} alt={company.name} className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs">
                    {company.logoText}
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-emerald-800 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Agréée</span>
                </div>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{company.name}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{company.amenitiesDescription}</p>
              <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-100">
                HQ : {company.headquarters} · Tel : {company.phone}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Add New Trip */}
      {showAddTripModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Programmer un Nouveau Départ</h3>
            <form onSubmit={handleCreateTrip} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Compagnie</label>
                <select
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-lg"
                >
                  {getStoredCompanies().map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1">Ville départ</label>
                  <input
                    type="text"
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Ville arrivée</label>
                  <input
                    type="text"
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-lg font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
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
