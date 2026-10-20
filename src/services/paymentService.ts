import { PaymentProvider, PaymentTransaction, PaymentGatewaySettings, Currency } from '../types';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const TRANSACTIONS_KEY = 'afriway_payment_transactions_v1';
const GATEWAY_SETTINGS_KEY = 'afriway_gateway_settings_v1';

export interface ProviderMetadata {
  id: PaymentProvider;
  name: string;
  tagline: string;
  badge: string;
  color: string;
  bgLight: string;
  borderLight: string;
  countries: string[];
  feePercent: number;
  ussdCode?: string;
  instructions: string;
  category: 'mobile_money' | 'aggregator' | 'card' | 'cash';
}

export const PAYMENT_PROVIDERS_CATALOG: Record<PaymentProvider, ProviderMetadata> = {
  wave: {
    id: 'wave',
    name: 'Wave',
    tagline: 'Sénégal, Côte d\'Ivoire, Mali, Gambie',
    badge: '1% sans frais cachés',
    color: '#00D6E6',
    bgLight: 'bg-cyan-50/70',
    borderLight: 'border-cyan-400',
    countries: ['Sénégal', 'Côte d\'Ivoire', 'Mali', 'Gambie'],
    feePercent: 1.0,
    instructions: 'Scannez le QR Code Wave officiel ou confirmez l\'autorisation directement dans votre application mobile Wave.',
    category: 'mobile_money',
  },
  orange_money: {
    id: 'orange_money',
    name: 'Orange Money',
    tagline: 'Mali, Sénégal, Côte d\'Ivoire, Burkina Faso, Guinée',
    badge: 'Code OTP #144# ou Push USSD',
    color: '#FF7900',
    bgLight: 'bg-orange-50/70',
    borderLight: 'border-orange-500',
    countries: ['Mali', 'Sénégal', 'Côte d\'Ivoire', 'Burkina Faso', 'Guinée'],
    feePercent: 1.2,
    ussdCode: '#144#391#',
    instructions: 'Générez un code temporaire d\'autorisation via #144# ou approuvez la notification Push instantanée sur votre smartphone.',
    category: 'mobile_money',
  },
  mtn_momo: {
    id: 'mtn_momo',
    name: 'MTN Mobile Money',
    tagline: 'Côte d\'Ivoire, Bénin, Ghana, Cameroun',
    badge: 'Push USSD *133# instantané',
    color: '#FFCC00',
    bgLight: 'bg-amber-50/70',
    borderLight: 'border-amber-400',
    countries: ['Côte d\'Ivoire', 'Bénin', 'Ghana', 'Cameroun'],
    feePercent: 1.5,
    ussdCode: '*133#',
    instructions: 'Recevez l\'invite USSD interactive MTN MoMo sur votre écran de téléphone et confirmez avec votre code PIN secret.',
    category: 'mobile_money',
  },
  moov_money: {
    id: 'moov_money',
    name: 'Moov Money (Flooz)',
    tagline: 'Mali, Burkina Faso, Togo, Bénin, Côte d\'Ivoire',
    badge: 'Push USSD *155# sécurisé',
    color: '#005CA9',
    bgLight: 'bg-blue-50/70',
    borderLight: 'border-blue-500',
    countries: ['Mali', 'Burkina Faso', 'Togo', 'Bénin', 'Côte d\'Ivoire'],
    feePercent: 1.2,
    ussdCode: '*155#',
    instructions: 'Validez la demande de débit Flooz / Moov Money qui apparaît directement sur votre smartphone.',
    category: 'mobile_money',
  },
  cinetpay: {
    id: 'cinetpay',
    name: 'CinetPay Guichet Panafricain',
    tagline: 'Guichet unique 10 pays d\'Afrique de l\'Ouest & Centrale',
    badge: 'Tous opérateurs unifiés',
    color: '#22C55E',
    bgLight: 'bg-emerald-50/70',
    borderLight: 'border-emerald-500',
    countries: ['Mali', 'Sénégal', 'Côte d\'Ivoire', 'Burkina Faso', 'Togo', 'Bénin', 'Guinée', 'Niger', 'Cameroun', 'RDC'],
    feePercent: 1.8,
    instructions: 'Portail sécurisé certifié PCI-DSS acceptant tous les réseaux télécoms et banques partenaires de l\'espace UEMOA/CEMAC.',
    category: 'aggregator',
  },
  paydunya: {
    id: 'paydunya',
    name: 'PayDunya DirectPay',
    tagline: 'Sénégal, Côte d\'Ivoire, Bénin',
    badge: 'Agrégateur e-commerce',
    color: '#6366F1',
    bgLight: 'bg-indigo-50/70',
    borderLight: 'border-indigo-400',
    countries: ['Sénégal', 'Côte d\'Ivoire', 'Bénin'],
    feePercent: 2.0,
    instructions: 'Réglez facilement via votre compte marchand PayDunya ou votre porte-monnaie électronique partenaire.',
    category: 'aggregator',
  },
  kkiapay: {
    id: 'kkiapay',
    name: 'KKiaPay',
    tagline: 'Bénin, Togo, zone UEMOA',
    badge: 'Intégration rapide UEMOA',
    color: '#EC4899',
    bgLight: 'bg-pink-50/70',
    borderLight: 'border-pink-400',
    countries: ['Bénin', 'Togo'],
    feePercent: 1.5,
    instructions: 'Passerelle moderne de paiement direct Mobile Money pour le Bénin et le Togo.',
    category: 'aggregator',
  },
  card: {
    id: 'card',
    name: 'Carte Bancaire (Visa / Mastercard / GIM-UEMOA)',
    tagline: 'Banques locales de l\'UEMOA & Cartes Internationales',
    badge: '3D Secure V2 Sécurisé',
    color: '#0F172A',
    bgLight: 'bg-slate-100',
    borderLight: 'border-slate-400',
    countries: ['International', 'Zone UEMOA', 'Zone CEMAC'],
    feePercent: 2.2,
    instructions: 'Paiement sécurisé par carte bancaire avec protocole 3D Secure et validation par code SMS bancaire.',
    category: 'card',
  },
  cash_counter: {
    id: 'cash_counter',
    name: 'Espèces au Guichet de la Gare',
    tagline: 'Règlement physique auprès de l\'agent de quai',
    badge: '0% de frais',
    color: '#047857',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-600',
    countries: ['Toutes les gares AFRIWAY'],
    feePercent: 0.0,
    instructions: 'Présentez votre numéro PNR au guichet de la gare routière au moins 45 minutes avant le départ pour payer en espèces et retirer votre quittance.',
    category: 'cash',
  },
};

