import { Currency } from '../types';

export const CURRENCY_RATES: Record<Currency, number> = {
  XOF: 1,         // Base currency
  XAF: 1,         // 1 XAF = 1 XOF (CFA parity)
  GNF: 14.1,      // 1 XOF ≈ 14.1 GNF
  MRU: 0.065,     // 1 XOF ≈ 0.065 MRU
  EUR: 0.001524,  // 1 EUR = 655.957 XOF fixed peg
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  XOF: 'FCFA',
  XAF: 'FCFA',
  GNF: 'GNF',
  MRU: 'MRU',
  EUR: '€',
};

export function convertFromXOF(amountXOF: number, targetCurrency: Currency): number {
  const rate = CURRENCY_RATES[targetCurrency] || 1;
  const raw = amountXOF * rate;
  if (targetCurrency === 'GNF') return Math.round(raw / 100) * 100;
  if (targetCurrency === 'MRU') return Math.round(raw * 10) / 10;
  if (targetCurrency === 'EUR') return Math.round(raw * 100) / 100;
  return Math.round(raw);
}

export function formatPrice(amountXOF: number, currency: Currency = 'XOF'): string {
  const converted = convertFromXOF(amountXOF, currency);
  const symbol = CURRENCY_SYMBOLS[currency] || 'FCFA';

  if (currency === 'EUR') {
    return `${converted.toFixed(2)} ${symbol}`;
  }

  // Format with thousands separator space
  const formattedNumber = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: currency === 'MRU' ? 1 : 0,
  }).format(converted);

  return `${formattedNumber} ${symbol}`;
}
