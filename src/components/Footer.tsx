import React from 'react';
import { BrandConfig, Language, Currency } from '../types';
import { MapPin, Phone, Mail, ShieldCheck } from 'lucide-react';

interface FooterProps {
  brandConfig: BrandConfig;
  language: Language;
  currency: Currency;
  onNavigateTab: (tab: 'booking' | 'scanner' | 'counter' | 'company' | 'guide') => void;
}

export const Footer: React.FC<FooterProps> = ({
  brandConfig,
  onNavigateTab,
}) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-800">
          {/* Brand Info */}
          <div className="space-y-3">
            <span className="text-lg font-bold text-white tracking-tight block">
              {brandConfig.brandName}
            </span>
            <p className="text-slate-400 text-xs leading-relaxed">
              {brandConfig.slogan}
            </p>
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Conforme aux accords UEMOA & CEDEAO</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => onNavigateTab('booking')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Recherche & Réservation
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('scanner')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Scanner QR Embarquement
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('counter')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Guichet & Vente Gare
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('company')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Compagnies & Manifestes
                </button>
              </li>
            </ul>
          </div>

          {/* Target Regional Markets */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider">
              Réseau Régional
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mali (Bamako, Sikasso, Ségou, Kayes) · Sénégal (Dakar, Saint-Louis) · Côte d'Ivoire (Abidjan, Bouaké) · Burkina Faso · Guinée · Niger · Togo · Bénin.
            </p>
          </div>

          {/* Support & Contact */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider">
              Assistance Voyageurs
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{brandConfig.supportPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{brandConfig.supportEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Bamako, Mali · Siège Sous-Régional</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} {brandConfig.brandName}. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigateTab('guide')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Guide d'Intégration API
            </button>
            <span aria-hidden="true">·</span>
            <span>Conditions Générales de Transport</span>
            <span aria-hidden="true">·</span>
            <span>Politique de Confidentialité</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
