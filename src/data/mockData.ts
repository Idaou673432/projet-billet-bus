import { Country, City, Station, BusCompany, Trip, Booking } from '../types';
import { DEFAULT_COMPANY_LOGOS } from '../utils/companyLogos';

export const COUNTRIES: Country[] = [
  { code: 'ML', name: 'Mali', flag: '🇲🇱', currency: 'XOF', phonePrefix: '+223' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳', currency: 'XOF', phonePrefix: '+221' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', currency: 'XOF', phonePrefix: '+225' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', currency: 'XOF', phonePrefix: '+226' },
  { code: 'GN', name: 'Guinée', flag: '🇬🇳', currency: 'GNF', phonePrefix: '+224' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪', currency: 'XOF', phonePrefix: '+227' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', currency: 'XOF', phonePrefix: '+228' },
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯', currency: 'XOF', phonePrefix: '+229' },
  { code: 'MR', name: 'Mauritanie', flag: '🇲🇷', currency: 'MRU', phonePrefix: '+222' },
];

export const CITIES: City[] = [
  // Mali
  { id: 'bko', name: 'Bamako', countryCode: 'ML', isPopular: true },
  { id: 'sik', name: 'Sikasso', countryCode: 'ML', isPopular: true },
  { id: 'seg', name: 'Ségou', countryCode: 'ML', isPopular: true },
  { id: 'kay', name: 'Kayes', countryCode: 'ML', isPopular: true },
  { id: 'mop', name: 'Mopti', countryCode: 'ML' },
  { id: 'kou', name: 'Koutiala', countryCode: 'ML' },
  { id: 'bou', name: 'Bougouni', countryCode: 'ML' },
  { id: 'san', name: 'San', countryCode: 'ML' },
  
  // Sénégal
  { id: 'dkr', name: 'Dakar', countryCode: 'SN', isPopular: true },
  { id: 'ths', name: 'Thiès', countryCode: 'SN' },
  { id: 'stl', name: 'Saint-Louis', countryCode: 'SN', isPopular: true },
  { id: 'kao', name: 'Kaolack', countryCode: 'SN' },
  { id: 'zig', name: 'Ziguinchor', countryCode: 'SN' },

  // Côte d'Ivoire
  { id: 'abj', name: 'Abidjan', countryCode: 'CI', isPopular: true },
  { id: 'bke', name: 'Bouaké', countryCode: 'CI', isPopular: true },
  { id: 'yms', name: 'Yamoussoukro', countryCode: 'CI' },
  { id: 'kgo', name: 'Korhogo', countryCode: 'CI', isPopular: true },
  { id: 'spo', name: 'San-Pédro', countryCode: 'CI' },

  // Burkina Faso
  { id: 'oua', name: 'Ouagadougou', countryCode: 'BF', isPopular: true },
  { id: 'bob', name: 'Bobo-Dioulasso', countryCode: 'BF', isPopular: true },
  { id: 'kdg', name: 'Koudougou', countryCode: 'BF' },

  // Guinée
  { id: 'cky', name: 'Conakry', countryCode: 'GN', isPopular: true },
  { id: 'kda', name: 'Kindia', countryCode: 'GN' },
  { id: 'kan', name: 'Kankan', countryCode: 'GN' },

  // Niger
  { id: 'nim', name: 'Niamey', countryCode: 'NE', isPopular: true },
  { id: 'mrd', name: 'Maradi', countryCode: 'NE' },

  // Togo
  { id: 'lfw', name: 'Lomé', countryCode: 'TG', isPopular: true },
  { id: 'kar', name: 'Kara', countryCode: 'TG' },

  // Bénin
  { id: 'coo', name: 'Cotonou', countryCode: 'BJ', isPopular: true },
  { id: 'pno', name: 'Porto-Novo', countryCode: 'BJ' },

  // Mauritanie
  { id: 'nkc', name: 'Nouakchott', countryCode: 'MR', isPopular: true },
  { id: 'ndb', name: 'Nouadhibou', countryCode: 'MR' },
];

export const STATIONS: Station[] = [
  // Bamako
  { id: 'st_bko_sogoniko', name: 'Gare Routière Principale de Sogoniko', cityName: 'Bamako', countryCode: 'ML', address: 'Avenue de l\'OUA, Sogoniko, Bamako' },
  { id: 'st_bko_djicoroni', name: 'Gare Voyageurs Djicoroni Para', cityName: 'Bamako', countryCode: 'ML', address: 'Route de Sébénikoro, Djicoroni Para, Bamako' },
  { id: 'st_bko_kalaban', name: 'Autogare Interurbaine Kalabancoro', cityName: 'Bamako', countryCode: 'ML', address: 'Carrefour Kalaban Coro, Bamako' },

  // Sikasso & Ségou & Kayes
  { id: 'st_sik_centrale', name: 'Gare Centrale de Sikasso (Carrefour Sanou)', cityName: 'Sikasso', countryCode: 'ML', address: 'Quartier Sanoubougou, Sikasso' },
  { id: 'st_seg_centrale', name: 'Gare Routière Interurbaine de Ségou', cityName: 'Ségou', countryCode: 'ML', address: 'Route Nationale 6, Ségou' },
  { id: 'st_kay_lafiabougou', name: 'Gare Routière de Kayes Lafiabougou', cityName: 'Kayes', countryCode: 'ML', address: 'Boulevard de la République, Kayes' },

  // Dakar
  { id: 'st_dkr_maraichers', name: 'Gare Routière des Beaux Maraîchers', cityName: 'Dakar', countryCode: 'SN', address: 'Pikine Nord, Dakar' },
  { id: 'st_dkr_petersen', name: 'Gare Petersen Plateau', cityName: 'Dakar', countryCode: 'SN', address: 'Avenue Faidherbe, Dakar Plateau' },

  // Abidjan
  { id: 'st_abj_adjame', name: 'Gare Routière Internationale d\'Adjamé', cityName: 'Abidjan', countryCode: 'CI', address: 'Boulevard Nangui Abrogoua, Adjamé' },
  { id: 'st_abj_treichville', name: 'Gare de Treichville Belvédère', cityName: 'Abidjan', countryCode: 'CI', address: 'Boulevard de Marseille, Treichville' },
  { id: 'st_abj_yopougon', name: 'Gare Yopougon Siporex', cityName: 'Abidjan', countryCode: 'CI', address: 'Carrefour Siporex, Yopougon' },

  // Ouagadougou
  { id: 'st_oua_ouest', name: 'Gare Routière Ouest Gounghin', cityName: 'Ouagadougou', countryCode: 'BF', address: 'Avenue Babanguida, Gounghin, Ouaga' },

  // Conakry
  { id: 'st_cky_matam', name: 'Gare Routière de Matam', cityName: 'Conakry', countryCode: 'GN', address: 'Autoroute Fidel Castro, Matam' },

  // Niamey
  { id: 'st_nim_wadata', name: 'Autogare Centrale Wadata', cityName: 'Niamey', countryCode: 'NE', address: 'Quartier Wadata, Niamey' },

  // Lomé
  { id: 'st_lfw_agbalepedogan', name: 'Gare Routière d\'Agbalépédogan', cityName: 'Lomé', countryCode: 'TG', address: 'Boulevard de la Paix, Lomé' },

  // Cotonou
  { id: 'st_coo_akpakpa', name: 'Gare Routière d\'Akpakpa', cityName: 'Cotonou', countryCode: 'BJ', address: 'Route de Porto-Novo, Akpakpa, Cotonou' },
];

export const BUS_COMPANIES: BusCompany[] = [
  {
    id: 'nour_transport',
    name: 'Nour Transport',
    logoText: 'NT',
    logoUrl: DEFAULT_COMPANY_LOGOS.nour_transport,
    brandColor: '#044728',
    rating: 4.8,
    totalReviews: 1420,
    phone: '+223 20 28 44 10',
    headquarters: 'Bamako, Mali',
    amenitiesDescription: 'Flotte premium Marcopolo G7 & Scania. Climatisation continue, wifi Starlink, sièges inclinables VIP.',
    verified: true,
  },
  {
    id: 'bani_transport',
    name: 'Bani Transport',
    logoText: 'BT',
    logoUrl: DEFAULT_COMPANY_LOGOS.bani_transport,
    brandColor: '#b91c1c',
    rating: 4.6,
    totalReviews: 980,
    phone: '+223 20 22 15 80',
    headquarters: 'Ségou & Bamako, Mali',
    amenitiesDescription: 'Liaisons rapides et régulières. Chauffeurs expérimentés, pauses aménagées dans les gares relais.',
    verified: true,
  },
  {
    id: 'sonef_voyages',
    name: 'SONEF Transport Voyageurs',
    logoText: 'SONEF',
    logoUrl: DEFAULT_COMPANY_LOGOS.sonef_voyages,
    brandColor: '#1e3a8a',
    rating: 4.7,
    totalReviews: 2150,
    phone: '+223 20 29 11 00',
    headquarters: 'Bamako, Mali / Réseau Sous-Régional',
    amenitiesDescription: 'Spécialiste panafricain des longs trajets transfrontaliers (Mali, Sénégal, Niger, Mauritanie).',
    verified: true,
  },
  {
    id: 'gana_transport',
    name: 'Gana Transport',
    logoText: 'GT',
    logoUrl: DEFAULT_COMPANY_LOGOS.gana_transport,
    brandColor: '#065f46',
    rating: 4.5,
    totalReviews: 870,
    phone: '+223 20 24 33 22',
    headquarters: 'Bamako, Mali',
    amenitiesDescription: 'Excellente régularité horaire sur le corridor Bamako - Sikasso - Côte d\'Ivoire.',
    verified: true,
  },
  {
    id: 'africa_tours',
    name: 'Africa Tours Trans',
    logoText: 'ATT',
    logoUrl: DEFAULT_COMPANY_LOGOS.africa_tours,
    brandColor: '#c2410c',
    rating: 4.6,
    totalReviews: 1120,
    phone: '+225 27 20 30 40',
    headquarters: 'Abidjan & Bamako',
    amenitiesDescription: 'Cars VIP grand confort avec assistance passage de frontière facilitée et stewards dédiés.',
    verified: true,
  },
];

// Helper to generate realistic seats for a trip
export function generateBusSeats(totalSeats: number = 50, busClass: 'standard' | 'vip' | 'express_direct') {
  const seats = [];
  const rows = Math.ceil(totalSeats / (busClass === 'vip' ? 3 : 4));
  let seatIdx = 1;

  for (let r = 1; r <= rows && seatIdx <= totalSeats; r++) {
    const cols = busClass === 'vip' ? [1, 2, 4] : [1, 2, 3, 4];
    for (const c of cols) {
      if (seatIdx > totalSeats) break;
      const letter = c === 1 ? 'A' : c === 2 ? 'B' : c === 3 ? 'C' : 'D';
      const number = `${r}${letter}`;
      
      // Predictable occupied distribution for demo
      const isOccupied = (seatIdx % 4 === 1 && seatIdx < 28) || seatIdx === 7 || seatIdx === 18;

      seats.push({
        id: `seat_${seatIdx}`,
        number,
        row: r,
        column: c,
        status: isOccupied ? ('occupied' as const) : ('available' as const),
        isWindow: c === 1 || c === (busClass === 'vip' ? 4 : 4),
        priceMultiplier: busClass === 'vip' ? 1.25 : 1.0,
      });
      seatIdx++;
    }
  }
  return seats;
}

export const INITIAL_TRIPS: Trip[] = [
  // 1. Bamako -> Sikasso (National - Le corridor le plus fréquenté du Mali)
  {
    id: 'trip_bko_sik_01',
    companyId: 'nour_transport',
    companyName: 'Nour Transport',
    originCity: 'Bamako',
    originCountry: 'Mali',
    originStationId: 'st_bko_sogoniko',
    originStationName: 'Gare de Sogoniko (Bamako)',
    destinationCity: 'Sikasso',
    destinationCountry: 'Mali',
    destinationStationId: 'st_sik_centrale',
    destinationStationName: 'Gare Centrale de Sikasso (Carrefour Sanou)',
    departureTime: '07:00',
    departureDate: '2026-10-19',
    arrivalTime: '12:30',
    arrivalDate: '2026-10-19',
    durationHours: 5,
    durationMinutes: 30,
    distanceKm: 375,
    basePriceXOF: 8500,
    busClass: 'vip',
    busModel: 'Marcopolo Paradiso 1200 G7',
    plateNumber: 'ML-8492-MD',
    totalSeats: 48,
    availableSeats: 26,
    isCrossBorder: false,
    amenities: ['wifi', 'ac', 'usb', 'tv', 'water'],
    cancellationPolicy: 'Remboursement à 100% jusqu\'à 4h avant le départ.',
  },
  {
    id: 'trip_bko_sik_02',
    companyId: 'bani_transport',
    companyName: 'Bani Transport',
    originCity: 'Bamako',
    originCountry: 'Mali',
    originStationId: 'st_bko_djicoroni',
    originStationName: 'Gare Djicoroni Para (Bamako)',
    destinationCity: 'Sikasso',
    destinationCountry: 'Mali',
    destinationStationId: 'st_sik_centrale',
    destinationStationName: 'Gare Centrale de Sikasso',
    departureTime: '08:30',
    departureDate: '2026-10-19',
    arrivalTime: '14:15',
    arrivalDate: '2026-10-19',
    durationHours: 5,
    durationMinutes: 45,
    distanceKm: 375,
    basePriceXOF: 7000,
    busClass: 'standard',
    busModel: 'Scania Irizar i6',
    plateNumber: 'ML-3921-BA',
    totalSeats: 52,
    availableSeats: 34,
    isCrossBorder: false,
    amenities: ['ac', 'usb', 'tv'],
    cancellationPolicy: 'Modifiable sans frais jusqu\'à 2h avant le départ.',
  },

  // 2. Bamako -> Ségou
  {
    id: 'trip_bko_seg_01',
    companyId: 'gana_transport',
    companyName: 'Gana Transport',
    originCity: 'Bamako',
    originCountry: 'Mali',
    originStationId: 'st_bko_sogoniko',
    originStationName: 'Gare de Sogoniko (Bamako)',
    destinationCity: 'Ségou',
    destinationCountry: 'Mali',
    destinationStationId: 'st_seg_centrale',
    destinationStationName: 'Gare Interurbaine de Ségou',
    departureTime: '09:00',
    departureDate: '2026-10-19',
    arrivalTime: '12:30',
    arrivalDate: '2026-10-19',
    durationHours: 3,
    durationMinutes: 30,
    distanceKm: 240,
    basePriceXOF: 5000,
    busClass: 'express_direct',
    busModel: 'Mercedes-Benz Tourismo',
    plateNumber: 'ML-1102-GT',
    totalSeats: 48,
    availableSeats: 19,
    isCrossBorder: false,
    amenities: ['ac', 'usb', 'wifi'],
    cancellationPolicy: 'Remboursement jusqu\'à 2h avant.',
  },

  // 3. Bamako -> Kayes (Mali Ouest)
  {
    id: 'trip_bko_kay_01',
    companyId: 'sonef_voyages',
    companyName: 'SONEF Transport Voyageurs',
    originCity: 'Bamako',
    originCountry: 'Mali',
    originStationId: 'st_bko_sogoniko',
    originStationName: 'Gare de Sogoniko (Bamako)',
    destinationCity: 'Kayes',
    destinationCountry: 'Mali',
    destinationStationId: 'st_kay_lafiabougou',
    destinationStationName: 'Gare Routière de Kayes Lafiabougou',
    departureTime: '06:00',
    departureDate: '2026-10-19',
    arrivalTime: '13:30',
    arrivalDate: '2026-10-19',
    durationHours: 7,
    durationMinutes: 30,
    distanceKm: 495,
    basePriceXOF: 11000,
    busClass: 'vip',
    busModel: 'Volvo 9700 Grand Luxe',
    plateNumber: 'ML-7833-SN',
    totalSeats: 46,
    availableSeats: 22,
    isCrossBorder: false,
    amenities: ['wifi', 'ac', 'usb', 'wc', 'tv', 'water'],
    cancellationPolicy: 'Remboursement à 85% en cas d\'annulation.',
  },

  // 4. Trajet International : Bamako (Mali) -> Abidjan (Côte d'Ivoire)
  {
    id: 'trip_bko_abj_01',
    companyId: 'africa_tours',
    companyName: 'Africa Tours Trans',
    originCity: 'Bamako',
    originCountry: 'Mali',
    originStationId: 'st_bko_sogoniko',
    originStationName: 'Gare de Sogoniko (Bamako)',
    destinationCity: 'Abidjan',
    destinationCountry: 'Côte d\'Ivoire',
    destinationStationId: 'st_abj_adjame',
    destinationStationName: 'Gare Routière Internationale d\'Adjamé (Abidjan)',
    departureTime: '07:30',
    departureDate: '2026-10-19',
    arrivalTime: '05:30',
    arrivalDate: '2026-10-20',
    durationHours: 22,
    durationMinutes: 0,
    distanceKm: 1120,
    basePriceXOF: 28000,
    busClass: 'vip',
    busModel: 'Marcopolo New G8 VIP Sleeper',
    plateNumber: 'CI-4019-ATT',
    totalSeats: 44,
    availableSeats: 18,
    isCrossBorder: true,
    borderRequirements: [
      'Pièce d\'identité CEDEAO valide ou Passeport en cours de validité',
      'Carnet international de vaccination (Fièvre jaune obligatoire)',
      'Contrôle douanier et police frontière à Zégoua / Pogo'
    ],
    amenities: ['wifi', 'ac', 'usb', 'wc', 'tv', 'water'],
    cancellationPolicy: 'Annulation avec retenue 10% jusqu\'à 24h avant le départ.',
  },

  // 5. Trajet International : Bamako (Mali) -> Dakar (Sénégal)
  {
    id: 'trip_bko_dkr_01',
    companyId: 'sonef_voyages',
    companyName: 'SONEF Transport Voyageurs',
    originCity: 'Bamako',
    originCountry: 'Mali',
    originStationId: 'st_bko_djicoroni',
    originStationName: 'Gare Djicoroni Para (Bamako)',
    destinationCity: 'Dakar',
    destinationCountry: 'Sénégal',
    destinationStationId: 'st_dkr_maraichers',
    destinationStationName: 'Gare des Beaux Maraîchers (Dakar)',
    departureTime: '06:30',
    departureDate: '2026-10-19',
    arrivalTime: '07:30',
    arrivalDate: '2026-10-20',
    durationHours: 25,
    durationMinutes: 0,
    distanceKm: 1250,
    basePriceXOF: 35000,
    busClass: 'vip',
    busModel: 'Scania Touring HD VIP',
    plateNumber: 'SN-9102-DK',
    totalSeats: 46,
    availableSeats: 15,
    isCrossBorder: true,
    borderRequirements: [
      'Carte d\'identité CEDEAO ou Passeport biométrique',
      'Carnet de vaccination international à jour',
      'Poste frontière Diboli (Mali) / Kidira (Sénégal)'
    ],
    amenities: ['wifi', 'ac', 'usb', 'wc', 'tv', 'water'],
    cancellationPolicy: 'Modification de date gratuite 1 fois.',
  },

  // 6. Trajet National Sénégal : Dakar -> Saint-Louis
  {
    id: 'trip_dkr_stl_01',
    companyId: 'sonef_voyages',
    companyName: 'SONEF Transport Voyageurs',
    originCity: 'Dakar',
    originCountry: 'Sénégal',
    originStationId: 'st_dkr_maraichers',
    originStationName: 'Gare des Beaux Maraîchers (Dakar)',
    destinationCity: 'Saint-Louis',
    destinationCountry: 'Sénégal',
    destinationStationId: 'st_dkr_petersen',
    destinationStationName: 'Gare Routière Khor (Saint-Louis)',
    departureTime: '08:00',
    departureDate: '2026-10-19',
    arrivalTime: '12:00',
    arrivalDate: '2026-10-19',
    durationHours: 4,
    durationMinutes: 0,
    distanceKm: 260,
    basePriceXOF: 6500,
    busClass: 'express_direct',
    busModel: 'Isuzu Grand VIP Coach',
    plateNumber: 'SN-2811-DK',
    totalSeats: 48,
    availableSeats: 30,
    isCrossBorder: false,
    amenities: ['ac', 'usb', 'wifi'],
    cancellationPolicy: 'Remboursable jusqu\'à 3h avant.',
  },

  // 7. Trajet National Côte d'Ivoire : Abidjan -> Bouaké
  {
    id: 'trip_abj_bke_01',
    companyId: 'africa_tours',
    companyName: 'Africa Tours Trans',
    originCity: 'Abidjan',
    originCountry: 'Côte d\'Ivoire',
    originStationId: 'st_abj_adjame',
    originStationName: 'Gare Internationale d\'Adjamé (Abidjan)',
    destinationCity: 'Bouaké',
    destinationCountry: 'Côte d\'Ivoire',
    destinationStationId: 'st_abj_treichville',
    destinationStationName: 'Gare Centrale de Koko (Bouaké)',
    departureTime: '10:00',
    departureDate: '2026-10-19',
    arrivalTime: '14:30',
    arrivalDate: '2026-10-19',
    durationHours: 4,
    durationMinutes: 30,
    distanceKm: 350,
    basePriceXOF: 8500,
    busClass: 'vip',
    busModel: 'Mercedes-Benz Travego VIP',
    plateNumber: 'CI-1100-AB',
    totalSeats: 48,
    availableSeats: 21,
    isCrossBorder: false,
    amenities: ['wifi', 'ac', 'usb', 'tv'],
    cancellationPolicy: 'Échangeable sans pénalité.',
  },

  // 8. Trajet International : Bamako (Mali) -> Ouagadougou (Burkina Faso)
  {
    id: 'trip_bko_oua_01',
    companyId: 'nour_transport',
    companyName: 'Nour Transport',
    originCity: 'Bamako',
    originCountry: 'Mali',
    originStationId: 'st_bko_sogoniko',
    originStationName: 'Gare de Sogoniko (Bamako)',
    destinationCity: 'Ouagadougou',
    destinationCountry: 'Burkina Faso',
    destinationStationId: 'st_oua_ouest',
    destinationStationName: 'Gare Routière Ouest Gounghin (Ouaga)',
    departureTime: '06:00',
    departureDate: '2026-10-19',
    arrivalTime: '21:00',
    arrivalDate: '2026-10-19',
    durationHours: 15,
    durationMinutes: 0,
    distanceKm: 850,
    basePriceXOF: 22000,
    busClass: 'vip',
    busModel: 'Scania Marcopolo G7 VIP',
    plateNumber: 'ML-9901-BF',
    totalSeats: 48,
    availableSeats: 16,
    isCrossBorder: true,
    borderRequirements: [
      'Passeport ou Carte CEDEAO',
      'Passage frontière Faramana / Hérémankono',
      'Carnet de vaccination'
    ],
    amenities: ['wifi', 'ac', 'usb', 'wc', 'tv', 'water'],
    cancellationPolicy: 'Remboursement à 90% jusqu\'à 12h avant.',
  }
];

// Pre-seeded verified demo booking for immediate testing of Ticket View and QR Scanner!
export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'booking_demo_01',
    pnr: 'AFW-94812-BKO',
    tripId: 'trip_bko_sik_01',
    trip: INITIAL_TRIPS[0],
    passengers: [
      {
        firstName: 'Amadou',
        lastName: 'Traoré',
        phone: '+223 76 45 89 12',
        email: 'amadou.traore@afriway.ml',
        idType: 'CARTE_NINA',
        idNumber: 'ML-NINA-1988-847291',
        nationality: 'Malienne',
        seatNumber: '12A',
      }
    ],
    totalAmountXOF: 8500,
    currency: 'XOF',
    paymentProvider: 'orange_money',
    paymentPhone: '+223 76 45 89 12',
    paymentStatus: 'completed',
    bookingDate: '2026-10-18T10:15:00.000Z',
    boardingStatus: 'not_boarded',
    verificationHash: 'afriway_sec_hash_94812_traore_verified',
    notes: 'Billet acheté via Orange Money Mali. Valide pour embarquement Quai 2.',
  },
  {
    id: 'booking_demo_02',
    pnr: 'AFW-51028-ABJ',
    tripId: 'trip_bko_abj_01',
    trip: INITIAL_TRIPS[4],
    passengers: [
      {
        firstName: 'Fatoumata',
        lastName: 'Coulibaly',
        phone: '+225 07 88 12 34',
        email: 'fcoulibaly@gmail.com',
        idType: 'PASSPORT',
        idNumber: 'ML-P098231',
        nationality: 'Malienne',
        seatNumber: '08C',
      }
    ],
    totalAmountXOF: 28000,
    currency: 'XOF',
    paymentProvider: 'wave',
    paymentPhone: '+225 07 88 12 34',
    paymentStatus: 'completed',
    bookingDate: '2026-10-18T08:30:00.000Z',
    boardingStatus: 'boarded',
    boardedAt: '2026-10-18T14:10:00.000Z',
    boardedByAgent: 'Agent Moussa Diallo (Gare Sogoniko)',
    verificationHash: 'afriway_sec_hash_51028_coulibaly_boarded',
    notes: 'Passagère déjà embarquée sur le car ML-4019.',
  }
];
