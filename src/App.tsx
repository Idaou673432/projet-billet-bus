import React, { useState, useEffect } from 'react';
import { 
  Trip, 
  Booking, 
  BrandConfig, 
  Currency, 
  Language, 
  UserRole,
  BusCompany,
  UserAccount
} from './types';
import { 
  getStoredBrandConfig, 
  saveBrandConfig, 
  getStoredTrips, 
  addCustomTrip, 
  getStoredBookings,
  saveBooking,
  getStoredCompanies,
  updateCompany
} from './utils/storage';
import {
  initializeFirestoreDatabase,
  subscribeToBookings,
  subscribeToTrips,
  subscribeToCompanies,
  subscribeToBrandConfig,
  saveBookingToCloud,
  saveBrandConfigToCloud,
  saveCompanyToCloud,
  saveTripToCloud
} from './services/firestoreSync';
import { testConnection } from './lib/firebase';
import { getStoredUser, signOutAccount } from './services/authService';
import { Header } from './components/Header';
import { HeroSearch } from './components/HeroSearch';
import { TripResults } from './components/TripResults';
import { SeatSelectorModal } from './components/SeatSelectorModal';
import { PassengerCheckoutModal } from './components/PassengerCheckoutModal';
import { TicketViewModal } from './components/TicketViewModal';
import { BoardingScannerModal } from './components/BoardingScannerModal';
import { CounterSalesView } from './components/CounterSalesView';
import { OperatorDashboard } from './components/OperatorDashboard';
import { ArchitectureGuideView } from './components/ArchitectureGuideView';
import { MyTicketsModal } from './components/MyTicketsModal';
import { AuthModal } from './components/AuthModal';
import { MobileControllerTerminal } from './components/MobileControllerTerminal';
import { SmsNotificationBanner } from './components/SmsNotificationBanner';
import { simulateSendBookingConfirmationSms, SmsNotification } from './services/smsService';
import { Footer } from './components/Footer';

