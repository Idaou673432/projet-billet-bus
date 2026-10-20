import React, { useState } from 'react';
import { BrandConfig, Currency, Language, BusCompany } from '../types';
import { createCompanySvgLogo } from '../utils/companyLogos';
import { 
  Settings, 
  Upload, 
  Image as ImageIcon, 
  Building, 
  Plus, 
  Check, 
  Smartphone, 
  Radio, 
  Printer, 
  ShieldCheck, 
  Eye, 
  Edit3,
  X,
  ExternalLink,
  Save
} from 'lucide-react';

interface ArchitectureGuideViewProps {
  brandConfig: BrandConfig;
  onUpdateBrandConfig: (config: BrandConfig) => void;
  currency: Currency;
  setCurrency: (cur: Currency) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  companies: BusCompany[];
  onUpdateCompany: (company: BusCompany) => void;
  onAddCompany: (company: BusCompany) => void;
}

export const ArchitectureGuideView: React.FC<ArchitectureGuideViewProps> = ({
  brandConfig,
  onUpdateBrandConfig,
  currency,
  setCurrency,
  language,
  setLanguage,
  companies,
  onUpdateCompany,
  onAddCompany,
}) => {
  // Platform Settings State
  const [brandName, setBrandName] = useState<string>(brandConfig.brandName);
  const [slogan, setSlogan] = useState<string>(brandConfig.slogan);
  const [supportPhone, setSupportPhone] = useState<string>(brandConfig.supportPhone);
  const [supportEmail, setSupportEmail] = useState<string>(brandConfig.supportEmail);
  const [ticketNotice, setTicketNotice] = useState<string>(
    brandConfig.ticketNotice || 'Présentation obligatoire 30 minutes avant le départ avec une pièce d\'identité valide.'
  );
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Edit Company Logo Modal
  const [editingCompany, setEditingCompany] = useState<BusCompany | null>(null);
  const [editLogoUrl, setEditLogoUrl] = useState<string>('');
  const [editBrandColor, setEditBrandColor] = useState<string>('#044728');
  const [logoSaveSuccess, setLogoSaveSuccess] = useState<boolean>(false);

  // Add New Company Modal
  const [showAddCompanyModal, setShowAddCompanyModal] = useState<boolean>(false);
  const [newCompanyName, setNewCompanyName] = useState<string>('');
  const [newCompanyAcronym, setNewCompanyAcronym] = useState<string>('');
  const [newCompanyPhone, setNewCompanyPhone] = useState<string>('+223 20 00 00 00');
  const [newCompanyHQ, setNewCompanyHQ] = useState<string>('Bamako, Mali');
  const [newCompanyLogoUrl, setNewCompanyLogoUrl] = useState<string>('');
  const [newCompanyColor, setNewCompanyColor] = useState<string>('#044728');

  // Preview Selected Company
  const [previewCompany, setPreviewCompany] = useState<BusCompany>(companies[0] || null);

  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBrandConfig({
      ...brandConfig,
      brandName,
      slogan,
      supportPhone,
      supportEmail,
      ticketNotice,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Handle Logo Upload from Local Computer (FileReader base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isNew: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (isNew) {
        setNewCompanyLogoUrl(result);
      } else {
        setEditLogoUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenEditCompany = (company: BusCompany) => {
    setEditingCompany(company);
    setEditLogoUrl(company.logoUrl || '');
    setEditBrandColor(company.brandColor || '#044728');
    setLogoSaveSuccess(false);
  };

  const handleSaveCompanyLogo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    const updated: BusCompany = {
      ...editingCompany,
      logoUrl: editLogoUrl || createCompanySvgLogo(editingCompany.name, editingCompany.logoText, editBrandColor, '#0f766e'),
      brandColor: editBrandColor,
    };

    onUpdateCompany(updated);
    setPreviewCompany(updated);
    setLogoSaveSuccess(true);
    setTimeout(() => {
      setEditingCompany(null);
      setLogoSaveSuccess(false);
    }, 1200);
  };

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    const acronym = newCompanyAcronym.trim() || newCompanyName.substring(0, 3).toUpperCase();
    const logo = newCompanyLogoUrl || createCompanySvgLogo(newCompanyName, acronym, newCompanyColor, '#0f766e');

    const created: BusCompany = {
      id: `company_${Date.now()}`,
      name: newCompanyName,
      logoText: acronym,
      logoUrl: logo,
      brandColor: newCompanyColor,
      rating: 4.8,
      totalReviews: 120,
      phone: newCompanyPhone,
      headquarters: newCompanyHQ,
      amenitiesDescription: 'Liaisons régulières interurbaines et internationales grand confort.',
      verified: true,
    };

    onAddCompany(created);
    setPreviewCompany(created);
    setShowAddCompanyModal(false);

    // Reset
    setNewCompanyName('');
    setNewCompanyAcronym('');
    setNewCompanyLogoUrl('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Editorial Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <span>Paramètres & Personnalisation de Marque</span>
          <span aria-hidden="true">·</span>
          <span>Logos des Compagnies & Impression</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Paramètres Généraux & Logos des Compagnies
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Personnalisez le nom et la devise de votre plateforme, gérez et téléversez les <strong>logos officiels des compagnies de car</strong>, et vérifiez leur impression directe sur les billets et cartes d'embarquement.
        </p>
      </div>

      {/* SECTION 1: GESTION DES LOGOS DES COMPAGNIES */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Logos des Compagnies & Rendu sur les Billets
              </h3>
              <p className="text-xs text-slate-500">
                Chaque billet et impression PDF affiche automatiquement le logo de la compagnie choisie par le voyageur.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddCompanyModal(true)}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 self-start cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une Compagnie & son Logo</span>
          </button>
        </div>

        {/* Companies Grid with Logos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((comp) => (
            <div
              key={comp.id}
              className={`p-4 rounded-2xl border transition-all ${
                previewCompany?.id === comp.id
                  ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Agréée
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenEditCompany(comp)}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Modifier le Logo</span>
                </button>
              </div>

              {/* Logo Preview Container */}
              <div className="h-16 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center p-2 mb-3">
                {comp.logoUrl ? (
                  <img
                    src={comp.logoUrl}
                    alt={`Logo ${comp.name}`}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-xs font-bold font-mono text-slate-400">
                    Aucun logo
                  </div>
                )}
              </div>

              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-slate-900 text-sm">{comp.name}</h4>
                <p className="text-slate-500 text-[11px]">{comp.headquarters} · {comp.phone}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => setPreviewCompany(comp)}
                  className="text-emerald-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>Voir le rendu sur le billet</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Live Boarding Pass Logo Preview Banner */}
        {previewCompany && (
          <div className="mt-6 p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                Aperçu de l'En-tête Imprimé pour : {previewCompany.name}
              </span>
              <span className="text-slate-400 text-[11px]">Format Billet & Impression PDF</span>
            </div>

            <div className="bg-emerald-950/80 rounded-xl p-4 border border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-lg font-black text-white">{brandConfig.brandName}</span>
                <span className="text-[10px] bg-emerald-800 text-amber-300 font-mono px-2 py-0.5 rounded ml-2 uppercase font-bold">
                  E-BILLET
                </span>
                <p className="text-[11px] text-emerald-200 mt-0.5">
                  Ligne : Bamako ➔ Sikasso · Réf PNR : AFW-94812-BKO
                </p>
              </div>

              {/* Company Logo rendered on the ticket header */}
              <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl shadow-md">
                {previewCompany.logoUrl ? (
                  <img
                    src={previewCompany.logoUrl}
                    alt={previewCompany.name}
                    className="h-10 max-w-[140px] object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs">
                    {previewCompany.logoText}
                  </div>
                )}
                <div className="text-left border-l border-slate-200 pl-2">
                  <span className="text-[9px] text-slate-400 uppercase block font-semibold">Transporteur</span>
                  <span className="text-xs font-black text-slate-900 block leading-tight">{previewCompany.name}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: PARAMÈTRES GÉNÉRAUX DE LA PLATEFORME */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 pb-5 border-b border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Paramètres Généraux de l'Application
            </h3>
            <p className="text-xs text-slate-500">
              Changez le nom commercial (AFRIWAY, AFRI BUS ou nom sur mesure), la devise par défaut et les textes de vos billets.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveBrand} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nom de la Plateforme (Marque)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Ex: AFRIWAY ou AFRI BUS"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-700 font-mono"
              />
              <button
                type="button"
                onClick={() => setBrandName('AFRIWAY')}
                className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer font-semibold"
              >
                AFRIWAY
              </button>
              <button
                type="button"
                onClick={() => setBrandName('AFRI BUS')}
                className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer font-semibold"
              >
                AFRI BUS
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Slogan Commercial</label>
            <input
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="Ex: Votre voyage, partout en Afrique."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Devise Principale du Système</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-emerald-900"
            >
              <option value="XOF">FCFA (XOF - Mali, Sénégal, Côte d'Ivoire, Burkina Faso, Togo, Bénin, Niger)</option>
              <option value="GNF">Franc Guinéen (GNF - Guinée Conakry)</option>
              <option value="MRU">Ouguiya (MRU - Mauritanie)</option>
              <option value="EUR">Euro (€ - Pour la Diaspora Européenne)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Langue de l'Interface</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
            >
              <option value="fr">Français (Langue officielle)</option>
              <option value="bm">Bambara / Bamanankan (Mali)</option>
              <option value="wo">Wolof (Sénégal)</option>
              <option value="en">English (International)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Numéro d'Assistance / WhatsApp</label>
            <input
              type="text"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              placeholder="+223 20 28 00 00"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Email de Contact Support</label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="support@afriway.africa"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-slate-700 font-semibold mb-1">
              Consigne & Mentions Légales affichées au bas de chaque billet
            </label>
            <input
              type="text"
              value={ticketNotice}
              onChange={(e) => setTicketNotice(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
            />
          </div>

          <div className="md:col-span-2 pt-2 flex items-center justify-between">
            <span className="text-slate-500">
              {isSaved ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Paramètres sauvegardés avec succès !
                </span>
              ) : (
                'Toutes les modifications sont immédiatement appliquées aux billets et impressions.'
              )}
            </span>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs cursor-pointer transition-all active:scale-[0.98] flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les Paramètres</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 3: GUIDE DES APIS DE PRODUCTION */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-900">
          Guide des Intégrations de Production
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Mobile Money */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Passerelles Mobile Money (Paiement)</h4>
                <p className="text-xs text-slate-500">Orange Money (#144#), Wave, Moov, MTN</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pour encaisser à distance au Mali, Sénégal et Côte d'Ivoire, trois approches de production existent :
            </p>
            <ul className="text-xs space-y-2 text-slate-700">
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-800 shrink-0">1. Agrégateurs régionaux :</span>
                <span><strong>PayDunya</strong>, <strong>Bizao</strong> ou <strong>CinetPay</strong>. Un seul contrat permet d'activer Orange Money, Wave et Moov dans 8 pays UEMOA.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-800 shrink-0">2. Wave Checkout API :</span>
                <span>Contrat marchand direct avec Wave Digital Finance (Sénégal/CI). Taux de commission de 1%.</span>
              </li>
            </ul>
          </div>

          {/* Card 2: SMS & WhatsApp */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Notifications SMS & WhatsApp Cloud API</h4>
                <p className="text-xs text-slate-500">Envoi automatisé du billet PDF et du QR Code</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dès validation du paiement, le voyageur doit recevoir son billet par message texte :
            </p>
            <ul className="text-xs space-y-2 text-slate-700">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-800 shrink-0">Orange SMS API / Moov SMS :</span>
                <span>Passerelles locales pour l'envoi de SMS transactionnels avec Sender ID vérifié ("AFRIWAY").</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-800 shrink-0">WhatsApp Business API :</span>
                <span>Envoi direct du PDF et du QR code dans WhatsApp (&gt; 95% d'ouverture en Afrique de l'Ouest).</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* MODAL 1: MODIFIER LE LOGO D'UNE COMPAGNIE */}
      {editingCompany && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Modifier le Logo de la Compagnie</h4>
                  <p className="text-xs text-slate-500">{editingCompany.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingCompany(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {logoSaveSuccess ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h5 className="font-bold text-slate-900 text-base">Logo mis à jour avec succès !</h5>
                <p className="text-xs text-slate-600">
                  Le logo de <strong>{editingCompany.name}</strong> apparaîtra maintenant sur tous les billets et impressions de cette compagnie.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveCompanyLogo} className="space-y-4 text-xs">
                {/* Current / New Logo Preview */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Aperçu Actuel du Logo
                  </span>
                  <div className="h-16 flex items-center justify-center bg-white rounded-xl border border-slate-200 p-2">
                    {editLogoUrl ? (
                      <img src={editLogoUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-slate-400 font-mono text-xs">Aucun logo configuré</span>
                    )}
                  </div>
                </div>

                {/* Option A: Upload file from computer */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Option 1 : Téléverser un fichier logo depuis votre appareil (PNG, JPG, SVG)
                  </label>
                  <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-dashed border-slate-300 rounded-xl cursor-pointer text-slate-700 font-medium transition-colors">
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>Choisir un fichier image sur mon ordinateur</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, false)}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Option B: Enter image URL */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Option 2 : Ou coller l'URL d'une image en ligne
                  </label>
                  <input
                    type="text"
                    value={editLogoUrl}
                    onChange={(e) => setEditLogoUrl(e.target.value)}
                    placeholder="https://exemple.com/logo-nour.png ou data:image/..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                {/* Brand Color selection */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Couleur de marque de la compagnie
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editBrandColor}
                      onChange={(e) => setEditBrandColor(e.target.value)}
                      className="w-10 h-9 p-0.5 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editBrandColor}
                      onChange={(e) => setEditBrandColor(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingCompany(null)}
                    className="px-4 py-2 bg-slate-100 rounded-xl text-slate-600 font-semibold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                  >
                    Enregistrer le Logo
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: AJOUTER UNE NOUVELLE COMPAGNIE */}
      {showAddCompanyModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Ajouter une Nouvelle Compagnie</h4>
                  <p className="text-xs text-slate-500">Intégration d'un transporteur partenaire</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCompanyModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nom de la Compagnie *</label>
                  <input
                    type="text"
                    required
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="Ex: Sahel Express"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Sigle / Acronyme *</label>
                  <input
                    type="text"
                    required
                    value={newCompanyAcronym}
                    onChange={(e) => setNewCompanyAcronym(e.target.value)}
                    placeholder="Ex: SE"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Téléphone de la Compagnie</label>
                  <input
                    type="text"
                    value={newCompanyPhone}
                    onChange={(e) => setNewCompanyPhone(e.target.value)}
                    placeholder="+223 20 00 00 00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Siège Social / Ville</label>
                  <input
                    type="text"
                    value={newCompanyHQ}
                    onChange={(e) => setNewCompanyHQ(e.target.value)}
                    placeholder="Bamako, Mali"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              {/* Logo Upload for New Company */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Logo de la Compagnie</label>
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-dashed border-slate-300 rounded-xl cursor-pointer text-slate-700 font-medium transition-colors">
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span>Téléverser une image de logo (PNG, JPG)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, true)}
                    className="hidden"
                  />
                </label>
                {newCompanyLogoUrl && (
                  <div className="mt-2 h-14 bg-slate-50 rounded-lg border flex items-center justify-center p-1">
                    <img src={newCompanyLogoUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                  </div>
                )}
              </div>

              {/* Brand color */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Couleur Principale</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newCompanyColor}
                    onChange={(e) => setNewCompanyColor(e.target.value)}
                    className="w-10 h-8 p-0.5 rounded-lg border border-slate-200 cursor-pointer"
                  />
                  <span className="font-mono text-slate-600">{newCompanyColor}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCompanyModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-slate-600 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Créer la Compagnie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
