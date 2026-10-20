import React, { useState, useEffect } from 'react';
import { UserAccount, UserRole } from '../types';
import { 
  signInUser, 
  registerUser, 
  signOutAccount, 
  DEMO_ACCOUNTS,
  getAllControllers,
  signInControllerWithPin,
  saveCustomController
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
  Building2,
  KeyRound,
  IdCard,
  QrCode,
  ArrowRight
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onUserChange: (user: UserAccount | null) => void;
  initialTab?: 'signin' | 'register' | 'controller';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  initialTab = 'signin',
}) => {
  const [tab, setTab] = useState<'signin' | 'register' | 'controller'>(initialTab);
  
  // Standard Sign-in state
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  
  // Register state
  const [displayName, setDisplayName] = useState<string>('');
  const [role, setRole] = useState<UserRole>('traveler');
  const [phone, setPhone] = useState<string>('');
  const [assignedStation, setAssignedStation] = useState<string>('Gare Routière Sogoniko, Bamako');
  const [assignedCompanyName, setAssignedCompanyName] = useState<string>('Nour Transport');

  // Controller-specific PIN & Badge Auth state
  const [controllerIdentifier, setControllerIdentifier] = useState<string>('CTRL-BKO-01');
  const [controllerPin, setControllerPin] = useState<string>('1234');
  const [isRegisteringController, setIsRegisteringController] = useState<boolean>(false);
  const [newCtrlName, setNewCtrlName] = useState<string>('');
  const [newCtrlBadge, setNewCtrlBadge] = useState<string>('CTRL-BKO-05');
  const [newCtrlStation, setNewCtrlStation] = useState<string>('Gare Routière Sogoniko, Bamako');
  const [newCtrlCompany, setNewCtrlCompany] = useState<string>('Nour Transport');
  const [newCtrlPin, setNewCtrlPin] = useState<string>('1234');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync initial tab when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialTab) setTab(initialTab);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialTab]);

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
      }, 1000);
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
      }, 1000);
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMsg(err.message || 'Échec de la création du compte.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleControllerPinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!controllerIdentifier) {
      setErrorMsg("Veuillez saisir votre Matricule Badge ou Email d'agent.");
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInControllerWithPin(controllerIdentifier, controllerPin);
      onUserChange(user);
      setSuccessMsg(`Authentifié avec succès ! Contrôleur : ${user.displayName}`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la connexion contrôleur.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterNewController = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCtrlName || !newCtrlBadge) {
      setErrorMsg('Veuillez indiquer le nom et le numéro de badge.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const newController: UserAccount = {
        uid: `ctrl_${Date.now()}`,
        email: `${newCtrlBadge.toLowerCase().replace(/[^a-z0-9]/g, '')}@afriway.ml`,
        displayName: newCtrlName.trim(),
        role: 'controller',
        badgeId: newCtrlBadge.trim().toUpperCase(),
        devicePin: newCtrlPin.trim() || '1234',
        assignedStation: newCtrlStation,
        assignedCompanyName: newCtrlCompany,
        shiftStatus: 'on_duty',
        createdAt: new Date().toISOString(),
      };
      saveCustomController(newController);
      onUserChange(newController);
      setSuccessMsg(`Compte Contrôleur créé ! Démarrage du terminal pour ${newController.displayName}`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la création du compte contrôleur.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (account: UserAccount) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInUser(account.email, '123456');
      onUserChange(user);
      setSuccessMsg(`Connecté : ${account.displayName} (${account.role === 'controller' ? 'Contrôleur Quai' : account.role})`);
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

  const controllerList = getAllControllers();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden relative my-auto">
        
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between border-b-2 transition-colors ${
          tab === 'controller' || currentUser?.role === 'controller'
            ? 'bg-amber-950 text-white border-amber-500'
            : 'bg-emerald-900 text-white border-emerald-500'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black ${
              tab === 'controller' || currentUser?.role === 'controller'
                ? 'bg-amber-600 text-amber-100 shadow-md'
                : 'bg-emerald-800 text-amber-300'
            }`}>
              {tab === 'controller' || currentUser?.role === 'controller' ? (
                <Smartphone className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>{tab === 'controller' ? 'Espace Contrôleur Téléphone' : 'Authentification & Profils'}</span>
              </h3>
              <p className="text-xs text-amber-200/90">
                {tab === 'controller'
                  ? 'Accès vérification des billets par smartphone uniquement'
                  : 'Réseau de transport AFRIWAY · Espace Sécurisé'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CURRENTLY LOGGED IN VIEW */}
        {currentUser ? (
          <div className="p-6 space-y-6">
            <div className={`p-4 rounded-2xl border ${
              currentUser.role === 'controller'
                ? 'bg-amber-50/80 border-amber-300'
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-md ${
                  currentUser.role === 'controller'
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-800 text-white'
                }`}>
                  {currentUser.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-slate-900 text-base truncate">
                      {currentUser.displayName}
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      currentUser.role === 'controller'
                        ? 'bg-amber-200 text-amber-950 border border-amber-400'
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
                    <p className="text-[11px] text-emerald-900 font-semibold flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 shrink-0 text-emerald-700" />
                      <span>{currentUser.assignedStation}</span>
                    </p>
                  )}
                  {currentUser.assignedCompanyName && (
                    <p className="text-[11px] text-slate-600 font-semibold flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3 shrink-0 text-slate-500" />
                      <span>{currentUser.assignedCompanyName}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {currentUser.role === 'controller' && (
              <div className="bg-amber-100/70 border border-amber-300 rounded-2xl p-4 text-xs text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-black text-amber-900">
                  <Smartphone className="w-4 h-4 text-amber-700" />
                  <span>Terminal de Contrôle Mobile Actif</span>
                </div>
                <p className="text-amber-900/90 leading-relaxed">
                  Votre compte est <strong>strictement restreint au scan et à la validation des billets sur téléphone</strong>. Vous ne pouvez qu'effectuer les vérifications des passagers à l'embarquement et consulter l'historique des scans.
                </p>
                <div className="pt-2 flex items-center justify-between text-[11px] font-bold text-amber-800 border-t border-amber-200/80">
                  <span>Badge ID : {currentUser.badgeId || 'CTRL-BKO-01'}</span>
                  <span>Statut : 🟢 En service</span>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Fermer
              </button>

              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        ) : (
          /* LOGIN / REGISTRATION FORMS */
          <div className="p-6 space-y-5">
            
            {/* Feedback Notifications */}
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

            {/* TAB SWITCHER */}
            <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
              <button
                type="button"
                onClick={() => setTab('controller')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  tab === 'controller' 
                    ? 'bg-amber-500 text-white shadow-xs font-black' 
                    : 'text-amber-900 hover:bg-amber-100/50'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Contrôleur Quai</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('signin')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  tab === 'signin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Connexion
              </button>

              <button
                type="button"
                onClick={() => setTab('register')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  tab === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Créer Compte
              </button>
            </div>

            {/* TAB: CONTROLLER MOBILE AUTHENTICATOR (USER FOCUS) */}
            {tab === 'controller' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 text-amber-950 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-black text-amber-900">
                    <Smartphone className="w-4 h-4 text-amber-700" />
                    <span>Compte Restreint : Téléphone / Scanner Uniquement</span>
                  </div>
                  <p className="text-[11px] text-amber-900/90 leading-relaxed">
                    Un contrôleur de quai accède <strong>exclusivement au terminal mobile</strong> pour vérifier et valider les billets de chaque passager à l'embarquement.
                  </p>
                </div>

                {/* 1-Tap Quick Connect for Active Field Controllers */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Sélectionner un Contrôleur en Service (Accès 1 Clic) :
                  </span>
                  <div className="space-y-2">
                    {controllerList.slice(0, 3).map((ctrl) => (
                      <button
                        key={ctrl.uid}
                        type="button"
                        onClick={() => handleQuickLogin(ctrl)}
                        className="w-full p-2.5 rounded-xl border border-amber-300 bg-amber-50/50 hover:bg-amber-100 text-left transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs">
                            {ctrl.displayName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900">{ctrl.displayName}</span>
                              <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded">
                                {ctrl.badgeId || 'CTRL'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <span>{ctrl.assignedStation?.split(',')[0]}</span>
                              <span>·</span>
                              <span className="font-semibold text-emerald-800">{ctrl.assignedCompanyName}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-bold text-amber-800 group-hover:translate-x-0.5 transition-transform">
                          <span>Démarrer</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct PIN / Badge Login Form */}
                {!isRegisteringController ? (
                  <form onSubmit={handleControllerPinLogin} className="pt-2 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        Connexion par Badge & Code PIN :
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsRegisteringController(true)}
                        className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer"
                      >
                        + Nouveau contrôleur
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Matricule Badge / Email
                        </label>
                        <div className="relative">
                          <IdCard className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                          <input
                            type="text"
                            required
                            value={controllerIdentifier}
                            onChange={(e) => setControllerIdentifier(e.target.value)}
                            placeholder="CTRL-BKO-01"
                            className="w-full pl-8 pr-2.5 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs font-mono font-semibold uppercase focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Code PIN Agent (4 chiffres)
                        </label>
                        <div className="relative">
                          <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                          <input
                            type="password"
                            required
                            maxLength={6}
                            value={controllerPin}
                            onChange={(e) => setControllerPin(e.target.value)}
                            placeholder="1234"
                            className="w-full pl-8 pr-2.5 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs font-mono font-bold tracking-widest focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Smartphone className="w-4 h-4" />
                      )}
                      <span>Ouvrir le Scanner Téléphone de Contrôleur</span>
                    </button>
                  </form>
                ) : (
                  /* Form to register a new controller */
                  <form onSubmit={handleRegisterNewController} className="pt-2 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Enregistrer un Nouveau Contrôleur :
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsRegisteringController(false)}
                        className="text-[11px] font-bold text-slate-500 hover:underline cursor-pointer"
                      >
                        Annuler
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nom & Prénom</label>
                        <input
                          type="text"
                          required
                          value={newCtrlName}
                          onChange={(e) => setNewCtrlName(e.target.value)}
                          placeholder="Ex: Bakary Keïta"
                          className="w-full px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Matricule Badge</label>
                        <input
                          type="text"
                          required
                          value={newCtrlBadge}
                          onChange={(e) => setNewCtrlBadge(e.target.value.toUpperCase())}
                          placeholder="CTRL-BKO-05"
                          className="w-full px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-300 text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Compagnie</label>
                        <input
                          type="text"
                          value={newCtrlCompany}
                          onChange={(e) => setNewCtrlCompany(e.target.value)}
                          placeholder="Nour Transport"
                          className="w-full px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Gare / Quai</label>
                        <input
                          type="text"
                          value={newCtrlStation}
                          onChange={(e) => setNewCtrlStation(e.target.value)}
                          placeholder="Gare Sogoniko, Bamako"
                          className="w-full px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Code PIN (4 chiffres)</label>
                      <input
                        type="password"
                        maxLength={6}
                        value={newCtrlPin}
                        onChange={(e) => setNewCtrlPin(e.target.value)}
                        placeholder="1234"
                        className="w-full px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-300 text-xs font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                      <span>Créer & Activer ce Contrôleur</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB: STANDARD SIGN IN */}
            {tab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Adresse Email ou Identifiant
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom@afriway.ml ou matricule"
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
                    Pour les comptes tests : mot de passe <code>123456</code> ou <code>1234</code>
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
                      minLength={4}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 4 caractères"
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
                      <option value="controller">Contrôleur Quai (Scanner Téléphone Seul)</option>
                      <option value="counter_agent">Agent Guichet Gare</option>
                      <option value="company_manager">Directeur Compagnie</option>
                    </select>
                  </div>
                </div>

                {(role === 'controller' || role === 'counter_agent') && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-amber-900 block">
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
