import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Booking, Currency } from '../types';
import { formatPrice } from './currency';
import { getCompanyById } from './storage';

export interface LandscapeTicketShareData {
  text: string;
  pdfBlob: Blob;
  pdfFileName: string;
  imageBlob: Blob;
  imageFileName: string;
  imageDataUrl: string;
}

/**
 * Formats the clean text message for WhatsApp sharing
 */
export function getWhatsAppTicketText(booking: Booking, currency: Currency = 'XOF'): string {
  const passengers = booking.passengers.map((p) => `${p.firstName} ${p.lastName}`).join(', ');
  const seats = booking.passengers.map((p) => p.seatNumber).join(', ');

  // Calculate convocation time (30 min prior)
  const [depH, depM] = (booking.trip.departureTime || '08:00').split(':').map(Number);
  let convM = depM - 30;
  let convH = depH;
  if (convM < 0) {
    convM += 60;
    convH = (convH - 1 + 24) % 24;
  }
  const convocation = `${String(convH).padStart(2, '0')}:${String(convM).padStart(2, '0')}`;

  return `🚌 *BILLET AFRIWAY (10×5 cm) — ${booking.trip.companyName.toUpperCase()}*\n\n` +
    `📋 *PNR* : *${booking.pnr}*\n` +
    `💺 *SIÈGE(S)* : *${seats}*\n` +
    `👤 *Voyageur* : ${passengers}\n` +
    `📍 *Trajet* : *${booking.trip.originCity}* ➔ *${booking.trip.destinationCity}*\n` +
    `🕒 *Départ* : ${booking.trip.departureDate} à *${booking.trip.departureTime}*\n` +
    `⚠️ *Convocation Gare* : ${convocation} (30 min avant)\n` +
    `🏢 *Gare* : ${booking.trip.originStationName}\n` +
    `🚌 *Véhicule* : Car ${booking.trip.plateNumber || 'N/A'}\n` +
    `💳 *Montant* : ${formatPrice(booking.totalAmountXOF, currency)} (100% Réglé)\n\n` +
    `📲 _Présentez ce billet ou le QR code au contrôleur quai._`;
}

/**
 * Generates an official 100 mm x 50 mm (10 x 5 cm) landscape PDF ticket
 */
export async function generateTicketLandscape10x5PDF(
  booking: Booking,
  currency: Currency = 'XOF'
): Promise<{ doc: jsPDF; blob: Blob; fileName: string; dataUrl: string }> {
  // 100mm wide by 50mm high
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [100, 50],
  });

  const fileName = `Billet_10x5cm_${booking.pnr}.pdf`;
  const company = getCompanyById(booking.trip.companyId);

  // Palettes
  const emeraldPrimary = [4, 71, 40] as const;
  const amberGold = [217, 119, 6] as const;
  const slateDark = [15, 23, 42] as const;
  const slateMuted = [100, 116, 139] as const;

  // Background white card
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 100, 50, 'F');

  // Top emerald band
  doc.setFillColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
  doc.rect(0, 0, 100, 8.5, 'F');

  // Gold hairline
  doc.setFillColor(amberGold[0], amberGold[1], amberGold[2]);
  doc.rect(0, 8.5, 100, 0.8, 'F');

  // Left Brand Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('AFRIWAY', 3.5, 5.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.text('BILLET DE CAR OFFICIEL (10×5 cm)', 20, 5.8);

  // Right Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  const compName = (booking.trip.companyName || 'COMPAGNIE').toUpperCase();
  doc.text(compName.length > 20 ? compName.substring(0, 20) : compName, 96, 5.8, { align: 'right' });

  // Calculate convocation
  const [depH, depM] = (booking.trip.departureTime || '08:00').split(':').map(Number);
  let convM = depM - 30;
  let convH = depH;
  if (convM < 0) {
    convM += 60;
    convH = (convH - 1 + 24) % 24;
  }
  const convocation = `${String(convH).padStart(2, '0')}:${String(convM).padStart(2, '0')}`;

  // === LEFT SECTION: MAIN VOYAGE INFO (0 to 68 mm) ===
  // Route
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`${booking.trip.originCity.toUpperCase()} ➔ ${booking.trip.destinationCity.toUpperCase()}`, 3.5, 14.5);

  // Station info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`Gare : ${booking.trip.originStationName.substring(0, 36)}`, 3.5, 18.5);

  // Departure + Convocation Strip
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(3.5, 20.5, 63, 10, 1.2, 1.2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(3.5, 20.5, 63, 10, 1.2, 1.2, 'S');

  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.text('DATE DU DÉPART', 5.5, 24);
  doc.text('HEURE DÉPART', 27, 24);
  doc.text('CONVOCATION', 47, 24);

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(booking.trip.departureDate, 5.5, 28.5);
  doc.text(booking.trip.departureTime, 27, 28.5);
  doc.setTextColor(amberGold[0], amberGold[1], amberGold[2]);
  doc.text(convocation, 47, 28.5);

  // Passenger & ID
  const primaryPax = booking.passengers[0];
  const paxName = `${primaryPax.firstName} ${primaryPax.lastName.toUpperCase()}`;
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`Voyageur : ${paxName.substring(0, 26)}`, 3.5, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`Pièce : ${primaryPax.idType || 'CNI'} ${primaryPax.idNumber || '-'} · Tél : ${primaryPax.phone || '-'}`, 3.5, 38);

  // Bus Plate & Payment info
  doc.text(`Car : ${booking.trip.plateNumber || 'N/A'} · Prix : ${formatPrice(booking.totalAmountXOF, currency)} (Payé via ${booking.paymentProvider})`, 3.5, 42);

  // Footer seal
  doc.setFontSize(4.8);
  doc.setTextColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`● BILLET CERTIFIÉ AFRIWAY · CONTRÔLE SUR QUAI OBLIGATOIRE`, 3.5, 46.5);

  // === PERFORATED SEPARATOR (at x = 68 mm) ===
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(68, 9.5, 68, 50);
  doc.setLineDashPattern([], 0);

  // === RIGHT STUB: SEAT + QR CODE + PNR (68 to 100 mm) ===
  // Giant Seat Badge
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(70.5, 10.5, 26.5, 8, 1.2, 1.2, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(70.5, 10.5, 26.5, 8, 1.2, 1.2, 'S');

  doc.setTextColor(180, 83, 9);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.text('PLACE / SIÈGE', 72, 14);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.text(booking.passengers.map((p) => p.seatNumber).join(','), 94, 16.5, { align: 'right' });

  // Generate QR Code image
  const qrPayload = JSON.stringify({
    app: 'AFRIWAY',
    pnr: booking.pnr,
    company: booking.trip.companyName,
    passenger: paxName,
    seats: booking.passengers.map((p) => p.seatNumber).join(','),
    trip: `${booking.trip.originCity}->${booking.trip.destinationCity}`,
    date: booking.trip.departureDate,
    time: booking.trip.departureTime,
    hash: booking.verificationHash,
  });

  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: 200,
    margin: 1,
    color: { dark: '#044728', light: '#ffffff' },
  });

  doc.addImage(qrDataUrl, 'PNG', 72.5, 19.5, 22.5, 22.5);

  // PNR Badge at bottom
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(70.5, 43, 26.5, 5, 0.8, 0.8, 'F');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('courier', 'bold');
  doc.setFontSize(6.5);
  doc.text(booking.pnr, 83.7, 46.8, { align: 'center' });

  const blob = doc.output('blob');
  const dataUrl = doc.output('datauristring');
  return { doc, blob, fileName, dataUrl };
}

