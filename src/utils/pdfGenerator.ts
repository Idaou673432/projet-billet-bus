import { jsPDF } from 'jspdf';
import { Booking, Currency } from '../types';
import { formatPrice } from './currency';
import { getCompanyById } from './storage';
import QRCode from 'qrcode';

export async function generateTicketPDF(booking: Booking, currency: Currency = 'XOF'): Promise<{ doc: jsPDF; blob: Blob; fileName: string }> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const fileName = `Billet_AFRIWAY_${booking.pnr}.pdf`;
  const company = getCompanyById(booking.trip.companyId);

  // Theme Colors
  const emeraldPrimary = [4, 71, 40] as const; // #044728
  const emeraldDark = [2, 44, 34] as const;
  const amberGold = [217, 119, 6] as const; // #D97706
  const slateDark = [15, 23, 42] as const;
  const slateMuted = [100, 116, 139] as const;

  // 1. TOP HEADER BANNER (Dual branding: AFRIWAY + COMPANY LOGO)
  doc.setFillColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
  doc.rect(0, 0, 210, 42, 'F');

  // Gold accent bar
  doc.setFillColor(amberGold[0], amberGold[1], amberGold[2]);
  doc.rect(0, 42, 210, 2.5, 'F');

  // Platform Brand (Left)
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('AFRIWAY', 14, 18);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('BILLET DE TRANSPORT OFFICIEL & CARTE D\'EMBARQUEMENT', 14, 25);
  doc.text('Réseau Panafricain Interurbain · Mali & Afrique de l\'Ouest', 14, 31);

  // 2. COMPANY LOGO & PARTNER BADGE (Top Right)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(122, 7, 76, 28, 3, 3, 'F');

  // Check if company has an image logo (PNG/JPEG/dataURL)
  let logoDrawn = false;
  if (company?.logoUrl && typeof window !== 'undefined') {
    try {
      const lower = company.logoUrl.toLowerCase();
      if (lower.startsWith('data:image/png') || lower.startsWith('data:image/jpeg') || lower.startsWith('data:image/jpg') || lower.startsWith('data:image/webp')) {
        const imgFormat = (lower.includes('jpeg') || lower.includes('jpg')) ? 'JPEG' : 'PNG';
        doc.addImage(company.logoUrl, imgFormat, 124, 9, 20, 24);
        logoDrawn = true;
      }
    } catch (e) {
      console.warn('Could not embed raster logo in PDF directly:', e);
    }
  }

  if (!logoDrawn) {
    // Elegant custom company emblem with brand color
    doc.setFillColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.roundedRect(125, 10, 18, 22, 2, 2, 'F');
    doc.setTextColor(amberGold[0], amberGold[1], amberGold[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(company?.logoText || booking.trip.companyName.substring(0, 3).toUpperCase(), 127.5, 23);
  }

  // Company Name & Official Carrier text
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(booking.trip.companyName.toUpperCase().substring(0, 19), 146, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
  doc.text('COMPAGNIE AGRÉÉE', 146, 22);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`Réf : ${booking.pnr}`, 146, 27);

  // Calculate convocation time (30 min before departure)
  const [depH, depM] = booking.trip.departureTime.split(':').map(Number);
  let convM = depM - 30;
  let convH = depH;
  if (convM < 0) {
    convM += 60;
    convH = (convH - 1 + 24) % 24;
  }
  const convocationTime = `${String(convH).padStart(2, '0')}:${String(convM).padStart(2, '0')}`;

  // 3. MAIN ITINERARY CARD (Air/Coach Pass style)
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 50, 182, 38, 3, 3, 'FD');

  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ORIGINE · DÉPART', 20, 58);
  doc.text('DESTINATION · ARRIVÉE', 115, 58);

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFontSize(15);
  doc.text(`${booking.trip.originCity.toUpperCase()}`, 20, 66);
  doc.text(`${booking.trip.destinationCity.toUpperCase()}`, 115, 66);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(booking.trip.originStationName.substring(0, 42), 20, 72);
  doc.text(booking.trip.destinationStationName.substring(0, 42), 115, 72);

  // Flight/Coach Corridor Arrow
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(amberGold[0], amberGold[1], amberGold[2]);
  doc.text(`== ${booking.trip.distanceKm} km ==>`, 75, 66);

  // Cross border flag if applicable
  if (booking.trip.isCrossBorder) {
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(20, 77, 85, 7, 1.5, 1.5, 'F');
    doc.setTextColor(180, 83, 9);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('TRAJET INTERNATIONAL · POSTE FRONTIÈRE', 23, 82);
  }

  // 4. BOARDING ESSENTIALS STRIP (Date, Departure Time, Convocation, Seats)
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, 94, 182, 32, 2, 2, 'FD');

  // Box 1: Departure Date & Time
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('DATE DU VOYAGE', 20, 102);
  doc.text('DÉPART DU CAR', 20, 114);

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(booking.trip.departureDate, 20, 108);
  doc.text(booking.trip.departureTime, 20, 120);

  // Box 2: Convocation Time (Amber Alert)
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(68, 98, 48, 24, 2, 2, 'F');
  doc.setTextColor(180, 83, 9);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('CONVOCATION GARE', 72, 105);
  doc.setFontSize(13);
  doc.text(convocationTime, 72, 114);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('30 min avant le départ', 72, 119);

  // Box 3: Seat Numbers (Big Callout)
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(122, 98, 68, 24, 2, 2, 'F');
  doc.setTextColor(4, 120, 87);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('SIÈGE(S) RÉSERVÉ(S)', 126, 105);
  doc.setFontSize(14);
  doc.text(booking.passengers.map((p) => p.seatNumber).join(', '), 126, 114);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Car ${booking.trip.plateNumber} · ${booking.trip.busClass.toUpperCase()}`, 126, 119);

  // 5. PASSENGER MANIFEST TABLE
  doc.setFillColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
  doc.rect(14, 132, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SIÈGE', 18, 137.5);
  doc.text('NOM & PRÉNOM DU VOYAGEUR', 36, 137.5);
  doc.text('PIÈCE D\'IDENTITÉ / N°', 105, 137.5);
  doc.text('CONTACT TÉLÉPHONE', 152, 137.5);

  let passengerY = 146;
  booking.passengers.forEach((p, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(14, passengerY - 5, 182, 10, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.line(14, passengerY + 5, 196, passengerY + 5);

    doc.setTextColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(p.seatNumber, 18, passengerY + 1.5);

    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(`${p.firstName} ${p.lastName.toUpperCase()}`, 36, passengerY + 1.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(`${p.idType}: ${p.idNumber}`, 105, passengerY + 1.5);
    doc.text(p.phone || booking.paymentPhone || '-', 152, passengerY + 1.5);

    passengerY += 10;
  });

  // 6. DETACHABLE BOARDING STUB / QR CODE SECTION
  const qrSectionY = Math.max(passengerY + 6, 168);

  // Perforated cutoff line
  doc.setDrawColor(148, 163, 184);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(14, qrSectionY, 196, qrSectionY);
  doc.setLineDashPattern([], 0); // reset line style

  doc.setFontSize(7);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('--- TALON DE CONTRÔLE D\'EMBARQUEMENT GARE (À PRÉSENTER AU CONVOYEUR) ---', 38, qrSectionY + 4);

  // Generate QR Code image base64
  const qrPayload = JSON.stringify({
    app: 'AFRIWAY',
    pnr: booking.pnr,
    company: booking.trip.companyName,
    passenger: `${booking.passengers[0].firstName} ${booking.passengers[0].lastName}`,
    seats: booking.passengers.map((p) => p.seatNumber).join(','),
    trip: `${booking.trip.originCity} -> ${booking.trip.destinationCity}`,
    date: booking.trip.departureDate,
    time: booking.trip.departureTime,
    hash: booking.verificationHash,
  });

  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: 200,
    margin: 1,
    color: { dark: '#044728', light: '#ffffff' },
  });

  // Add QR Code
  doc.addImage(qrDataUrl, 'PNG', 14, qrSectionY + 8, 48, 48);

  // Instructions & Baggage Policy next to QR
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`RÈGLES D'EMBARQUEMENT — ${booking.trip.companyName.toUpperCase()}`, 68, qrSectionY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('• Présentez ce document ou ce QR code sur votre écran au contrôleur de quai.', 68, qrSectionY + 22);
  doc.text(`• Présentation impérative à ${convocationTime} (30 min avant le départ).`, 68, qrSectionY + 28);
  doc.text('• Franchise autorisée : 25 kg en soute + 7 kg en cabine par voyageur.', 68, qrSectionY + 34);
  doc.text(`• Montant réglé : ${formatPrice(booking.totalAmountXOF, currency)} via ${booking.paymentProvider.toUpperCase()}.`, 68, qrSectionY + 40);
  doc.text('• Billet nominatif et infalsifiable. Contrôle automatique par scanner.', 68, qrSectionY + 46);

  // Security Checksum Hash Bar
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, qrSectionY + 60, 182, 10, 2, 2, 'F');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.setFontSize(7);
  doc.setFont('courier', 'normal');
  doc.text(`SECHASH: ${booking.verificationHash} · COMPAGNIE: ${booking.trip.companyName.toUpperCase()} · PNR: ${booking.pnr}`, 18, qrSectionY + 66);

  // Footer Legal Note
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('AFRIWAY TECHNOLOGIES · Service d\'Assistance : +223 20 28 00 00 · support@afriway.africa', 14, 282);
  doc.text(`Ce billet est régi par les conditions générales de la compagnie ${booking.trip.companyName} et les accords UEMOA/CEDEAO.`, 14, 287);

  const blob = doc.output('blob');
  return { doc, blob, fileName };
}
