'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon (Leaflet + webpack/Next.js issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const FRANCE_CENTER: [number, number] = [46.603354, 1.888334];

const DEPT_COORDS: Record<string, { coords: [number, number]; zoom: number }> = {
  '01': { coords: [46.2, 5.3], zoom: 9 },
  '02': { coords: [49.5, 3.6], zoom: 9 },
  '03': { coords: [46.4, 3.2], zoom: 9 },
  '04': { coords: [44.1, 6.2], zoom: 9 },
  '05': { coords: [44.7, 6.3], zoom: 9 },
  '06': { coords: [43.8, 7.2], zoom: 10 },
  '07': { coords: [44.7, 4.6], zoom: 9 },
  '08': { coords: [49.6, 4.6], zoom: 9 },
  '09': { coords: [42.9, 1.5], zoom: 9 },
  '10': { coords: [48.3, 4.1], zoom: 9 },
  '11': { coords: [43.2, 2.4], zoom: 9 },
  '12': { coords: [44.3, 2.6], zoom: 9 },
  '13': { coords: [43.45, 5.15], zoom: 10 },
  '14': { coords: [49.1, -0.4], zoom: 9 },
  '15': { coords: [45.0, 2.7], zoom: 9 },
  '16': { coords: [45.7, 0.2], zoom: 9 },
  '17': { coords: [45.9, -0.8], zoom: 9 },
  '18': { coords: [47.0, 2.5], zoom: 9 },
  '19': { coords: [45.3, 1.8], zoom: 9 },
  '2A': { coords: [41.9, 9.0], zoom: 10 },
  '2B': { coords: [42.4, 9.2], zoom: 10 },
  '21': { coords: [47.3, 4.8], zoom: 9 },
  '22': { coords: [48.5, -3.0], zoom: 9 },
  '23': { coords: [46.1, 2.0], zoom: 9 },
  '24': { coords: [45.1, 0.7], zoom: 9 },
  '25': { coords: [47.2, 6.4], zoom: 9 },
  '26': { coords: [44.7, 5.2], zoom: 9 },
  '27': { coords: [49.1, 1.2], zoom: 9 },
  '28': { coords: [48.3, 1.3], zoom: 9 },
  '29': { coords: [48.4, -4.2], zoom: 9 },
  '30': { coords: [44.0, 4.1], zoom: 9 },
  '31': { coords: [43.6, 1.4], zoom: 9 },
  '32': { coords: [43.7, 0.6], zoom: 9 },
  '33': { coords: [44.8, -0.6], zoom: 9 },
  '34': { coords: [43.6, 3.6], zoom: 9 },
  '35': { coords: [48.1, -1.7], zoom: 9 },
  '36': { coords: [46.8, 1.6], zoom: 9 },
  '37': { coords: [47.3, 0.7], zoom: 9 },
  '38': { coords: [45.3, 5.6], zoom: 9 },
  '39': { coords: [46.7, 5.7], zoom: 9 },
  '40': { coords: [43.9, -0.5], zoom: 9 },
  '41': { coords: [47.6, 1.3], zoom: 9 },
  '42': { coords: [45.7, 4.2], zoom: 9 },
  '43': { coords: [45.1, 3.7], zoom: 9 },
  '44': { coords: [47.3, -1.6], zoom: 9 },
  '45': { coords: [47.9, 2.2], zoom: 9 },
  '46': { coords: [44.6, 1.6], zoom: 9 },
  '47': { coords: [44.3, 0.5], zoom: 9 },
  '48': { coords: [44.5, 3.5], zoom: 9 },
  '49': { coords: [47.4, -0.5], zoom: 9 },
  '50': { coords: [48.9, -1.3], zoom: 9 },
  '51': { coords: [48.9, 4.0], zoom: 9 },
  '52': { coords: [48.1, 5.3], zoom: 9 },
  '53': { coords: [48.1, -0.8], zoom: 9 },
  '54': { coords: [48.7, 6.2], zoom: 9 },
  '55': { coords: [49.0, 5.4], zoom: 9 },
  '56': { coords: [47.8, -2.8], zoom: 9 },
  '57': { coords: [49.0, 6.7], zoom: 9 },
  '58': { coords: [47.1, 3.5], zoom: 9 },
  '59': { coords: [50.4, 3.2], zoom: 9 },
  '60': { coords: [49.4, 2.4], zoom: 9 },
  '61': { coords: [48.6, 0.1], zoom: 9 },
  '62': { coords: [50.5, 2.3], zoom: 9 },
  '63': { coords: [45.8, 3.1], zoom: 9 },
  '64': { coords: [43.3, -0.8], zoom: 9 },
  '65': { coords: [43.1, 0.1], zoom: 9 },
  '66': { coords: [42.6, 2.5], zoom: 9 },
  '67': { coords: [48.6, 7.5], zoom: 9 },
  '68': { coords: [47.9, 7.2], zoom: 9 },
  '69': { coords: [45.76, 4.83], zoom: 10 },
  '70': { coords: [47.6, 6.2], zoom: 9 },
  '71': { coords: [46.6, 4.5], zoom: 9 },
  '72': { coords: [47.9, 0.2], zoom: 9 },
  '73': { coords: [45.5, 6.4], zoom: 9 },
  '74': { coords: [46.1, 6.4], zoom: 9 },
  '75': { coords: [48.8566, 2.3522], zoom: 12 },
  '76': { coords: [49.6, 1.1], zoom: 9 },
  '77': { coords: [48.6, 2.9], zoom: 9 },
  '78': { coords: [48.8, 1.9], zoom: 10 },
  '79': { coords: [46.5, -0.4], zoom: 9 },
  '80': { coords: [49.9, 2.3], zoom: 9 },
  '81': { coords: [43.8, 2.1], zoom: 9 },
  '82': { coords: [44.0, 1.3], zoom: 9 },
  '83': { coords: [43.5, 6.2], zoom: 9 },
  '84': { coords: [44.0, 5.1], zoom: 9 },
  '85': { coords: [46.7, -1.3], zoom: 9 },
  '86': { coords: [46.6, 0.4], zoom: 9 },
  '87': { coords: [45.9, 1.3], zoom: 9 },
  '88': { coords: [48.2, 6.4], zoom: 9 },
  '89': { coords: [47.8, 3.6], zoom: 9 },
  '90': { coords: [47.6, 6.9], zoom: 11 },
  '91': { coords: [48.5, 2.2], zoom: 10 },
  '92': { coords: [48.83, 2.25], zoom: 12 },
  '93': { coords: [48.91, 2.45], zoom: 12 },
  '94': { coords: [48.78, 2.47], zoom: 12 },
  '95': { coords: [49.05, 2.2], zoom: 10 },
  // DOM-TOM with adapted zoom
  '971': { coords: [16.25, -61.55], zoom: 10 },   // Guadeloupe
  '972': { coords: [14.64, -61.02], zoom: 10 },   // Martinique
  '973': { coords: [3.92, -53.23], zoom: 7 },     // Guyane (large)
  '974': { coords: [-21.12, 55.53], zoom: 10 },   // Reunion
  '976': { coords: [-12.78, 45.15], zoom: 11 },   // Mayotte (small)
};