/**
 * Generates an ultra-crisp 10x5 cm landscape image (PNG 1200x600 px)
 * Ideal for WhatsApp direct sharing, preview and instant image download
 */
export async function generateTicketLandscape10x5Image(
  booking: Booking,
  currency: Currency = 'XOF'
): Promise<{ dataUrl: string; blob: Blob; file: File; fileName: string }> {
  const width = 1200;
  const height = 600; // 2:1 ratio for 10x5 cm

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // High-DPI font rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 2. Outer Border
  ctx.strokeStyle = '#044728';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);

  // 3. Top Banner (Emerald)
  const bannerHeight = 90;
  ctx.fillStyle = '#044728';
  ctx.fillRect(0, 0, width, bannerHeight);

  // Accent Gold Bar
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, bannerHeight, width, 8);

  // Top Banner Brand (Left)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('AFRIWAY', 30, 52);

  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('BILLET DE CAR OFFICIEL (FORMAT 10 × 5 CM)', 185, 50);

  // Top Banner Company Name (Right)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText((booking.trip.companyName || 'COMPAGNIE').toUpperCase(), width - 30, 54);
  ctx.textAlign = 'left'; // reset

  // Calculate Convocation (30 min prior)
  const [depH, depM] = (booking.trip.departureTime || '08:00').split(':').map(Number);
  let convM = depM - 30;
  let convH = depH;
  if (convM < 0) {
    convM += 60;
    convH = (convH - 1 + 24) % 24;
  }
  const convocation = `${String(convH).padStart(2, '0')}:${String(convM).padStart(2, '0')}`;

  const primaryPax = booking.passengers[0];
  const paxFullName = `${primaryPax.firstName} ${primaryPax.lastName.toUpperCase()}`;
  const seatsList = booking.passengers.map((p) => p.seatNumber).join(', ');

  // === LEFT SECTION (x: 30 to 820) ===
  // 4. Large Itinerary
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 40px sans-serif';
  ctx.fillText(`${booking.trip.originCity.toUpperCase()} ➔ ${booking.trip.destinationCity.toUpperCase()}`, 35, 160);

  // Station info
  ctx.fillStyle = '#64748b';
  ctx.font = '500 20px sans-serif';
  ctx.fillText(`Gare départ : ${booking.trip.originStationName}`, 35, 196);

  // 5. Departure Matrix Box (Date / Time / Convocation)
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(35, 220, 770, 110);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(35, 220, 770, 110);

  // Date column
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('DATE DU DÉPART', 55, 252);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 26px monospace';
  ctx.fillText(booking.trip.departureDate, 55, 296);

  // Time column
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('HEURE DÉPART', 320, 252);
  ctx.fillStyle = '#044728';
  ctx.font = '900 32px monospace';
  ctx.fillText(booking.trip.departureTime, 320, 298);

  // Convocation column
  ctx.fillStyle = '#b45309';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('CONVOCATION', 580, 252);
  ctx.fillStyle = '#d97706';
  ctx.font = '900 32px monospace';
  ctx.fillText(convocation, 580, 298);

  // 6. Passenger Information
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(`Voyageur : ${paxFullName}`, 35, 375);

  ctx.fillStyle = '#475569';
  ctx.font = '500 20px sans-serif';
  ctx.fillText(
    `Pièce d'identité : ${primaryPax.idType || 'CNI'} N° ${primaryPax.idNumber || '-'}   ·   Tél : ${primaryPax.phone || '-'}`,
    35,
    415
  );

  // 7. Bus & Fare Info
  ctx.fillStyle = '#044728';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(
    `Car : ${booking.trip.plateNumber || 'N/A'} (${booking.trip.busClass === 'vip' ? 'VIP Grand Confort' : 'Standard'})   ·   ${formatPrice(booking.totalAmountXOF, currency)} (100% Réglé)`,
    35,
    465
  );

  // 8. Security Badge at Bottom
  ctx.fillStyle = '#ecfdf5';
  ctx.fillRect(35, 500, 770, 60);
  ctx.strokeStyle = '#a7f3d0';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(35, 500, 770, 60);

  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('🔒 TITRE DE TRANSPORT SÉCURISÉ AFRIWAY — CONTRÔLE PAR SCANNER À LA PORTE DU CAR', 55, 538);

  // === PERFORATED SEPARATOR (at x = 835) ===
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(835, bannerHeight);
  ctx.lineTo(835, height);
  ctx.stroke();
  ctx.setLineDash([]); // reset

  // Notch circles for perforation ticket look
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.arc(835, bannerHeight, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(835, height, 14, 0, Math.PI * 2);
  ctx.fill();

  // === RIGHT STUB SECTION (x: 845 to 1180) ===
  // 9. Giant Seat Badge
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(860, 115, 310, 115);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(860, 115, 310, 115);

  ctx.fillStyle = '#b45309';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('SIÈGE / PLACE', 880, 150);

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 56px monospace';
  ctx.fillText(seatsList, 880, 210);

  // 10. QR Code Generation
  const qrPayload = JSON.stringify({
    app: 'AFRIWAY',
    pnr: booking.pnr,
    company: booking.trip.companyName,
    passenger: paxFullName,
    seats: seatsList,
    trip: `${booking.trip.originCity}->${booking.trip.destinationCity}`,
    date: booking.trip.departureDate,
    time: booking.trip.departureTime,
    hash: booking.verificationHash,
  });

  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: 320,
    margin: 1,
    color: { dark: '#044728', light: '#ffffff' },
  });

  // Draw QR Image onto Canvas
  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 895, 245, 240, 240);
      resolve();
    };
    img.onerror = reject;
    img.src = qrDataUrl;
  });

  // 11. PNR Box at bottom of stub
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(860, 500, 310, 60);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(860, 500, 310, 60);

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`PNR : ${booking.pnr}`, 860 + 310 / 2, 540);
  ctx.textAlign = 'left';

  // Export as PNG
  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
  const fileName = `Billet_WhatsApp_10x5cm_${booking.pnr}.png`;
  const file = new File([blob], fileName, { type: 'image/png' });

  return { dataUrl, blob, file, fileName };
}

/**
 * Triggers native WhatsApp share with automatic fallback
 */
export async function shareTicketOnWhatsApp(
  booking: Booking,
  currency: Currency = 'XOF',
  customPhone?: string
): Promise<{ success: boolean; method: 'native_share' | 'whatsapp_link' }> {
  const text = getWhatsAppTicketText(booking, currency);

  try {
    const { file } = await generateTicketLandscape10x5Image(booking, currency);

    // If Web Share API is available with image attachment support
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `Billet AFRIWAY 10×5cm - ${booking.pnr}`,
        text,
        files: [file],
      });
      return { success: true, method: 'native_share' };
    }
  } catch (err) {
    console.warn('Web Share file attachment fallback:', err);
  }

  // Fallback to direct WhatsApp API link with formatted text
  let cleanPhone = (customPhone || booking.passengers[0]?.phone || booking.paymentPhone || '').replace(/[^0-9]/g, '');
  const url = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

  window.open(url, '_blank');
  return { success: true, method: 'whatsapp_link' };
}
