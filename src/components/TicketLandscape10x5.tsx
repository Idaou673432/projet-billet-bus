import React, { useState, useEffect } from 'react';
import { Booking, Currency } from '../types';
import { formatPrice } from '../utils/currency';
import QRCode from 'qrcode';
import { 
  Printer, 
  Copy, 
  Check, 
  FileDown, 
  Image as ImageIcon, 
  Share2, 
  ExternalLink,
  Loader2,
  Clock,
  MapPin,
  Bus,
  ShieldCheck,
  Send
} from 'lucide-react';
import { 
  generateTicketLandscape10x5PDF, 
  generateTicketLandscape10x5Image, 
  getWhatsAppTicketText, 
  shareTicketOnWhatsApp 
} from '../utils/landscapeTicketGenerator';

interface TicketLandscape10x5Props {
  booking: Booking;
  currency: Currency;
  onClose?: () => void;
  showActionButtons?: boolean;
}

export const TicketLandscape10x5: React.FC<TicketLandscape10x5Props> = ({
  booking,
  currency,
  showActionButtons = true,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [targetPhone, setTargetPhone] = useState<string>(
    booking.passengers[0]?.phone || booking.paymentPhone || ''
  );

  // Calculate convocation time (30 min prior)
  const [depH, depM] = (booking.trip.departureTime || '08:00').split(':').map(Number);
  let convM = depM - 30;
  let convH = depH;
  if (convM < 0) {
    convM += 60;
    convH = (convH - 1 + 24) % 24;
  }
  const convocationTime = `${String(convH).padStart(2, '0')}:${String(convM).padStart(2, '0')}`;

  const primaryPax = booking.passengers[0];
  const paxFullName = `${primaryPax.firstName} ${primaryPax.lastName.toUpperCase()}`;
  const seatsList = booking.passengers.map((p) => p.seatNumber).join(', ');

  useEffect(() => {
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

    QRCode.toDataURL(qrPayload, {
      width: 240,
      margin: 1,
      color: { dark: '#044728', light: '#ffffff' },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code error:', err));
  }, [booking, paxFullName, seatsList]);

  // Handle WhatsApp Sharing
  const handleWhatsAppClick = async () => {
    setIsSharingWhatsApp(true);
    setStatusNotice('Préparation du billet paysage 10×5 cm pour WhatsApp...');
    try {
      await shareTicketOnWhatsApp(booking, currency, targetPhone);
      setStatusNotice('✅ Billet ouvert pour envoi WhatsApp !');
    } catch (e) {
      console.warn('WhatsApp share fallback:', e);
      // Direct text fallback
      const text = getWhatsAppTicketText(booking, currency);
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
      setStatusNotice('✅ Message WhatsApp généré !');
    } finally {
      setIsSharingWhatsApp(false);
      setTimeout(() => setStatusNotice(null), 3500);
    }
  };

  // Download high-res PNG image (10x5 cm ratio 2:1)
  const handleDownloadImage = async () => {
    setIsGeneratingImg(true);
    setStatusNotice('Génération de l\'image haute définition 10×5 cm...');
    try {
      const { dataUrl, fileName } = await generateTicketLandscape10x5Image(booking, currency);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setStatusNotice('✅ Image 10×5 cm téléchargée avec succès (PNG) !');
    } catch (e) {
      console.error('Image gen error:', e);
      setStatusNotice('Erreur lors du téléchargement de l\'image.');
    } finally {
      setIsGeneratingImg(false);
      setTimeout(() => setStatusNotice(null), 3500);
    }
  };

  // Download PDF (100 mm x 50 mm)
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setStatusNotice('Génération du PDF Paysage 100×50 mm (10×5 cm)...');
    try {
      const { doc, fileName } = await generateTicketLandscape10x5PDF(booking, currency);
      doc.save(fileName);
      setStatusNotice('✅ PDF Paysage 10×5 cm téléchargé avec succès !');
    } catch (e) {
      console.error('PDF gen error:', e);
      setStatusNotice('Erreur lors du téléchargement du PDF.');
    } finally {
      setIsGeneratingPdf(false);
      setTimeout(() => setStatusNotice(null), 3500);
    }
  };

  // Copy WhatsApp formatted text
  const handleCopyText = () => {
    const text = getWhatsAppTicketText(booking, currency);
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setStatusNotice('✅ Texte officiel WhatsApp copié dans le presse-papier !');
    setTimeout(() => {
      setCopiedText(false);
      setStatusNotice(null);
    }, 2500);
  };

  return (
    <div className="space-y-4">
      {/* Notice Banner */}
      {statusNotice && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-950 px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-150">
          <span>{statusNotice}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* THE 10×5 CM LANDSCAPE TICKET (PROPORTIONS EXACTES 2:1)   */}
      {/* ======================================================== */}
      <div className="w-full flex justify-center">
        <div 
          className="w-full max-w-[680px] aspect-[2/1] bg-white rounded-2xl shadow-xl border-2 border-emerald-800 overflow-hidden relative flex flex-col justify-between text-slate-900 select-none print:shadow-none print:border-black"
          style={{ minHeight: '260px' }}
        >
          {/* Top Emerald Header */}
          <div className="bg-[#044728] text-white px-3.5 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between border-b-2 border-amber-400 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm sm:text-base tracking-tight text-white">AFRIWAY</span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-600">
                BILLET 10×5 CM
              </span>
            </div>
            <div className="text-right">
              <span className="font-black text-xs sm:text-sm uppercase tracking-wide text-amber-300 block truncate max-w-[180px] sm:max-w-[240px]">
                {booking.trip.companyName}
              </span>
            </div>
          </div>

          {/* Main Body: Left Travel Info + Right Stub */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* Left Main Information Area (~68% width) */}
            <div className="flex-1 p-2.5 sm:p-4 flex flex-col justify-between min-w-0">
              
              {/* Route */}
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base sm:text-xl font-black text-slate-950 tracking-tight uppercase truncate">
                    {booking.trip.originCity} ➔ {booking.trip.destinationCity}
                  </h3>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 truncate mt-0.5">
                  Gare départ : {booking.trip.originStationName}
                </p>
              </div>

              {/* Date & Departure Pill Matrix */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 my-1 bg-slate-50 p-1.5 sm:p-2 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-bold block leading-tight">
                    Date
                  </span>
                  <span className="text-[11px] sm:text-xs font-bold font-mono text-slate-900 block truncate">
                    {booking.trip.departureDate}
                  </span>
                </div>
                <div>
                  <span className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-bold block leading-tight">
                    Départ
                  </span>
                  <span className="text-xs sm:text-sm font-black font-mono text-emerald-900 block">
                    {booking.trip.departureTime}
                  </span>
                </div>
                <div>
                  <span className="text-[8px] sm:text-[9px] text-amber-700 uppercase font-bold block leading-tight">
                    Convocation
                  </span>
                  <span className="text-xs sm:text-sm font-black font-mono text-amber-900 block">
                    {convocationTime}
                  </span>
                </div>
              </div>

              {/* Passenger & Bus Plate */}
              <div className="space-y-0.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-black text-slate-900 truncate">
                    {paxFullName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500">
                  <span className="font-mono">
                    {primaryPax.idType || 'CNI'} : {primaryPax.idNumber || '-'}
                  </span>
                  <span className="font-semibold text-emerald-800">
                    Car {booking.trip.plateNumber || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Bottom Footer Note */}
              <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400">
                <span className="text-emerald-700 font-bold truncate">
                  ● Billet Payé ({formatPrice(booking.totalAmountXOF, currency)})
                </span>
                <span className="font-mono">
                  {booking.paymentProvider?.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Perforated Separator with Cutout Notches */}
            <div className="relative flex flex-col justify-between items-center w-0 border-l-2 border-dashed border-slate-300 my-1">
              <div className="w-3 h-3 rounded-full bg-slate-200 -mt-2 -ml-1.5" />
              <div className="w-3 h-3 rounded-full bg-slate-200 -mb-2 -ml-1.5" />
            </div>

            {/* Right Stub (~32% width) */}
            <div className="w-[32%] sm:w-[30%] p-2 sm:p-3 bg-slate-50/70 flex flex-col justify-between items-center text-center shrink-0">
              
              {/* Massive Seat Box */}
              <div className="w-full bg-amber-100 border border-amber-300 rounded-lg py-1 px-1 text-center shadow-xs">
                <span className="text-[8px] sm:text-[9px] uppercase font-bold text-amber-900 block leading-none">
                  SIÈGE
                </span>
                <span className="text-lg sm:text-2xl font-black font-mono text-slate-950 leading-tight">
                  {seatsList}
                </span>
              </div>

              {/* QR Code */}
              <div className="my-auto py-1">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Billet ${booking.pnr}`}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-lg border border-slate-300 bg-white p-0.5 shadow-xs"
                  />
                ) : (
                  <div className="w-16 h-16 bg-slate-200 animate-pulse rounded-lg" />
                )}
              </div>

              {/* PNR Code */}
              <div className="w-full bg-slate-200/80 rounded py-0.5 px-1 font-mono text-[9px] sm:text-[10px] font-black text-slate-800 truncate">
                {booking.pnr}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Target WhatsApp phone bar */}
      <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-600 font-bold whitespace-nowrap">N° WhatsApp destinataire :</span>
          <input
            type="tel"
            value={targetPhone}
            onChange={(e) => setTargetPhone(e.target.value)}
            placeholder="+223 70 00 00 00"
            className="flex-1 sm:w-48 px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
        <div className="text-[11px] text-slate-500 text-center sm:text-right">
          Format Paysage conforme 10×5 cm (Prêt pour WhatsApp et imprimante ticket)
        </div>
      </div>

      {/* ======================================================== */}
      {/* ACTION TOOLBAR: WHATSAPP DIRECT, IMAGE, PDF, PRINT       */}
      {/* ======================================================== */}
      {showActionButtons && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {/* Main WhatsApp Button */}
          <button
            onClick={handleWhatsAppClick}
            disabled={isSharingWhatsApp}
            className="col-span-2 sm:col-span-1 py-3 px-3 bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all uppercase tracking-wide"
            title="Envoyer le billet format paysage 10×5 cm par WhatsApp"
          >
            {isSharingWhatsApp ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Envoyer WhatsApp</span>
          </button>

          {/* Download 10x5 cm Image */}
          <button
            onClick={handleDownloadImage}
            disabled={isGeneratingImg}
            className="py-3 px-3 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
            title="Télécharger l'image PNG au format paysage 10×5 cm (Idéal statut ou photo)"
          >
            {isGeneratingImg ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <ImageIcon className="w-4 h-4 text-amber-400" />
            )}
            <span>Image 10×5 cm</span>
          </button>

          {/* Download 10x5 cm PDF */}
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="py-3 px-3 bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
            title="Télécharger le fichier PDF au format paysage 10×5 cm (100×50 mm)"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
            ) : (
              <FileDown className="w-4 h-4 text-emerald-300" />
            )}
            <span>PDF 10×5 cm</span>
          </button>

          {/* Copy WhatsApp text */}
          <button
            onClick={handleCopyText}
            className="py-3 px-3 bg-white hover:bg-slate-100 border border-slate-300 active:scale-98 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
            title="Copier le texte formaté pour WhatsApp"
          >
            {copiedText ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4 text-slate-500" />
            )}
            <span>{copiedText ? 'Copié !' : 'Copier Texte'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
