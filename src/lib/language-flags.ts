const FLAGS: Record<string, string> = {
  en: stripes([
    ['#012169', '0 0 60 30'],
  ]).replace(
    '</svg>',
    `<path d="M0 0 L60 30 M60 0 L0 30" stroke="#fff" stroke-width="6"/>
     <path d="M0 0 L60 30 M60 0 L0 30" stroke="#C8102E" stroke-width="4"/>
     <path d="M30 0 V30 M0 15 H60" stroke="#fff" stroke-width="10"/>
     <path d="M30 0 V30 M0 15 H60" stroke="#C8102E" stroke-width="6"/>
     </svg>`
  ),
  fr: columns(['#0055A4', '#FFFFFF', '#EF4135']),
  es: bands(['#AA151B', '0', '0.75'], ['#F1BF00', '0.75', '1.5'], ['#AA151B', '2.25', '0.75']),
  de: bands(['#000000', '0', '1'], ['#DD0000', '1', '1'], ['#FFCE00', '2', '1']),
  it: columns(['#009246', '#FFFFFF', '#CE2B37']),
  pt: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="1.2" height="2" fill="#006600"/><rect x="1.2" width="1.8" height="2" fill="#FF0000"/></svg>`,
  nl: bands(['#AE1C28', '0', '1'], ['#FFFFFF', '1', '1'], ['#21468B', '2', '1']),
  pl: bands(['#FFFFFF', '0', '1.5'], ['#DC143C', '1.5', '1.5']),
  sv: cross('#006AA7', '#FECC00'),
  da: cross('#C60C30', '#FFFFFF'),
  fi: cross('#FFFFFF', '#003580'),
  ie: columns(['#169B62', '#FFFFFF', '#FF883E']),
  at: bands(['#ED2939', '0', '1'], ['#FFFFFF', '1', '1'], ['#ED2939', '2', '1']),
  be: columns(['#000000', '#FAE042', '#ED2939']),
  ro: columns(['#002B7F', '#FCD116', '#CE1126']),
  hu: bands(['#CE2939', '0', '1'], ['#FFFFFF', '1', '1'], ['#477050', '2', '1']),
  cz: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="3" height="1" fill="#FFFFFF"/><rect y="1" width="3" height="1" fill="#D7141A"/><path d="M0 0 L1.2 1 L0 2 Z" fill="#11457E"/></svg>`,
  gr: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 27 18"><rect width="27" height="18" fill="#0D5EAF"/><path d="M0 2 H27 M0 6 H27 M0 10 H27 M0 14 H27" stroke="#FFFFFF" stroke-width="2"/><rect width="10" height="10" fill="#0D5EAF"/><path d="M0 5 H10 M5 0 V10" stroke="#FFFFFF" stroke-width="2"/></svg>`,
  fa: bands(['#239F40', '0', '1'], ['#FFFFFF', '1', '1'], ['#DA0000', '2', '1']),
  ar: bands(['#000000', '0', '0.6'], ['#FFFFFF', '0.6', '0.6'], ['#007A3D', '1.2', '0.8']),
  ru: bands(['#FFFFFF', '0', '1'], ['#0039A6', '1', '1'], ['#D52B1E', '2', '1']),
  tr: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="3" height="2" fill="#E30A17"/><circle cx="1.15" cy="1" r="0.45" fill="#FFFFFF"/><circle cx="1.28" cy="1" r="0.36" fill="#E30A17"/></svg>`,
  ja: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="3" height="2" fill="#FFFFFF"/><circle cx="1.5" cy="1" r="0.55" fill="#BC002D"/></svg>`,
  ko: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="3" height="2" fill="#FFFFFF"/><circle cx="1.5" cy="1" r="0.42" fill="#CD2E3A"/><path d="M1.5 0.58 A0.42 0.42 0 0 0 1.5 1.42 A0.21 0.21 0 0 1 1.5 1 A0.21 0.21 0 0 0 1.5 0.58" fill="#0047A0"/></svg>`,
  zh: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="3" height="2" fill="#DE2910"/><polygon points="0.45,0.28 0.52,0.5 0.75,0.5 0.56,0.63 0.63,0.85 0.45,0.72 0.27,0.85 0.34,0.63 0.15,0.5 0.38,0.5" fill="#FFDE00"/></svg>`,
  hi: bands(['#FF9933', '0', '1'], ['#FFFFFF', '1', '1'], ['#138808', '2', '1'])
};

function svg(body: string, viewBox = '0 0 3 2'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`;
}

function columns(colors: string[]): string {
  return svg(colors.map((color, index) => `<rect x="${index}" width="1" height="2" fill="${color}"/>`).join(''));
}

function bands(...parts: string[][]): string {
  return svg(parts.map(([color, y, height]) => `<rect y="${y}" width="3" height="${height}" fill="${color}"/>`).join(''), '0 0 3 3');
}

function stripes(rects: string[][]): string {
  return svg(rects.map(([color, box]) => {
    const [x, y, width, height] = box.split(' ');
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${color}"/>`;
  }).join(''), '0 0 60 30');
}

function cross(field: string, bar: string): string {
  return svg(
    `<rect width="16" height="10" fill="${field}"/><rect x="5" width="2" height="10" fill="${bar}"/><rect y="4" width="16" height="2" fill="${bar}"/>`,
    '0 0 16 10'
  );
}

function fallback(code: string): string {
  const letters = code.slice(0, 2).toUpperCase().replace(/[^A-Z]/g, '');
  return svg(
    `<rect width="24" height="16" fill="#e6edf3"/><text x="12" y="11" text-anchor="middle" font-size="7" font-family="sans-serif" fill="#1f2328">${letters}</text>`,
    '0 0 24 16'
  );
}

export function languageFlagSvg(code: string): string {
  const normalized = code.trim().toLowerCase();
  const base = normalized.split('-')[0] ?? normalized;
  return FLAGS[base] ?? fallback(base || '??');
}
