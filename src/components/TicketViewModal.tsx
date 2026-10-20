import React, { useEffect, useState, useRef } from 'react';
import { Booking, Currency } from '../types';
import { formatPrice } from '../utils/currency';
import { generateTicketPDF } from '../utils/pdfGenerator';
import { getCompanyById } from '../utils/storage';
import { DEFAULT_COMPANY_LOGOS } from '../utils/companyLogos';
import QRCode from 'qrcode';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Luggage, 
  QrCode as QrIcon, 
  Copy,
  Check,
  FileDown,
  Mail,
  Send,
  Loader2,
  ExternalLink,
  MessageCircle,
  Camera,
  Bus,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { simulateSendBookingConfirmationSms, SmsNotification } from '../services/smsService';
import { SmsNotificationBanner } from './SmsNotificationBanner';

interface TicketViewModalProps {
  booking: Booking;
  currency: Currency;
  onClose: () => void;
  onOpenScanner?: (pnr: string) => void;
}

export const TicketViewModal: React.FC<TicketViewModalProps> = ({
  booking,
  currency,
  onClose,
  onOpenScanner,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);

  // Email sending modal state
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [recipientEmail, setRecipientEmail] = useState<string>(
    booking.passengers[0]?.email || 'client.voyageur@gmail.com'
  );
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState<boolean>(false);

  // Snap Share state
  const [showSnapModal, setShowSnapModal] = useState<boolean>(false);
  const [snapCopied, setSnapCopied] = useState<boolean>(false);
  const [activeSmsNotification, setActiveSmsNotification] = useState<SmsNotification | null>(null);
  const [isSendingSms, setIsSendingSms] = useState<boolean>(false);

  const ticketRef = useRef<HTMLDivElement>(null);

  // Retrieve company and logo
  const company = getCompanyById(booking.trip.companyId);
  const companyLogo = company?.logoUrl || DEFAULT_COMPANY_LOGOS[booking.trip.companyId] || DEFAULT_COMPANY_LOGOS.nour_transport;

  useEffect(() => {
    // Generate QR payload containing verified JSON
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

    QRCode.toDataURL(qrPayload, {
      width: 260,
      margin: 1,
      color: {
        dark: '#044728',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [booking]);

  // Calculate convocation time (30 min before departure)
  const [depHour, depMin] = booking.trip.departureTime.split(':').map(Number);
  let convMin = depMin - 30;
  let convHour = depHour;
  if (convMin < 0) {
    convMin += 60;
    convHour = (convHour - 1 + 24) % 24;
  }
  const convocationTime = `${String(convHour).padStart(2, '0')}:${String(convMin).padStart(2, '0')}`;

  const passengersNames = booking.passengers.map((p) => `${p.firstName} ${p.lastName}`).join(', ');
  const seatsList = booking.passengers.map((p) => p.seatNumber).join(', ');

  // 1. Download Genuine PDF File (.pdf)
  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      const { doc, fileName } = await generateTicketPDF(booking, currency);
      doc.save(fileName);
      setIsGeneratingPdf(false);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setIsGeneratingPdf(false);
    }
  };

  // 2. Share by WhatsApp
  const handleShareWhatsApp = async () => {
    const text = `🚌 *BILLET OFFICIEL DE CAR — AFRIWAY*\n\n` +
      `🏢 *Compagnie* : ${booking.trip.companyName}\n` +
      `📋 *Réf Dossier (PNR)* : ${booking.pnr}\n` +
      `👤 *Voyageur(s)* : ${passengersNames}\n` +
      `💺 *Place(s)* : ${seatsList}\n` +
      `📍 *Trajet* : ${booking.trip.originCity} ➔ ${booking.trip.destinationCity}\n` +
      `🕒 *Départ* : ${booking.trip.departureDate} à ${booking.trip.departureTime}\n` +
      `⚠️ *Convocation en gare* : ${convocationTime} (30 min avant)\n` +
      `🏢 *Gare de départ* : ${booking.trip.originStationName}\n` +
      `💳 *Montant réglé* : ${formatPrice(booking.totalAmountXOF, currency)} via ${booking.paymentProvider.toUpperCase()}\n` +
      `🧳 *Bagages* : 25 kg en soute + 7 kg en cabine inclus\n\n` +
      `📲 *Télécharger le billet PDF & QR Code* : ${window.location.href}`;

    if (navigator.share) {
      try {
        const { blob, fileName } = await generateTicketPDF(booking, currency);
        const file = new File([blob], fileName, { type: 'application/pdf' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Billet AFRIWAY ${booking.pnr} - ${booking.trip.companyName}`,
            text,
          });
          return;
        }
      } catch (e) {
        // Fallback to URL
      }
    }

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // 3. Share by Snapchat
  const handleShareSnapchat = () => {
    setShowSnapModal(true);
  };

  const handleCopySnapText = () => {
    const snapText = `🚌 Mon Billet de Car ${booking.trip.companyName} pour ${booking.trip.destinationCity} ! PNR: ${booking.pnr} · Départ ${booking.trip.departureTime} (Siège ${seatsList})`;
    navigator.clipboard.writeText(snapText);
    setSnapCopied(true);
    setTimeout(() => setSnapCopied(false), 2500);
  };

  // 4. Send by Email
  const handleSendEmailSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingEmail(true);

    const subject = `Votre Billet de Car ${booking.trip.companyName} - ${booking.pnr} - ${booking.trip.originCity} vers ${booking.trip.destinationCity}`;
    const body = `Bonjour ${booking.passengers[0].firstName} ${booking.passengers[0].lastName},\n\n` +
      `Voici votre confirmation de voyage et votre billet électronique AFRIWAY / ${booking.trip.companyName}.\n\n` +
      `RÉFÉRENCE PNR : ${booking.pnr}\n` +
      `COMPAGNIE : ${booking.trip.companyName} (${booking.trip.busModel})\n` +
      `TRAJET : ${booking.trip.originCity} vers ${booking.trip.destinationCity}\n` +
      `DATE DE DÉPART : ${booking.trip.departureDate} à ${booking.trip.departureTime}\n` +
      `HEURE DE CONVOCATION : ${convocationTime} (au plus tard à la gare)\n` +
      `GARE D'EMBARQUEMENT : ${booking.trip.originStationName}\n` +
      `SIÈGE(S) RÉSERVÉ(S) : ${seatsList}\n` +
      `MONTANT RÉGLÉ : ${formatPrice(booking.totalAmountXOF, currency)} via ${booking.paymentProvider.toUpperCase()}\n` +
      `FRANCHISE BAGAGES : 25 kg en soute + 7 kg en cabine\n\n` +
      `Présentez votre QR Code ou le billet PDF lors de l'embarquement.\n` +
      `Bon voyage avec AFRIWAY & ${booking.trip.companyName} !`;

    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    setTimeout(() => {
      setIsSendingEmail(false);
      setEmailSentSuccess(true);
      window.open(mailtoUrl, '_blank');
      setTimeout(() => setShowEmailModal(false), 3000);
    }, 1000);
  };

  // 5. Print Ticket
  const handlePrint = () => {
    window.print();
  };

  const handleCopyPNR = () => {
    navigator.clipboard.writeText(booking.pnr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 6. Simulate Confirmation SMS to Passenger
  const handleSimulateSms = async () => {
    setIsSendingSms(true);
    try {
      const sms = await simulateSendBookingConfirmationSms(booking);
      setActiveSmsNotification(sms);
    } catch (e) {
      console.warn('SMS send error:', e);
    } finally {
      setIsSendingSms(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5">
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Action Toolbar (Hidden during print) */}
        <div className="no-print px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Carte d'Embarquement</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-xs font-bold font-mono text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {booking.pnr}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Download PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                pdfSuccess 
                  ? 'bg-emerald-700 text-white' 
                  : 'bg-emerald-800 hover:bg-emerald-900 text-white'
              }`}
              title="Télécharger le fichier PDF officiel avec logo compagnie"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : pdfSuccess ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>{pdfSuccess ? 'PDF Téléchargé !' : 'Télécharger PDF'}</span>
            </button>

            {/* WhatsApp Share */}
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 text-xs font-bold bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Envoyer le billet par WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            {/* Snapchat Share */}
            <button
              onClick={handleShareSnapchat}
              className="px-3 py-1.5 text-xs font-bold bg-[#FFFC00] hover:bg-[#e6e300] text-slate-900 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Partager sur Snapchat"
            >
              <Camera className="w-3.5 h-3.5 text-slate-900" />
              <span>Snapchat</span>
            </button>

            {/* Email */}
            <button
              onClick={() => setShowEmailModal(true)}
              className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Envoyer le billet par Email"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>

            {/* SMS Simulation */}
            <button
              onClick={handleSimulateSms}
              disabled={isSendingSms}
              className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Simuler l'envoi de la confirmation SMS au voyageur"
            >
              {isSendingSms ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
              <span>SMS</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Imprimer le billet au format papier / reçu de voyage"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success toast if PDF just downloaded */}
        {pdfSuccess && (
          <div className="no-print bg-emerald-100 text-emerald-950 px-6 py-2 text-xs font-medium border-b border-emerald-200 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-700" />
            <span>Fichier PDF officiel avec le logo de <strong>{booking.trip.companyName}</strong> téléchargé avec succès !</span>
          </div>
        )}

        {/* ----------------- BOARDING PASS MAIN CONTAINER (Printed & Viewed) ----------------- */}
        <div ref={ticketRef} className="p-4 sm:p-7 space-y-6 max-h-[82vh] overflow-y-auto bg-slate-50/50">
          
          {/* Outer Boarding Pass Card */}
          <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-sm overflow-hidden">
            
            {/* Top Dual Brand Header: AFRIWAY + CHOSEN COMPANY LOGO */}
            <div className="bg-emerald-900 text-white px-5 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-4 border-amber-500">
              {/* Left Platform Brand */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-white">AFRIWAY</span>
                  <span className="bg-emerald-800 text-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    E-BILLET OFFICIEL
                  </span>
                </div>
                <p className="text-xs text-emerald-200 mt-0.5 font-medium">
                  Plateforme Panafricaine de Transport Interurbain
                </p>
              </div>

              {/* Right Chosen Company Logo Box */}
              <div className="flex items-center gap-3 bg-white text-slate-900 px-3.5 py-2 rounded-2xl shadow-sm border border-slate-200">
                {companyLogo ? (
                  <img
                    src={companyLogo}
                    alt={`Logo ${booking.trip.companyName}`}
                    className="h-10 sm:h-12 w-auto max-w-[150px] object-contain"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 font-black text-sm flex items-center justify-center">
                    {company?.logoText || booking.trip.companyName.substring(0, 3)}
                  </div>
                )}
                <div className="text-left border-l border-slate-200 pl-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block leading-tight">Compagnie Agréée</span>
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900 block leading-tight">
                    {booking.trip.companyName}
                  </span>
                </div>
              </div>
            </div>

            {/* Boarding Pass Body (Section 1: Itinerary & Critical Times) */}
            <div className="p-5 sm:p-7 space-y-6">
              
              {/* Top Itinerary Row with Origin ➔ Destination */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center p-5 rounded-2xl bg-slate-50 border border-slate-200">
                {/* Origin */}
                <div className="md:col-span-4 text-left">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    Gare de Départ
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {booking.trip.originCity}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-900 mt-0.5">
                    {booking.trip.originCountry}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 truncate max-w-[220px]" title={booking.trip.originStationName}>
                    {booking.trip.originStationName}
                  </p>
                </div>

                {/* Trajectory Center with Distance */}
                <div className="md:col-span-4 flex flex-col items-center justify-center py-2 px-3 text-center">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                    <Bus className="w-4 h-4 text-emerald-800" />
                    <span>Liaison Directe</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{booking.trip.distanceKm} km</span>
                  </div>
                  <div className="w-full flex items-center gap-1 text-slate-300">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-700 shrink-0" />
                    <div className="h-0.5 flex-1 bg-slate-300 relative">
                      {booking.trip.isCrossBorder && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                          Passage Frontière
                        </div>
                      )}
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900 shrink-0" />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Durée estimée : {booking.trip.durationHours}h{booking.trip.durationMinutes > 0 ? booking.trip.durationMinutes : '00'}
                  </span>
                </div>

                {/* Destination */}
                <div className="md:col-span-4 text-left md:text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 md:justify-end mb-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-600" />
                    Gare d'Arrivée
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {booking.trip.destinationCity}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-900 mt-0.5">
                    {booking.trip.destinationCountry}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 truncate max-w-[220px] md:ml-auto" title={booking.trip.destinationStationName}>
                    {booking.trip.destinationStationName}
                  </p>
                </div>
              </div>

              {/* High-Impact Boarding Matrix: Date, Departure Time, Convocation Time, Big Seats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* 1. Date */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Date du Voyage
                  </span>
                  <span className="text-lg font-black text-slate-900 block mt-1 font-mono">
                    {booking.trip.departureDate}
                  </span>
                  <span className="text-xs text-slate-500">Voyage confirmé</span>
                </div>

                {/* 2. Departure Time */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Départ du Car
                  </span>
                  <span className="text-2xl font-black text-slate-900 block mt-0.5 font-mono">
                    {booking.trip.departureTime}
                  </span>
                  <span className="text-xs text-slate-500">Heure précise</span>
                </div>

                {/* 3. Convocation Time (Amber Box) */}
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-300">
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                    Convocation Gare
                  </span>
                  <span className="text-2xl font-black text-amber-950 block mt-0.5 font-mono">
                    {convocationTime}
                  </span>
                  <span className="text-[11px] font-bold text-amber-800">
                    30 min avant le départ
                  </span>
                </div>

                {/* 4. Giant Seat Callout */}
                <div className="bg-emerald-50 p-4 rounded-2xl border-2 border-emerald-500">
                  <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                    Siège(s) Attribué(s)
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-950 block mt-0.5 font-mono">
                    {seatsList}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase">
                    {booking.trip.busClass === 'vip' ? 'VIP Grand Confort' : 'Classe Standard'}
                  </span>
                </div>
              </div>

              {/* Passenger List & Identification */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Détail Nominatif des Passagers ({booking.passengers.length})</span>
                  <span className="font-mono text-emerald-900 font-semibold">
                    Véhicule : {booking.trip.plateNumber} ({booking.trip.busModel})
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {booking.passengers.map((p, idx) => (
                    <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-black text-sm text-slate-900">
                          {p.firstName} {p.lastName.toUpperCase()}
                        </div>
                        <div className="text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="font-semibold text-slate-700">{p.idType} : {p.idNumber}</span>
                          <span aria-hidden="true">·</span>
                          <span>Nationalité : {p.nationality}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="bg-emerald-100 text-emerald-900 px-3 py-1 rounded-lg font-mono font-black text-sm">
                          Place {p.seatNumber}
                        </span>
                        {p.phone && (
                          <span className="font-mono text-slate-500 text-xs">{p.phone}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Luggage Policy & Advisory Banner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <Luggage className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Franchise Bagages Incluse</span>
                    <span className="text-slate-600">
                      25 kg en soute (étiqueté en gare) + 7 kg de bagage à main en cabine par voyageur.
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Paiement & Contrôle Sécurisé</span>
                    <span className="text-slate-600">
                      Règlement validé de <strong>{formatPrice(booking.totalAmountXOF, currency)}</strong> via {booking.paymentProvider.toUpperCase()}.
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Perforated Divider (Boarding Stub Junction) */}
            <div className="relative py-3 bg-slate-100 border-t-2 border-dashed border-slate-300">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-900" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-900" />
              <div className="text-center text-[11px] font-mono font-bold tracking-wider text-slate-500 uppercase">
                ✂ Talon de Contrôle & QR Code d'Embarquement (Gare & Convoyeur) ✂
              </div>
            </div>

            {/* Section 2: Boarding Stub with QR Code & Scanner Verification */}
            <div className="p-5 sm:p-7 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                
                {/* QR Code Presentation Box */}
                <div className="sm:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <QrIcon className="w-4 h-4 text-emerald-800" />
                    <span>À Scanner sur Quai</span>
                  </span>

                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR Code Boarding Pass ${booking.pnr}`}
                      className="w-44 h-44 object-contain rounded-xl shadow-xs border border-slate-300 bg-white p-1.5"
                    />
                  ) : (
                    <div className="w-44 h-44 bg-slate-200 animate-pulse rounded-xl flex items-center justify-center text-xs text-slate-400">
                      Génération du QR Code...
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 font-mono mt-2 break-all max-w-[220px]">
                    Hash: {booking.verificationHash.substring(0, 26)}...
                  </span>
                </div>

                {/* Stub Trip & Passenger Summary */}
                <div className="sm:col-span-7 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-400">Référence PNR Officielle :</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-sm text-slate-900">{booking.pnr}</span>
                      <button
                        onClick={handleCopyPNR}
                        className="no-print text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Copier le PNR"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-400">Compagnie opératrice :</span>
                    <span className="font-bold text-slate-900">{booking.trip.companyName}</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-400">Voyageur principal :</span>
                    <span className="font-bold text-slate-900">
                      {booking.passengers[0].firstName} {booking.passengers[0].lastName.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-400">Trajet :</span>
                    <span className="font-bold text-slate-900">
                      {booking.trip.originCity} ➔ {booking.trip.destinationCity}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-400">Sièges réservés :</span>
                    <span className="font-mono font-black text-emerald-900 text-sm">{seatsList}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Statut d'embarquement :</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      booking.boardingStatus === 'boarded'
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}>
                      {booking.boardingStatus === 'boarded' ? 'Passager À Bord' : 'Valide pour Accès Quai'}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer Notice */}
            <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 text-center text-[10px] text-slate-500 font-mono">
              Ce document fait office de titre de transport officiel. Émis par AFRIWAY sous agrément de la compagnie {booking.trip.companyName}.
            </div>
          </div>
        </div>

        {/* Quick Conductor Inspection shortcut (Hidden when printing) */}
        {onOpenScanner && (
          <div className="no-print px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600">Simuler le contrôle du convoyeur en gare :</span>
            <button
              onClick={() => onOpenScanner(booking.pnr)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              Scanner ce billet (Mode Contrôleur)
            </button>
          </div>
        )}

        {/* Sub-Modal: Send via Email */}
        {showEmailModal && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Envoyer le Billet par Email</h4>
                    <span className="text-[11px] text-slate-500">Format PDF officiel et itinéraire</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {emailSentSuccess ? (
                <div className="py-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm">Billet envoyé avec succès !</h5>
                  <p className="text-xs text-slate-600">
                    Une copie complète a été transmise à <strong>{recipientEmail}</strong> avec le fichier PDF et le lien de voyage.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendEmailSimulation} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Adresse email du voyageur *
                    </label>
                    <input
                      type="email"
                      required
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="client@domaine.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600 space-y-1 text-[11px]">
                    <div className="font-semibold text-slate-800">Contenu de l'envoi :</div>
                    <div>• Fichier joint : Billet_AFRIWAY_{booking.pnr}.pdf</div>
                    <div>• Compagnie : {booking.trip.companyName}</div>
                    <div>• Itinéraire : {booking.trip.originCity} ➔ {booking.trip.destinationCity}</div>
                    <div>• Voyageur : {passengersNames} (Siège {seatsList})</div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowEmailModal(false)}
                      className="px-4 py-2 bg-slate-100 rounded-xl text-slate-600 font-semibold cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingEmail}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {isSendingEmail ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Envoi en cours...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Envoyer le Billet</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Sub-Modal: Snapchat Share Info */}
        {showSnapModal && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FFFC00] text-slate-900 flex items-center justify-center font-black">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Partager sur Snapchat</h4>
                    <span className="text-[11px] text-slate-500">Story & Message Privé Snap</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowSnapModal(false)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Partagez votre voyage avec <strong>{booking.trip.companyName}</strong> vers <strong>{booking.trip.destinationCity}</strong> avec vos amis :
                </p>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-800 break-all">
                  🚌 En route pour {booking.trip.destinationCity} avec {booking.trip.companyName} ! Billet validé PNR: {booking.pnr} (Siège {seatsList})
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCopySnapText}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {snapCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{snapCopied ? 'Texte copié ! Ouvrez Snapchat' : 'Copier le texte pour Snapchat'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.open('https://www.snapchat.com', '_blank');
                    }}
                    className="w-full py-2.5 bg-[#FFFC00] hover:bg-[#e6e300] text-slate-900 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Ouvrir Snapchat Web / App</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SMS Notification Banner inside modal */}
        <SmsNotificationBanner
          notification={activeSmsNotification}
          onDismiss={() => setActiveSmsNotification(null)}
        />
      </div>
    </div>
  );
};
