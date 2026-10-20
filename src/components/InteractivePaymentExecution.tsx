import React, { useState, useEffect } from 'react';
import { PaymentProvider, Currency, PaymentTransaction } from '../types';
import { formatPrice } from '../utils/currency';
import { 
  PAYMENT_PROVIDERS_CATALOG, 
  createAndSaveTransaction, 
  validateLuhn, 
  detectCardBrand 
} from '../services/paymentService';
import QRCode from 'qrcode';
import { 
  Smartphone, 
  CreditCard, 
  ShieldCheck, 
  QrCode as QrIcon, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  KeyRound, 
  Clock, 
  ExternalLink,
  Lock,
  ArrowRight,
  RefreshCw,
  Building2,
  Check
} from 'lucide-react';

interface InteractivePaymentExecutionProps {
  provider: PaymentProvider;
  totalAmountXOF: number;
  currency: Currency;
  payerPhone: string;
  payerEmail?: string;
  passengerName: string;
  pnr: string;
  bookingId: string;
  onPaymentSuccess: (transaction: PaymentTransaction) => void;
  onCancel: () => void;
}

export const InteractivePaymentExecution: React.FC<InteractivePaymentExecutionProps> = ({
  provider,
  totalAmountXOF,
  currency,
  payerPhone,
  payerEmail,
  passengerName,
  pnr,
  bookingId,
  onPaymentSuccess,
  onCancel,
}) => {
  const metadata = PAYMENT_PROVIDERS_CATALOG[provider];
  const feeXOF = Math.round((totalAmountXOF * metadata.feePercent) / 100);
  const totalWithFee = totalAmountXOF + feeXOF;

  // Common execution states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 1. Wave states
  const [waveQrUrl, setWaveQrUrl] = useState<string>('');
  const [waveSecondsLeft, setWaveSecondsLeft] = useState<number>(300);

  // 2. Orange Money states
  const [omMode, setOmMode] = useState<'otp' | 'push_ussd'>('otp');
  const [omOtpCode, setOmOtpCode] = useState<string>('');

  // 3. MTN MoMo / Moov states
  const [ussdPin, setUssdPin] = useState<string>('');
  const [ussdStep, setUssdStep] = useState<'waiting_prompt' | 'pin_entry' | 'authorizing'>('waiting_prompt');

  // 4. Card states
  const [cardNumber, setCardNumber] = useState<string>('4532 8900 1234 5678');
  const [cardHolder, setCardHolder] = useState<string>(passengerName || 'Moussa Diallo');
  const [cardExpiry, setCardExpiry] = useState<string>('08/28');
  const [cardCvv, setCardCvv] = useState<string>('348');
  const [show3dSecureModal, setShow3dSecureModal] = useState<boolean>(false);
  const [bankOtpInput, setBankOtpInput] = useState<string>('');

  // 5. CinetPay states
  const [cinetpayCountry, setCinetpayCountry] = useState<string>('Mali');
  const [cinetpayChannel, setCinetpayChannel] = useState<string>('orange_money');

  // Generate Wave QR Code
  useEffect(() => {
    if (provider === 'wave') {
      const wavePayload = `https://pay.wave.com/m/afriway_${pnr}?amount=${totalWithFee}&currency=XOF`;
      QRCode.toDataURL(wavePayload, {
        width: 260,
        margin: 1,
        color: {
          dark: '#0891b2',
          light: '#ffffff',
        },
      }).then(setWaveQrUrl).catch(console.error);

      const interval = setInterval(() => {
        setWaveSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [provider, pnr, totalWithFee]);

  // Handle final completion
  const handleFinalize = async (extraDetails?: {
    cardLast4?: string;
    cardBrand?: 'visa' | 'mastercard' | 'gim_uemoa';
    providerRef?: string;
    methodNotes?: string;
  }) => {
    setIsProcessing(true);
    setErrorMessage('');

    try {
      // Simulate real gateway response time
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const transaction = await createAndSaveTransaction({
        bookingId,
        pnr,
        provider,
        amountXOF: totalAmountXOF,
        currency,
        payerPhone,
        payerName: passengerName,
        payerEmail,
        cardLast4: extraDetails?.cardLast4,
        cardBrand: extraDetails?.cardBrand,
        providerReference: extraDetails?.providerRef,
        paymentMethodDetails: extraDetails?.methodNotes,
      });

      setIsProcessing(false);
      onPaymentSuccess(transaction);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Erreur lors de la validation du paiement.');
    }
  };

  // Card validation & 3D Secure trigger
  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLuhn(cardNumber)) {
      setErrorMessage('Numéro de carte bancaire invalide (Contrôle algorithme de Luhn échoué).');
      return;
    }
    if (!cardExpiry.includes('/') || cardExpiry.length < 5) {
      setErrorMessage('Date d\'expiration invalide (format MM/AA requis).');
      return;
    }
    if (cardCvv.length < 3) {
      setErrorMessage('Code CVV invalide (3 chiffres au verso).');
      return;
    }
    setErrorMessage('');
    setShow3dSecureModal(true);
  };

  const handleVerify3dSecure = () => {
    if (bankOtpInput.trim().length < 4) {
      setErrorMessage('Veuillez saisir le code SMS 3D Secure reçu.');
      return;
    }
    setShow3dSecureModal(false);
    const cleanNum = cardNumber.replace(/\D/g, '');
    const cardLast4 = cleanNum.slice(-4);
    const detected = detectCardBrand(cardNumber);
    const brand = detected === 'generic' ? 'visa' : detected;

    handleFinalize({
      cardLast4,
      cardBrand: brand as any,
      providerRef: `3DS2-AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
      methodNotes: `Carte ${brand.toUpperCase()} certifiée 3D-Secure V2 (code SMS vérifié)`,
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Provider Header Banner */}
      <div className={`p-4 rounded-2xl border ${metadata.bgLight} ${metadata.borderLight} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xs"
            style={{ backgroundColor: metadata.color }}
          >
            {provider === 'wave' && 'W'}
            {provider === 'orange_money' && 'OM'}
            {provider === 'mtn_momo' && 'MTN'}
            {provider === 'moov_money' && 'Moov'}
            {provider === 'cinetpay' && 'CP'}
            {provider === 'paydunya' && 'PD'}
            {provider === 'kkiapay' && 'KK'}
            {provider === 'card' && <CreditCard className="w-6 h-6" />}
            {provider === 'cash_counter' && <Building2 className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">{metadata.name}</h4>
              <span className="text-[10px] bg-white/80 px-2 py-0.5 rounded-full font-semibold text-slate-700 border border-slate-200">
                {metadata.badge}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">{metadata.tagline}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-500 block">Total à débiter</span>
          <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
            {formatPrice(totalWithFee, currency)}
          </span>
          {feeXOF > 0 && (
            <span className="text-[10px] text-slate-500 block">Dont frais : +{formatPrice(feeXOF, currency)}</span>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. WAVE INTERACTION */}
      {provider === 'wave' && (
        <div className="space-y-6 text-center">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 max-w-sm mx-auto">
            <div className="relative inline-block p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
              {waveQrUrl ? (
                <img src={waveQrUrl} alt="Wave QR Code" className="w-48 h-48 mx-auto rounded-lg" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
                </div>
              )}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-cyan-500 text-white font-black text-xs px-2 py-1 rounded-md shadow-md border-2 border-white">
                WAVE
              </div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-600" />
              <span>Expire dans {Math.floor(waveSecondsLeft / 60)}:{(waveSecondsLeft % 60).toString().padStart(2, '0')}</span>
            </div>

            <p className="text-xs text-slate-600 mt-2">
              Ouvrez votre application <strong>Wave</strong> et appuyez sur l'icône <strong>Scanner</strong> pour régler instantanément.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleFinalize({
                providerRef: `WAVE-SCAN-${Date.now()}`,
                methodNotes: 'Paiement validé par scan de QR Code Wave direct',
              })}
              disabled={isProcessing}
              className="w-full sm:w-auto px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Vérification auprès de Wave...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simuler le scan & Valider le paiement</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleFinalize({
                providerRef: `WAVE-APP-${Date.now()}`,
                methodNotes: 'Paiement validé via deep-link Wave App',
              })}
              disabled={isProcessing}
              className="w-full sm:w-auto px-5 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-cyan-600" />
              <span>Payer dans l'App Wave</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. ORANGE MONEY INTERACTION */}
      {provider === 'orange_money' && (
        <div className="space-y-5">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setOmMode('otp')}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                omMode === 'otp'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mode Code OTP (#144#)
            </button>
            <button
              type="button"
              onClick={() => setOmMode('push_ussd')}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                omMode === 'push_ussd'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mode Notification Push USSD
            </button>
          </div>

          {omMode === 'otp' ? (
            <div className="space-y-4 bg-orange-50/50 p-5 rounded-2xl border border-orange-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div className="text-xs text-orange-950 space-y-1">
                  <h5 className="font-bold">Comment obtenir votre code secret d'autorisation ?</h5>
                  <p className="text-orange-900">
                    1. Composez le <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-orange-300">#144#391#</strong> sur votre mobile Orange (ou ouvrez l'application <strong>Max it</strong>).
                  </p>
                  <p className="text-orange-900">
                    2. Saisissez votre code PIN Orange Money. Vous recevrez un code OTP à 4 chiffres valable 15 minutes.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Code d'autorisation OTP Orange Money (4 chiffres) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={omOtpCode}
                    onChange={(e) => setOmOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 8492"
                    className="w-40 px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setOmOtpCode('7429')}
                    className="px-3 py-2 text-[11px] font-semibold bg-white border border-orange-300 text-orange-700 hover:bg-orange-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Générer code démo (7429)
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (omOtpCode.length < 4) {
                    setErrorMessage('Veuillez renseigner le code d\'autorisation OTP à 4 chiffres.');
                    return;
                  }
                  handleFinalize({
                    providerRef: `OM-OTP-${omOtpCode}-${Date.now()}`,
                    methodNotes: `Orange Money WebPay avec code d'autorisation OTP (#144#) validé`,
                  });
                }}
                disabled={isProcessing}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validation Orange Money en cours...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Valider le code OTP et payer</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3">
                <Smartphone className="w-6 h-6 text-orange-600" />
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Demande Push instantanée</h5>
                  <p className="text-xs text-slate-500">
                    Un message de confirmation va s'afficher sur votre téléphone <strong>{payerPhone}</strong>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleFinalize({
                  providerRef: `OM-PUSH-${Date.now()}`,
                  methodNotes: `Notification Push USSD Orange Money approuvée`,
                })}
                disabled={isProcessing}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>En attente de votre validation mobile...</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4" />
                    <span>Envoyer la demande Push USSD</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. MTN MOMO INTERACTION */}
      {provider === 'mtn_momo' && (
        <div className="space-y-5">
          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <Smartphone className="w-4 h-4 text-amber-600" />
              <span>Validation interactive MTN MoMo Open API (Collections requestToPay)</span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Une invite de paiement de <strong className="font-mono">{formatPrice(totalWithFee, currency)}</strong> a été transmise au numéro <strong className="font-mono">{payerPhone}</strong>.
            </p>

            {/* Simulated Phone Screen */}
            <div className="bg-slate-900 text-white p-4 rounded-xl font-mono text-xs max-w-sm mx-auto shadow-md space-y-2 border border-amber-400/40">
              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                --- MTN MOBILE MONEY ---
              </div>
              <p className="text-slate-200">
                Paiement AFRIWAY : {formatPrice(totalWithFee, currency)} pour le PNR {pnr}.
              </p>
              <div className="pt-2">
                <label className="block text-[11px] text-slate-400 mb-1">Entrez votre code secret MTN :</label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={ussdPin}
                    onChange={(e) => setUssdPin(e.target.value)}
                    placeholder="••••"
                    className="w-24 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-center text-sm tracking-widest text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setUssdPin('1234')}
                    className="text-[10px] text-amber-400 underline cursor-pointer"
                  >
                    Code démo (1234)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleFinalize({
              providerRef: `MTN-REF-${Date.now()}`,
              methodNotes: 'MTN Mobile Money Collections API requestToPay validé',
            })}
            disabled={isProcessing}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Validation MTN MoMo...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Confirmer l'approbation MTN MoMo</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 4. MOOV MONEY INTERACTION */}
      {provider === 'moov_money' && (
        <div className="space-y-5">
          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>Demande d'autorisation Moov Money / Flooz (*155#)</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Une demande de débit de <strong className="font-mono">{formatPrice(totalWithFee, currency)}</strong> a été envoyée au mobile <strong className="font-mono">{payerPhone}</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleFinalize({
              providerRef: `MOOV-FLOOZ-${Date.now()}`,
              methodNotes: 'Moov Money / Flooz Push USSD approuvé',
            })}
            disabled={isProcessing}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Confirmation Flooz en cours...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Valider le prélèvement Moov Money</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 5. CINETPAY INTERACTION */}
      {provider === 'cinetpay' && (
        <div className="space-y-5">
          <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Guichet Unique Panafricain CinetPay (10 Pays UEMOA/CEMAC)</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                PCI-DSS Level 1
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Sélectionnez le pays :</label>
                <select
                  value={cinetpayCountry}
                  onChange={(e) => setCinetpayCountry(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium text-slate-900"
                >
                  <option value="Mali">Mali</option>
                  <option value="Sénégal">Sénégal</option>
                  <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                  <option value="Burkina Faso">Burkina Faso</option>
                  <option value="Togo">Togo</option>
                  <option value="Bénin">Bénin</option>
                  <option value="Guinée">Guinée</option>
                  <option value="Niger">Niger</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Réseau partenaire :</label>
                <select
                  value={cinetpayChannel}
                  onChange={(e) => setCinetpayChannel(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium text-slate-900"
                >
                  <option value="orange_money">Orange Money</option>
                  <option value="wave">Wave</option>
                  <option value="mtn_momo">MTN MoMo</option>
                  <option value="moov_money">Moov Money</option>
                  <option value="card">Carte Bancaire Visa / Mastercard</option>
                </select>
              </div>
            </div>

            <p className="text-[11px] text-slate-600">
              La transaction sera enregistrée et réconciliée sous la référence passerelle sécurisée CinetPay API v2.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleFinalize({
              providerRef: `CPAY-${cinetpayCountry.substring(0, 2).toUpperCase()}-${Date.now()}`,
              methodNotes: `CinetPay Gateway (${cinetpayCountry} - ${cinetpayChannel})`,
            })}
            disabled={isProcessing}
            className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connexion passerelle CinetPay...</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                <span>Payer via la passerelle CinetPay</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 6. PAYDUNYA / KKIAPAY INTERACTION */}
      {(provider === 'paydunya' || provider === 'kkiapay') && (
        <div className="space-y-5">
          <div className="bg-indigo-50/70 p-5 rounded-2xl border border-indigo-200 space-y-2">
            <h5 className="text-xs font-bold text-slate-900">
              Passerelle Régionale {metadata.name}
            </h5>
            <p className="text-xs text-slate-600 leading-relaxed">
              Paiement direct sécurisé pour le {metadata.tagline}. Débit instantané sur votre compte ou portefeuille électronique.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleFinalize({
              providerRef: `${provider.toUpperCase()}-TX-${Date.now()}`,
              methodNotes: `Session ${metadata.name} validée avec succès`,
            })}
            disabled={isProcessing}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Autorisation en cours...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Valider avec {metadata.name}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 7. BANK CARD INTERACTION WITH 3D SECURE MODAL */}
      {provider === 'card' && (
        <form onSubmit={handleCardSubmit} className="space-y-4">
          {/* Card Visual Card */}
          <div className="relative rounded-2xl p-5 text-white bg-gradient-to-tr from-slate-900 via-slate-800 to-emerald-950 shadow-xl overflow-hidden border border-slate-700 max-w-sm mx-auto">
            <div className="flex justify-between items-start mb-6">
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-400">
                AFRIWAY SECURE CARD
              </span>
              <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                {detectCardBrand(cardNumber).toUpperCase()}
              </span>
            </div>

            <div className="font-mono text-lg font-bold tracking-widest mb-4">
              {cardNumber || '•••• •••• •••• ••••'}
            </div>

            <div className="flex justify-between items-end text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block">Titulaire</span>
                <span className="font-semibold uppercase">{cardHolder || 'NOM DU VOYAGEUR'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Expire fin</span>
                <span className="font-semibold">{cardExpiry || 'MM/AA'}</span>
              </div>
            </div>
          </div>

          {/* Card Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Numéro de carte bancaire *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                    const formatted = v.replace(/(.{4})/g, '$1 ').trim();
                    setCardNumber(formatted);
                  }}
                  placeholder="4532 8900 1234 5678"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nom du titulaire *</label>
              <input
                type="text"
                required
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                placeholder="Ex: Moussa Diallo"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Expiration *</label>
                <input
                  type="text"
                  maxLength={5}
                  required
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  placeholder="MM/AA"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">CVV *</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                  placeholder="123"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Payer {formatPrice(totalWithFee, currency)} par Carte</span>
          </button>
        </form>
      )}

      {/* 8. CASH COUNTER INTERACTION */}
      {provider === 'cash_counter' && (
        <div className="space-y-5">
          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-emerald-950 text-xs">
              <Building2 className="w-5 h-5 text-emerald-800" />
              <span>Règlement en Espèces au Guichet de la Gare</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Votre place sera bloquée avec le numéro PNR <strong className="font-mono text-emerald-900">{pnr}</strong>. Présentez-vous auprès de l'agent de guichet physique au moins <strong>45 minutes avant le départ</strong> pour régler en espèces et retirer votre billet imprimé.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleFinalize({
              providerRef: `CSH-GCH-${Date.now()}`,
              methodNotes: 'Réservation enregistrée pour paiement en espèces au guichet de gare',
            })}
            disabled={isProcessing}
            className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enregistrement de la réservation...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmer la réservation avec paiement au guichet</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Cancel or Back button */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
        >
          Choisir un autre moyen de paiement
        </button>
      </div>

      {/* 3D SECURE CHALLENGE MODAL */}
      {show3dSecureModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900">3D-Secure 2.0 · Verified by Visa</h4>
              </div>
              <span className="text-[10px] bg-slate-100 font-mono text-slate-600 px-2 py-0.5 rounded">
                DSP2 Compliant
              </span>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                Pour sécuriser votre transaction de <strong>{formatPrice(totalWithFee, currency)}</strong>, votre banque a envoyé un code secret par SMS au <strong>+223 ••• •• 56</strong>.
              </p>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Code de confirmation SMS *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={bankOtpInput}
                    onChange={(e) => setBankOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 584920"
                    className="w-36 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-center font-mono font-bold text-slate-900 tracking-widest text-base focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                  <button
                    type="button"
                    onClick={() => setBankOtpInput('584920')}
                    className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-2 rounded-lg font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    Remplir (584920)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShow3dSecureModal(false)}
                className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleVerify3dSecure}
                disabled={isProcessing}
                className="w-2/3 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Authentifier & Débiter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