export const DEFAULT_GATEWAY_SETTINGS: PaymentGatewaySettings = {
  activeEnvironment: 'sandbox',
  waveEnabled: true,
  waveApiKey: 'wave_live_test_key_afriway_2026',
  orangeMoneyEnabled: true,
  orangeMoneyMerchantKey: 'om_merch_ml_bko_788912',
  mtnMoMoEnabled: true,
  mtnMoMoApiKey: 'momo_sub_key_ci_998124',
  moovEnabled: true,
  cinetpayEnabled: true,
  cinetpaySiteId: 'CPAY_SITE_748291',
  cinetpayApiKey: 'cp_api_live_afriway_uemoa',
  paydunyaEnabled: true,
  paydunyaMasterKey: 'master_key_paydunya_afw',
  kkiapayEnabled: true,
  kkiapayPublicKey: 'kkiapay_pk_bj_771892',
  cardEnabled: true,
  cashCounterEnabled: true,
  transactionFeePayer: 'company',
};

// Retrieve configured gateway settings
export function getGatewaySettings(): PaymentGatewaySettings {
  try {
    const raw = localStorage.getItem(GATEWAY_SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_GATEWAY_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Error reading gateway settings from storage:', e);
  }
  return DEFAULT_GATEWAY_SETTINGS;
}

// Save gateway settings
export function saveGatewaySettings(settings: PaymentGatewaySettings): void {
  try {
    localStorage.setItem(GATEWAY_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving gateway settings:', e);
  }
}

// Retrieve stored payment transactions
export function getStoredTransactions(): PaymentTransaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading payment transactions:', e);
  }
  return [];
}

