// Pre-generated vector SVG data URLs for West African bus transport companies
// Ready for HTML img tags, print styling, and PDF embedding

export function createCompanySvgLogo(name: string, acronym: string, primaryColor: string, secondaryColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 70" width="240" height="70">
  <defs>
    <linearGradient id="grad_${acronym}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryColor}" />
      <stop offset="100%" stop-color="${secondaryColor}" />
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="66" height="66" rx="14" fill="url(#grad_${acronym})" />
  <!-- Bus icon abstract symbol inside badge -->
  <path d="M18 20 C18 16, 52 16, 52 20 L54 44 C54 47, 51 49, 48 49 L48 53 C48 54, 46 55, 45 55 L43 55 C42 55, 41 54, 41 53 L41 49 L29 49 L29 53 C29 54, 28 55, 27 55 L25 55 C24 55, 23 54, 23 53 L23 49 C20 49, 18 47, 18 44 Z" fill="white" opacity="0.9" />
  <rect x="22" y="24" width="26" height="11" rx="3" fill="${primaryColor}" opacity="0.8" />
  <circle cx="25" cy="42" r="3" fill="${primaryColor}" />
  <circle cx="45" cy="42" r="3" fill="${primaryColor}" />
  <!-- Text Brand -->
  <text x="80" y="32" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="20" fill="#0f172a" letter-spacing="-0.5">${acronym}</text>
  <text x="80" y="48" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="11" fill="${primaryColor}">${name.toUpperCase()}</text>
  <text x="80" y="59" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="8" fill="#64748b" letter-spacing="0.5">TRANSPORT VOYAGEURS AGRÉÉ</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_COMPANY_LOGOS: Record<string, string> = {
  nour_transport: createCompanySvgLogo('Nour Transport', 'NOUR', '#044728', '#0f766e'),
  sonef_voyages: createCompanySvgLogo('SONEF Transport', 'SONEF', '#1e3a8a', '#2563eb'),
  bani_transport: createCompanySvgLogo('Bani Transport', 'BANI', '#b91c1c', '#dc2626'),
  gana_transport: createCompanySvgLogo('Gana Transport', 'GANA', '#065f46', '#059669'),
  africa_tours: createCompanySvgLogo('Africa Tours Trans', 'ATT', '#c2410c', '#ea580c'),
};
