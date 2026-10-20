/**
 * Robust extraction of Ticket PNR from any QR Code payload or scanner input
 * Handles:
 * - Direct PNR string: "AFW-84920" or "AFW84920"
 * - JSON payload: {"app":"AFRIWAY","pnr":"AFW-84920",...}
 * - URLs: "https://afriway.ml/ticket?pnr=AFW-84920"
 * - Raw barcode text or ticket snippets
 */
export function extractPnrFromQrData(rawInput: string): string {
  if (!rawInput) return '';
  const trimmed = rawInput.trim();

  // 1. Check if raw JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('{"') && trimmed.includes('}'))) {
    try {
      const obj = JSON.parse(trimmed);
      if (obj.pnr) return String(obj.pnr).trim().toUpperCase();
      if (obj.PNR) return String(obj.PNR).trim().toUpperCase();
      if (obj.id && String(obj.id).startsWith('AFW')) return String(obj.id).trim().toUpperCase();
      if (obj.ticketRef) return String(obj.ticketRef).trim().toUpperCase();
    } catch {
      // Fall through to regex if JSON was malformed
    }
  }

  // 2. Search for standard AFRIWAY PNR pattern (e.g. AFW-84920, AFW-1234, AFW9823)
  const afwMatch = trimmed.match(/AFW-?[A-Z0-9]{4,10}/i);
  if (afwMatch) {
    let pnr = afwMatch[0].toUpperCase();
    if (!pnr.includes('-') && pnr.startsWith('AFW')) {
      pnr = `AFW-${pnr.slice(3)}`;
    }
    return pnr;
  }

  // 3. Search for URL query parameter: pnr=XXXX
  if (trimmed.includes('pnr=')) {
    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://afriway.ml/${trimmed}`);
      const param = url.searchParams.get('pnr');
      if (param) return param.trim().toUpperCase();
    } catch {}
  }

  // 4. Clean fallback: remove unexpected characters
  return trimmed.replace(/["'\r\n]/g, '').trim().toUpperCase();
}