// Save payment transaction locally & sync to Firestore if configured
export async function savePaymentTransaction(transaction: PaymentTransaction): Promise<void> {
  try {
    const list = getStoredTransactions();
    const updated = [transaction, ...list.filter((t) => t.id !== transaction.id)];
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));

    // Async sync to Firestore
    if (db) {
      try {
        const transRef = doc(db, 'payment_transactions', transaction.id);
        await setDoc(transRef, {
          ...transaction,
          syncedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (cloudErr) {
        console.warn('Firestore transaction sync notice (offline mode fallback active):', cloudErr);
      }
    }
  } catch (err) {
    console.error('Failed to save transaction:', err);
  }
}

// Luhn check for bank cards
export function validateLuhn(cardNumber: string): boolean {
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.length < 13 || clean.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

// Detect card brand
export function detectCardBrand(cardNumber: string): 'visa' | 'mastercard' | 'gim_uemoa' | 'generic' {
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.startsWith('4')) return 'visa';
  if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'mastercard';
  if (clean.startsWith('60') || clean.startsWith('9')) return 'gim_uemoa';
  return 'generic';
}

// Generate unique transaction ID
export function generateTransactionId(provider: PaymentProvider): string {
  const prefix = {
    wave: 'TXN-WAV',
    orange_money: 'TXN-OM',
    mtn_momo: 'TXN-MTN',
    moov_money: 'TXN-MOV',
    cinetpay: 'TXN-CPAY',
    paydunya: 'TXN-PDY',
    kkiapay: 'TXN-KKY',
    card: 'TXN-CRD',
    cash_counter: 'TXN-CSH',
  }[provider] || 'TXN-AFW';

  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${random}`;
}

// Generate receipt number
export function generateReceiptNumber(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(10000 + Math.random() * 90000);
  return `REC-${year}-AFW-${num}`;
}

// Process and record a successful payment
export async function createAndSaveTransaction(params: {
  bookingId: string;
  pnr: string;
  provider: PaymentProvider;
  amountXOF: number;
  currency: Currency;
  payerPhone?: string;
  payerName?: string;
  payerEmail?: string;
  cardLast4?: string;
  cardBrand?: 'visa' | 'mastercard' | 'gim_uemoa';
  providerReference?: string;
  paymentMethodDetails?: string;
}): Promise<PaymentTransaction> {
  const catalog = PAYMENT_PROVIDERS_CATALOG[params.provider];
  const feeXOF = Math.round((params.amountXOF * catalog.feePercent) / 100);
  const settings = getGatewaySettings();
  
  // Total debited depends on who pays fees
  const totalDebitedXOF = settings.transactionFeePayer === 'traveler'
    ? params.amountXOF + feeXOF
    : params.amountXOF;

  const transactionId = generateTransactionId(params.provider);
  const receiptNumber = generateReceiptNumber();

  const transaction: PaymentTransaction = {
    id: transactionId,
    bookingId: params.bookingId,
    pnr: params.pnr,
    provider: params.provider,
    providerReference: params.providerReference || `GATEWAY-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    amountXOF: params.amountXOF,
    feeXOF,
    totalDebitedXOF,
    currency: params.currency,
    payerPhone: params.payerPhone,
    payerName: params.payerName,
    payerEmail: params.payerEmail,
    cardLast4: params.cardLast4,
    cardBrand: params.cardBrand,
    status: 'completed',
    createdAt: new Date().toISOString(),
    verifiedAt: new Date().toISOString(),
    gatewayResponseCode: '00_SUCCESS',
    gatewayMode: settings.activeEnvironment,
    receiptNumber,
    paymentMethodDetails: params.paymentMethodDetails || `${catalog.name} (${catalog.tagline})`,
  };

  await savePaymentTransaction(transaction);
  return transaction;
}