export default function App() {
  // Brand & Settings
  const [brandConfig, setBrandConfig] = useState<BrandConfig>(getStoredBrandConfig);
  const [companies, setCompanies] = useState<BusCompany[]>(getStoredCompanies);
  const [bookings, setBookings] = useState<Booking[]>(getStoredBookings);
  const [currency, setCurrency] = useState<Currency>('XOF');
  const [language, setLanguage] = useState<Language>('fr');
  const [role, setRole] = useState<UserRole>('traveler');

  // Authenticator & User Account
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(getStoredUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Sync role with logged in user
  useEffect(() => {
    if (currentUser) {
      setRole(currentUser.role);
    }
  }, [currentUser]);

  // Navigation
  const [activeTab, setActiveTab] = useState<'booking' | 'scanner' | 'counter' | 'company' | 'guide'>('booking');

  // Search parameters
  const [originCity, setOriginCity] = useState<string>('Bamako');
  const [destinationCity, setDestinationCity] = useState<string>('Sikasso');
  const [travelDate, setTravelDate] = useState<string>('2026-10-19');
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [tripType, setTripType] = useState<'one_way' | 'round_trip'>('one_way');

  // Trips data
  const [allTrips, setAllTrips] = useState<Trip[]>(getStoredTrips);
  const [displayedTrips, setDisplayedTrips] = useState<Trip[]>(() => {
    const initial = getStoredTrips();
    return initial.filter(
      (t) => t.originCity.toLowerCase() === 'bamako' && t.destinationCity.toLowerCase() === 'sikasso'
    ).length > 0
      ? initial.filter((t) => t.originCity.toLowerCase() === 'bamako' && t.destinationCity.toLowerCase() === 'sikasso')
      : initial;
  });

  // Modal workflows
  const [selectedTripForSeats, setSelectedTripForSeats] = useState<Trip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [tripForCheckout, setTripForCheckout] = useState<Trip | null>(null);
  const [activeViewingTicket, setActiveViewingTicket] = useState<Booking | null>(null);
  const [isMyTicketsOpen, setIsMyTicketsOpen] = useState<boolean>(false);
  const [scannerPrefillPnr, setScannerPrefillPnr] = useState<string>('');
  const [activeSmsNotification, setActiveSmsNotification] = useState<SmsNotification | null>(null);

  // 1. Initialize Firestore & Subscribe to real-time events for multi-machine synchronization
  useEffect(() => {
    // Test connection on boot
    testConnection().catch((err) => console.warn('Firestore test connection notice:', err));

    // Seed empty collections if needed
    initializeFirestoreDatabase().catch((err) => console.warn('Firestore initialization notice:', err));

    // Real-time listener for bookings across all connected devices
    const unsubBookings = subscribeToBookings((liveBookings) => {
      setBookings(liveBookings);
    });

    // Real-time listener for scheduled trips
    const unsubTrips = subscribeToTrips((liveTrips) => {
      setAllTrips(liveTrips);
      setDisplayedTrips((prev) => {
        const matches = liveTrips.filter(
          (t) =>
            t.originCity.toLowerCase() === originCity.toLowerCase() &&
            t.destinationCity.toLowerCase() === destinationCity.toLowerCase()
        );
        return matches.length > 0 ? matches : liveTrips;
      });
    });

    // Real-time listener for companies & custom logos
    const unsubCompanies = subscribeToCompanies((liveCompanies) => {
      setCompanies(liveCompanies);
    });

    // Real-time listener for platform brand config
    const unsubBrand = subscribeToBrandConfig((liveBrand) => {
      setBrandConfig(liveBrand);
    });

    return () => {
      unsubBookings();
      unsubTrips();
      unsubCompanies();
      unsubBrand();
    };
  }, [originCity, destinationCity]);

  // Handle Search Trigger
  const handleSearch = () => {
    const matches = allTrips.filter(
      (t) =>
        t.originCity.toLowerCase() === originCity.toLowerCase() &&
        t.destinationCity.toLowerCase() === destinationCity.toLowerCase()
    );

    if (matches.length > 0) {
      setDisplayedTrips(matches);
    } else {
      // Fallback: show trips leaving from origin city or all trips
      const originMatches = allTrips.filter((t) => t.originCity.toLowerCase() === originCity.toLowerCase());
      setDisplayedTrips(originMatches.length > 0 ? originMatches : allTrips);
    }

    // Ensure we are on the booking tab
    setActiveTab('booking');
  };

  // Step 1: User selects a trip card
  const handleSelectTrip = (trip: Trip) => {
    setSelectedTripForSeats(trip);
  };

  // Step 2: User confirms seats in modal
  const handleConfirmSeats = (seats: string[]) => {
    setSelectedSeats(seats);
    setTripForCheckout(selectedTripForSeats);
    setSelectedTripForSeats(null);
  };

  // Step 3: Payment succeeds -> save local & cloud -> show official E-ticket + simulate SMS confirmation notification
  const handleBookingSuccess = async (booking: Booking) => {
    setTripForCheckout(null);
    setSelectedSeats([]);
    saveBooking(booking);
    saveBookingToCloud(booking).catch((err) => console.warn('Cloud booking save note:', err));
    setActiveViewingTicket(booking);

    // Simulation d'envoi de notification SMS de confirmation au client
    try {
      const sms = await simulateSendBookingConfirmationSms(booking, brandConfig.brandName);
      setActiveSmsNotification(sms);
    } catch (err) {
      console.warn('Simulation SMS error:', err);
    }
  };

  // Quick Inspector shortcut from ticket view
  const handleOpenScannerWithPnr = (pnr: string) => {
    setActiveViewingTicket(null);
    setScannerPrefillPnr(pnr);
    setActiveTab('scanner');
  };

  // Add custom trip from Operator portal
  const handleAddTrip = (trip: Trip) => {
    addCustomTrip(trip);
    setAllTrips(getStoredTrips());
    setDisplayedTrips(getStoredTrips());
    saveTripToCloud(trip).catch((err) => console.warn('Cloud trip save note:', err));
  };

  // Update company with custom logo
  const handleUpdateCompany = (comp: BusCompany) => {
    const updated = updateCompany(comp);
    setCompanies(updated);
    saveCompanyToCloud(comp).catch((err) => console.warn('Cloud company update note:', err));
  };

  // Add newly created company
  const handleAddCompany = (comp: BusCompany) => {
    const updated = updateCompany(comp);
    setCompanies(updated);
    saveCompanyToCloud(comp).catch((err) => console.warn('Cloud company add note:', err));
  };

  // Update brand configuration
  const handleUpdateBrandConfig = (newConfig: BrandConfig) => {
    saveBrandConfig(newConfig);
    setBrandConfig(newConfig);
    saveBrandConfigToCloud(newConfig).catch((err) => console.warn('Cloud brand config save note:', err));
  };

  // RESTRICTED CONTROLLER PHONE TERMINAL
  // "LA PARTI COMPTE DES CONTROLEUR QUI NE POURRA QUE SCANNER PAR LE TELEPHONNE POUR LE VERIFICATION DE CHAQUE BILLET"
  if (currentUser?.role === 'controller') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
        <MobileControllerTerminal
          currentUser={currentUser}
          trips={allTrips}
          onSignOut={async () => {
            await signOutAccount();
            setCurrentUser(null);
            setRole('traveler');
          }}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={currentUser}
          onUserChange={(u) => {
            setCurrentUser(u);
            if (u) setRole(u.role);
          }}
        />
        <SmsNotificationBanner
          notification={activeSmsNotification}
          onDismiss={() => setActiveSmsNotification(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Universal Top Bar */}
      <Header
        brandName={brandConfig.brandName}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        currency={currency}
        setCurrency={setCurrency}
        onOpenMyTickets={() => setIsMyTicketsOpen(true)}
        role={role}
        setRole={setRole}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Areas */}
      <main className="flex-1">
        {activeTab === 'booking' && (
          <>
            <HeroSearch
              originCity={originCity}
              setOriginCity={setOriginCity}
              destinationCity={destinationCity}
              setDestinationCity={setDestinationCity}
              travelDate={travelDate}
              setTravelDate={setTravelDate}
              passengerCount={passengerCount}
              setPassengerCount={setPassengerCount}
              tripType={tripType}
              setTripType={setTripType}
              onSearch={handleSearch}
              language={language}
              currency={currency}
              slogan={brandConfig.slogan}
            />

            <TripResults
              trips={displayedTrips}
              currency={currency}
              language={language}
              onSelectTrip={handleSelectTrip}
              originCity={originCity}
              destinationCity={destinationCity}
            />
          </>
        )}

        {activeTab === 'scanner' && (
          <BoardingScannerModal
            initialPnr={scannerPrefillPnr}
          />
        )}

        {activeTab === 'counter' && (
          <CounterSalesView
            trips={allTrips}
            currency={currency}
            onOpenTicket={(b) => setActiveViewingTicket(b)}
          />
        )}

        {activeTab === 'company' && (
          <OperatorDashboard
            trips={allTrips}
            currency={currency}
            onAddTrip={handleAddTrip}
            bookings={bookings}
            companies={companies}
          />
        )}

        {activeTab === 'guide' && (
          <ArchitectureGuideView
            brandConfig={brandConfig}
            onUpdateBrandConfig={handleUpdateBrandConfig}
            currency={currency}
            setCurrency={setCurrency}
            language={language}
            setLanguage={setLanguage}
            companies={companies}
            onUpdateCompany={handleUpdateCompany}
            onAddCompany={handleAddCompany}
          />
        )}
      </main>

      {/* Modals */}
      {/* 1. Seat Selection Modal */}
      {selectedTripForSeats && (
        <SeatSelectorModal
          trip={selectedTripForSeats}
          passengerCount={passengerCount}
          currency={currency}
          onClose={() => setSelectedTripForSeats(null)}
          onConfirmSeats={handleConfirmSeats}
        />
      )}

      {/* 2. Passenger Checkout & Mobile Money Payment Modal */}
      {tripForCheckout && (
        <PassengerCheckoutModal
          trip={tripForCheckout}
          selectedSeats={selectedSeats}
          currency={currency}
          onClose={() => setTripForCheckout(null)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {/* 3. Official E-Ticket & Scannable QR Boarding Pass Modal */}
      {activeViewingTicket && (
        <TicketViewModal
          booking={activeViewingTicket}
          currency={currency}
          onClose={() => setActiveViewingTicket(null)}
          onOpenScanner={handleOpenScannerWithPnr}
        />
      )}

      {/* 4. My Tickets Modal */}
      {isMyTicketsOpen && (
        <MyTicketsModal
          bookings={bookings}
          currency={currency}
          onClose={() => setIsMyTicketsOpen(false)}
          onSelectBooking={(b) => {
            setIsMyTicketsOpen(false);
            setActiveViewingTicket(b);
          }}
        />
      )}

      {/* 5. Authenticator & Account Management Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={(u) => {
          setCurrentUser(u);
          if (u) setRole(u.role);
        }}
      />

      {/* 6. Simulated SMS Notification Banner */}
      <SmsNotificationBanner
        notification={activeSmsNotification}
        onDismiss={() => setActiveSmsNotification(null)}
      />

      {/* Footer */}
      <Footer
        brandConfig={brandConfig}
        language={language}
        currency={currency}
        onNavigateTab={setActiveTab}
      />
    </div>
  );
}
