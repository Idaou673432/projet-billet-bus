import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  CheckCircle2, 
  Share, 
  PlusSquare, 
  MoreVertical, 
  ShieldCheck, 
  WifiOff, 
  Camera, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlatform?: 'android' | 'ios' | 'auto';
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  defaultPlatform = 'auto',
}) => {
  const [platform, setPlatform] = useState<'android' | 'ios'>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Detect OS
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
      if (defaultPlatform === 'auto') {
        setPlatform(isIOS ? 'ios' : 'android');
      } else {
        setPlatform(defaultPlatform);
      }

      // Check if already in standalone / installed mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
      setIsInstalled(!!isStandalone);
    }
  }, [defaultPlatform]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 to-slate-900 border-b border-emerald-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40 font-black">
              <Smartphone className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Installer sur Téléphone</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase">
                  PWA Mobile
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Application 100% adaptée pour contrôleurs de quai et passagers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* OS Switcher Buttons */}
          <div className="grid grid-cols-2 gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
            <button
              onClick={() => setPlatform('android')}
              className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                platform === 'android'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🤖 Android (Samsung, Xiaomi, Tecno...)</span>
            </button>
            <button
              onClick={() => setPlatform('ios')}
              className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                platform === 'ios'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🍎 iPhone / iPad (iOS)</span>
            </button>
          </div>

          {/* Quick 1-Click Install Button if supported by Browser */}
          {deferredPrompt && (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-600/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <p className="font-black text-emerald-300 text-sm">Installation instantanée disponible !</p>
                <p className="text-xs text-slate-300">Votre navigateur supporte l'installation directe en 1 clic.</p>
              </div>
              <button
                onClick={handleInstallClick}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Installer Maintenant</span>
              </button>
            </div>
          )}

          {/* Step by Step Guide for Android */}
          {platform === 'android' && (
            <div className="space-y-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-700">
              <h3 className="font-bold text-amber-300 flex items-center gap-2 text-xs uppercase tracking-wider">
                <Smartphone className="w-4 h-4" />
                <span>Guide d'installation Android (Chrome / Brave / Samsung Internet)</span>
              </h3>
              
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="font-semibold text-slate-200">Ouvrez le menu du navigateur</p>
                    <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                      Appuyez sur les 3 points <MoreVertical className="w-3.5 h-3.5 inline text-amber-400" /> en haut à droite dans Google Chrome.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div>
                    <p className="font-semibold text-slate-200">Sélectionnez "Ajouter à l'écran d'accueil"</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      (ou "Installer l'application" selon la version Android).
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <div>
                    <p className="font-semibold text-slate-200">Confirmez l'installation</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      L'icône AFRIWAY apparaîtra sur l'écran d'accueil de votre téléphone, fonctionnant en plein écran hors-ligne avec accès caméra.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          )}

          {/* Step by Step Guide for iOS / iPhone */}
          {platform === 'ios' && (
            <div className="space-y-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-700">
              <h3 className="font-bold text-amber-300 flex items-center gap-2 text-xs uppercase tracking-wider">
                <Smartphone className="w-4 h-4" />
                <span>Guide d'installation iPhone / iPad (Safari)</span>
              </h3>
              
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="font-semibold text-slate-200">Ouvrez le lien dans Safari</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Assurez-vous d'utiliser le navigateur officiel Apple Safari.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div>
                    <p className="font-semibold text-slate-200">Appuyez sur le bouton Partager</p>
                    <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1.5">
                      C'est l'icône <Share className="w-3.5 h-3.5 inline text-sky-400" /> (carré avec une flèche vers le haut) située au centre de la barre en bas.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <div>
                    <p className="font-semibold text-slate-200">Appuyez sur "Sur l'écran d'accueil"</p>
                    <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                      Faites défiler la liste vers le bas puis touchez <PlusSquare className="w-3.5 h-3.5 inline text-amber-400" /> "Sur l'écran d'accueil".
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">4</span>
                  <div>
                    <p className="font-semibold text-slate-200">Touchez "Ajouter" en haut à droite</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      L'application s'ouvre comme une véritable application iPhone autonome sans la barre de navigation Safari !
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          )}

          {/* Key Advantages for Controllers & Mobile Users */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-2.5">
              <Camera className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-xs">Scan Caméra Live</p>
                <p className="text-[11px] text-slate-400">Scan fluide instantané avec torche et zoom sur quai sombre.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-2.5">
              <WifiOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-xs">100% Hors-Ligne</p>
                <p className="text-[11px] text-slate-400">Contrôle les billets même sans connexion internet ou réseau.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-xs">Anti-Fraude Sécurisé</p>
                <p className="text-[11px] text-slate-400">Détection immédiate des billets déjà scannés ou falsifiés.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Compatible Android 8+, iOS 14+, HarmonyOS
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
