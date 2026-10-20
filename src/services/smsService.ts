import { Booking } from '../types';

export interface SmsNotification {
  id: string;
  pnr: string;
  recipientPhone: string;
  recipientName: string;
  senderId: string;
  carrier: 'Orange ML' | 'Moov Africa' | 'MTN' | 'Wave' | 'Malitel' | 'Autre';
  message: string;
  timestamp: string;
  status: 'sending' | 'delivered' | 'failed';
}

/**
 * Format SMS message matching standard African bus transport SMS notifications
 * (compact, informative, compliant with standard 160-character GSM segments).
 */
export function formatBookingConfirmationSms(booking: Booking, brandName = 'AFRIWAY'): string {
  const passenger = booking.passengers[0];
  const passengerName = passenger ? `${passenger.firstName} ${passenger.lastName}`.trim() : 'Voyageur';
  const seats = booking.passengers.map((p) => p.seatNumber).join(', ');
  const company = booking.trip.companyName;
  const departureDate = booking.trip.departureDate;
  const departureTime = booking.trip.departureTime;
  const origin = booking.trip.originCity;
  const destination = booking.trip.destinationCity;

  return `✅ ${brandName}: Billet confirmé ! Réf: ${booking.pnr} | Passager: ${passengerName} | ${origin} ➔ ${destination} | Départ: ${departureDate} à ${departureTime} | Siège(s): ${seats} | Car: ${company}. Présentez ce SMS ou votre QR code à la gare. Bon voyage !`;
}

/**
 * Detect carrier by African phone prefix
 */
export function detectCarrier(phone: string): 'Orange ML' | 'Moov Africa' | 'MTN' | 'Wave' | 'Malitel' | 'Autre' {
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('223') || clean.length === 8) {
    const local = clean.startsWith('223') ? clean.slice(3) : clean;
    const prefix = local.substring(0, 2);
    if (['70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '82', '83'].includes(prefix)) {
      return 'Orange ML';
    }
    if (['60', '61', '62', '63', '64', '65', '66', '67', '68', '69'].includes(prefix)) {
      return 'Moov Africa';
    }
  }
  if (clean.includes('7') || clean.includes('8')) return 'Orange ML';
  return 'Moov Africa';
}

/**
 * Plays a discrete simulated notification chime
 */
export function playSmsChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Audio contexts may be blocked before interaction, safe to ignore
  }
}

/**
 * Simulates sending confirmation SMS to the passenger's mobile phone
 */
export async function simulateSendBookingConfirmationSms(
  booking: Booking,
  brandName = 'AFRIWAY'
): Promise<SmsNotification> {
  const recipientPhone = booking.passengers[0]?.phone || booking.paymentPhone || '+223 76 00 00 00';
  const recipientName = booking.passengers[0]
    ? `${booking.passengers[0].firstName} ${booking.passengers[0].lastName}`.trim()
    : 'Client';
  
  const carrier = detectCarrier(recipientPhone);
  const message = formatBookingConfirmationSms(booking, brandName);

  const notification: SmsNotification = {
    id: `sms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    pnr: booking.pnr,
    recipientPhone,
    recipientName,
    senderId: brandName.toUpperCase(),
    carrier,
    message,
    timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    status: 'delivered',
  };

  // Simulate network delivery latency (400ms)
  await new Promise((resolve) => setTimeout(resolve, 400));
  playSmsChime();

  // Save to localStorage simulation history so operators or users can inspect
  try {
    const key = 'afriway_simulated_sms_history';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.unshift(notification);
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 30)));
  } catch (e) {
    console.warn('Could not store SMS history:', e);
  }

  return notification;
}