// Well-known DOM-TOM keywords in buyer names
const DOMTOM_KEYWORDS: [string, string][] = [
  ['mayotte', '976'],
  ['mamoudzou', '976'],
  ['reunion', '974'],
  ['saint-denis de la reunion', '974'],
  ['martinique', '972'],
  ['fort-de-france', '972'],
  ['guadeloupe', '971'],
  ['pointe-a-pitre', '971'],
  ['basse-terre', '971'],
  ['guyane', '973'],
  ['cayenne', '973'],
  ['kourou', '973'],
];

function normalizeDept(dept: string): string {
  const d = dept.trim();
  if (d === '20A') return '2A';
  if (d === '20B') return '2B';
  if (d === '20') return '2A';
  if (/^\d$/.test(d)) return d.padStart(2, '0');
  if (/^0\d{2}$/.test(d)) return d.slice(1);
  return d;
}

/** Try to extract a department code from buyer/location text */
function extractDeptFromText(text: string): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  // Check DOM-TOM keywords first
  for (const [kw, dept] of DOMTOM_KEYWORDS) {
    if (lower.includes(kw)) return dept;
  }
  // Try (XX) pattern
  const m = text.match(/\((\d{2,3}|2[AB])\)/);
  if (m && DEPT_COORDS[m[1]]) return m[1];
  // Try postal code
  const pm = text.match(/\b((?:0[1-9]|[1-8]\d|9[0-5]|97[1-6]|2[AB])\d{3})\b/);
  if (pm) {
    const code = pm[1];
    if (code.startsWith('97')) { const d = code.substring(0, 3); if (DEPT_COORDS[d]) return d; }
    if (code.startsWith('20')) return parseInt(code) >= 20200 ? '2B' : '2A';
    const d = code.substring(0, 2); if (DEPT_COORDS[d]) return d;
  }
  return null;
}

interface Props {
  department: string | null | undefined;
  departmentName?: string | null;
  buyer?: string | null;
}

/** Check if we can resolve coords — exported so the page can conditionally render */
export function canResolveLocation(department: string | null | undefined, buyer?: string | null): boolean {
  const normalized = department ? normalizeDept(department) : '';
  const isUnknown = !normalized || normalized === '00' || normalized === 'nan';
  const resolvedDept = isUnknown ? extractDeptFromText(buyer || '') : normalized;
  return !!(resolvedDept && DEPT_COORDS[resolvedDept]);
}

export default function DepartmentMap({ department, departmentName, buyer }: Props) {
  const normalized = department ? normalizeDept(department) : '';
  const isUnknown = !normalized || normalized === '00' || normalized === 'nan';
  const resolvedDept = isUnknown ? extractDeptFromText(buyer || '') : normalized;
  const info = resolvedDept ? DEPT_COORDS[resolvedDept] : null;

  // Don't render anything if no valid coordinates
  if (!info) return null;

  return (
    <div style={{ borderRadius: '0 0 10px 10px', overflow: 'hidden', height: 280, position: 'relative', zIndex: 0 }}>
      <MapContainer
        center={info.coords}
        zoom={info.zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={info.coords}>
          <Popup>
            {departmentName
              ? `${departmentName} (${resolvedDept})`
              : `Departement ${resolvedDept}`}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
