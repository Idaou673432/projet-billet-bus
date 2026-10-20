import React from 'react';
import { UserRole, Language, Currency, UserAccount } from '../types';
import { User, ShieldCheck, Smartphone } from 'lucide-react';

interface HeaderProps {
  brandName: string;
  activeTab: 'booking' | 'scanner' | 'counter' | 'company' | 'guide';
  setActiveTab: (tab: 'booking' | 'scanner' | 'counter' | 'company' | 'guide') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (cur: Currency) => void;
  onOpenMyTickets: () => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  brandName,
  activeTab,
  setActiveTab,
  onOpenMyTickets,
  currentUser,
  onOpenAuth,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <button
            onClick={() => setActiveTab('booking')}
            className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 text-left cursor-pointer hover:opacity-90 transition-opacity"
          >
            <span className="text-emerald-700">{brandName.split(' ')[0]}</span>
            {brandName.split(' ').slice(1).length > 0 ? (
              <span className="text-amber-600"> {brandName.split(' ').slice(1).join(' ')}</span>
            ) : null}
          </button>

          {/* Zone 2: 4-5 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('booking')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
                activeTab === 'booking' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              Réserver
            </button>
            <button
              onClick={() => setActiveTab('scanner')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
                activeTab === 'scanner' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              Scanner QR
            </button>
            <button
              onClick={() => setActiveTab('counter')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
                activeTab === 'counter' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              Guichet Gare
            </button>
            <button
              onClick={() => setActiveTab('company')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
                activeTab === 'company' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              Compagnies
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
                activeTab === 'guide' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              Paramètres & Logos
            </button>
          </nav>

          {/* Zone 3: Actions & Cloud Sync Status */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live multi-machine sync pill */}
            <div 
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-900"
              title="Base Firebase active : toutes les réservations, départs et logos de compagnies sont synchronisés en direct entre toutes vos machines."
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span>Cloud Sync</span>
            </div>

            {/* If user is a Controller, give direct quick phone terminal button */}
            {currentUser?.role === 'controller' && (
              <button
                onClick={() => setActiveTab('scanner')}
                className="px-2.5 py-1.5 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Accéder au terminal de scan mobile"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Scanner Mobile</span>
              </button>
            )}

            <button
              onClick={onOpenMyTickets}
              className="hidden sm:block px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer border border-slate-200"
            >
              Mes Billets
            </button>

            {/* Authenticator Account Button */}
            <button
              onClick={onOpenAuth}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                currentUser
                  ? currentUser.role === 'controller'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
              title={currentUser ? `Connecté : ${currentUser.displayName} (${currentUser.role})` : 'Se connecter ou créer un compte'}
            >
              <User className="w-3.5 h-3.5" />
              <span className="max-w-[100px] truncate">
                {currentUser ? currentUser.displayName.split(' ')[0] : 'Compte'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
