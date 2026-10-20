import React, { useState } from 'react';
import { UserAccount, UserRole } from '../types';
import { 
  signInUser, 
  registerUser, 
  signOutAccount, 
  DEMO_ACCOUNTS 
} from '../services/authService';
import { 
  X, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  Smartphone, 
  Store, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  MapPin, 
  LogOut, 
  Check, 
  AlertCircle,
  Loader2,
  Building2
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onUserChange: (user: UserAccount | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
}) => {
  const [tab, setTab] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [role, setRole] = useState<UserRole>('traveler');
  const [phone, setPhone] = useState<string>('');
  const [assignedStation, setAssignedStation] = useState<string>('Gare Routière Sogoniko, Bamako');
  const [assignedCompanyName, setAssignedCompanyName] = useState<string>('Nour Transport');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInUser(email, password);
      onUserChange(user);
      setSuccessMsg(`Connexion réussie ! Bienvenue ${user.displayName}`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Sign in error:', err);
      setErrorMsg(err.message || 'Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await registerUser(
        email, 
        password, 
        displayName, 
        role, 
        phone, 
        assignedStation, 
        assignedCompanyName
      );
      onUserChange(user);
      setSuccessMsg(`Compte créé avec succès ! Bienvenue ${user.displayName}`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMsg(err.message || 'Échec de la création du compte.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demo: UserAccount) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInUser(demo.email, '123456');
      onUserChange(user);
      setSuccessMsg(`Connecté en tant que ${demo.displayName} (${demo.role === 'controller' ? 'Contrôleur Quai' : demo.role})`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg('Erreur de connexion rapide.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOutAccount();
    onUserChange(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between border-b-2 border-amber-500">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center font-black">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Authentification & Comptes
              </h3>
              <p className="text-xs text-emerald-200">
                Espace Sécurisé AFRIWAY · Profil & Contrôleurs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-full hover:bg-emerald-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CURRENTLY LOGGED IN VIEW */}
        {currentUser ? (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-black text-xl shadow-md">
                {currentUser.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-slate-900 text-base truncate">
                    {currentUser.displayName}
                  </h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    currentUser.role === 'controller'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : currentUser.role === 'counter_agent'
                      ? 'bg-blue-100 text-blue-900 border border-blue-300'
                      : currentUser.role === 'platform_admin'
                      ? 'bg-purple-100 text-purple-900 border border-purple-300'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}>
                    {currentUser.role === 'controller' ? 'Contrôleur Quai' : currentUser.role}
                  </span>
                </div>
                <p className="text-xs text-slate-600 truncate mt-0.5">{currentUser.email}</p>
                {currentUser.assignedStation && (
                  <p className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{currentUser.assignedStation}</span>
                  </p>
                )}
              </div>
            </div>

            {currentUser.role === 'controller' && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs text-amber-950 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <Smartphone className="w-4 h-4 text-amber-700" />
                  <span>Mode Contrôleur Téléphone Actif</span>
                </div>
                <p>
                  Ce compte est configuré en mode <strong>Contrôleur Quai & Bord</strong>. Il est spécialement verrouillé pour scanner et vérifier les billets sur smartphone avec signal sonore et validation anti-fraude.
                </p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Continuer
              </button>
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        ) : (
          /* LOGIN / REGISTRATION FORMS */
          <div className="p-6 space-y-6">
            
            {/* Notifications */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Quick Demo Fast-Login Cards */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Connexion Rapide par Rôle (Démonstration & Test Terrain) :
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Contrôleur Card Highlighted */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin(DEMO_ACCOUNTS[0])}
                  className="p-3 rounded-xl border-2 border-amber-400 bg-amber-50/80 hover:bg-amber-100/90 text-left transition-all cursor-pointer shadow-xs group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-amber-950 block">Compte Contrôleur</span>
                      <span className="text-[10px] text-amber-800 font-semibold">Téléphone / Scanner Seul</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-900/80 mt-1 line-clamp-1">
                    {DEMO_ACCOUNTS[0].email}
                  </p>
                </button>

                {/* Guichetier Card */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin(DEMO_ACCOUNTS[1])}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Agent Guichet</span>
                      <span className="text-[10px] text-slate-500 font-medium">Vente Express Gare</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1">
                    {DEMO_ACCOUNTS[1].email}
                  </p>
                </button>
              </div>
            </div>

            {/* Tab switch Connexion / Inscription */}
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setTab('signin')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  tab === 'signin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Se Connecter
              </button>
              <button
                type="button"
                onClick={() => setTab('register')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  tab === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Créer un Compte
              </button>
            </div>

            {/* TAB: SIGN IN */}
            {tab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Adresse Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom@afriway.ml"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Pour les comptes tests : mot de passe <code>123456</code>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  <span>Se Connecter</span>
                </button>
              </form>
            )}

            {/* TAB: REGISTER */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom & Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Moussa Diakité"
                    className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="moussa@afriway.ml"
                      className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+223 76 00 00 00"
                      className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mot de passe *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 caractères"
                      className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Rôle du compte *
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="traveler">Voyageur (Achat & Billets)</option>
                      <option value="controller">Contrôleur Quai (Scanner Téléphone)</option>
                      <option value="counter_agent">Agent Guichet Gare</option>
                      <option value="company_manager">Directeur Compagnie</option>
                    </select>
                  </div>
                </div>

                {/* Additional fields if Controller or Guichet */}
                {(role === 'controller' || role === 'counter_agent') && (
                  <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-emerald-900 block">
                      Affectation de l'Agent :
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-0.5">Gare / Quai</label>
                        <input
                          type="text"
                          value={assignedStation}
                          onChange={(e) => setAssignedStation(e.target.value)}
                          placeholder="Gare Sogoniko"
                          className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-0.5">Compagnie Agréée</label>
                        <input
                          type="text"
                          value={assignedCompanyName}
                          onChange={(e) => setAssignedCompanyName(e.target.value)}
                          placeholder="Nour Transport"
                          className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>Créer mon Compte</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
