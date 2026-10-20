import React, { useState, useEffect } from 'react';
import { SmsNotification } from '../services/smsService';
import { MessageSquare, CheckCircle, Copy, Check, X, Smartphone, BellRing } from 'lucide-react';

interface SmsNotificationBannerProps {
  notification: SmsNotification | null;
  onDismiss: () => void;
}

export const SmsNotificationBanner: React.FC<SmsNotificationBannerProps> = ({
  notification,
  onDismiss,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  useEffect(() => {
    if (!notification) return;
    setCopied(false);

    // Auto-dismiss after 8 seconds unless hovered
    if (!isHovered) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [notification, isHovered, onDismiss]);

  if (!notification) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(notification.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed top-4 right-4 z-50 max-w-md w-[calc(100vw-2rem)] animate-in slide-in-from-top-4 fade-in duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white border border-emerald-500/50 shadow-2xl rounded-2xl overflow-hidden ring-1 ring-emerald-500/20">
        {/* Top header styled like a smartphone notification */}
        <div className="bg-slate-800/90 px-4 py-2 flex items-center justify-between border-b border-slate-700/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
              <MessageSquare className="w-3.5 h-3.5" />
            </span>
            <span className="font-bold text-slate-200 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
              <span>{notification.senderId}</span>
              <span className="text-slate-400 font-normal">·</span>
              <span className="text-emerald-400 font-medium">{notification.carrier}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">À l'instant</span>
            <button
              onClick={onDismiss}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-700/60 transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Message Content */}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>SMS de confirmation expédié au voyageur</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Destinataire : <strong className="text-slate-200">{notification.recipientName}</strong> ({notification.recipientPhone})
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
              PNR: {notification.pnr}
            </span>
          </div>

          {/* SMS Bubble */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 leading-relaxed select-all">
            {notification.message}
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-slate-400" />
              <span>Simulé sur le réseau {notification.carrier}</span>
            </span>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copié</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span>Copier le SMS</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress timer bar */}
        <div className="h-0.5 bg-slate-800 w-full overflow-hidden">
          <div className="h-full bg-emerald-500 animate-[shrink_8s_linear]" />
        </div>
      </div>
    </div>
  );
};
