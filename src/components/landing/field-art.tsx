/* Aerial farmland illustration for the landing page.
   Static SVG, no client JS. Pattern ids are prefixed rf- and the component should appear once per page. */

const G1 = '#87AA58';
const G2 = '#9CBA6A';
const G3 = '#76994A';
const G4 = '#ADC67F';
const MUSTARD = '#DDB340';
const FALLOW = '#CDB794';
const WATER = '#7FA6C4';

type Strip = [x: number, y: number, w: number, h: number, fill: string];

const BLOCK_A: Strip[] = [
  [0, 0, 60, 300, G1],
  [64, 0, 45, 300, G2],
  [113, 0, 70, 300, MUSTARD],
  [187, 0, 50, 300, G3],
  [241, 0, 80, 300, G1],
  [325, 0, 55, 300, G4],
];
const BLOCK_B: Strip[] = [
  [392, 0, 408, 50, G2],
  [392, 54, 408, 70, FALLOW],
  [392, 128, 408, 40, G1],
  [392, 256, 408, 44, G3],
];
const BLOCK_C: Strip[] = [
  [0, 312, 300, 60, G3],
  [0, 376, 300, 40, MUSTARD],
  [0, 420, 300, 80, G2],
  [0, 504, 300, 40, G4],
  [0, 548, 300, 52, G1],
];
const BLOCK_D: Strip[] = [
  [532, 312, 50, 288, G1],
  [586, 312, 64, 288, G2],
  [698, 312, 70, 288, FALLOW],
  [772, 312, 28, 288, G3],
];
const BLOCK_E: Strip[] = [
  [0, 612, 70, 300, G2],
  [74, 612, 50, 300, G1],
  [128, 612, 90, 300, MUSTARD],
  [222, 612, 60, 300, G3],
  [286, 612, 45, 300, G4],
  [419, 612, 65, 300, G1],
  [488, 612, 55, 300, FALLOW],
  [547, 612, 95, 300, G2],
  [646, 612, 70, 300, G3],
  [720, 612, 80, 300, G1],
];
const WATER_STRIPS: Strip[] = [
  [392, 172, 408, 80, WATER],
  [654, 312, 40, 288, WATER],
  [335, 612, 80, 300, WATER],
];
const TREES: [number, number, number, string][] = [
  [330, 436, 16, '#4F7A3C'],
  [356, 448, 13, '#4F7A3C'],
  [458, 350, 15, '#4F7A3C'],
  [470, 378, 12, '#4F7A3C'],
  [490, 440, 17, '#4F7A3C'],
  [340, 560, 14, '#4F7A3C'],
  [500, 572, 15, '#4F7A3C'],
  [420, 586, 12, '#4F7A3C'],
  [344, 430, 11, '#3F6A31'],
  [478, 452, 11, '#3F6A31'],
  [352, 572, 9, '#3F6A31'],
  [462, 364, 9, '#3F6A31'],
];
const ROOFS: Strip[] = [
  [392, 470, 28, 18, '#A9452D'],
  [428, 486, 22, 16, '#EDE5D3'],
  [378, 500, 24, 16, '#8E3A26'],
  [440, 520, 26, 18, '#A9452D'],
  [398, 532, 20, 14, '#EDE5D3'],
];

function strips(list: Strip[]) {
  return list.map(([x, y, w, h, fill]) => (
    <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} fill={fill} />
  ));
}

export function FieldArt({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label}>
      <defs>
        <pattern id="rf-rows-h" width="7" height="7" patternUnits="userSpaceOnUse">
          <path d="M0 3.5h7" stroke="#1C140C" strokeOpacity="0.11" strokeWidth="1.6" />
        </pattern>
        <pattern id="rf-rows-v" width="7" height="7" patternUnits="userSpaceOnUse">
          <path d="M3.5 0v7" stroke="#1C140C" strokeOpacity="0.11" strokeWidth="1.6" />
        </pattern>
        <pattern id="rf-water" width="20" height="12" patternUnits="userSpaceOnUse">
          <path
            d="M2 7 q4 -3.5 8 0 t8 0"
            stroke="#FFFFFF"
            strokeOpacity="0.3"
            strokeWidth="1.4"
            fill="none"
          />
        </pattern>
      </defs>

      <rect width="800" height="900" fill="#D6C9AE" />

      <g transform="translate(400 450) rotate(-12) scale(1.35) translate(-400 -450)">
        {strips(BLOCK_A)}
        <rect x="0" y="0" width="380" height="300" fill="url(#rf-rows-v)" />
        {strips(BLOCK_B)}
        <rect x="392" y="0" width="408" height="300" fill="url(#rf-rows-h)" />

        <path d="M-200 306 H1000" stroke="#8FB3CF" strokeWidth="7" />

        {strips(BLOCK_C)}
        <rect x="0" y="312" width="300" height="288" fill="url(#rf-rows-h)" />

        {/* village: pond, trees, roofs */}
        <rect x="312" y="312" width="208" height="288" fill="#C2B48F" />
        <rect x="336" y="344" width="104" height="72" rx="22" fill="#5E8DBA" />
        <rect x="336" y="344" width="104" height="72" rx="22" fill="url(#rf-water)" />
        {TREES.map(([cx, cy, r, fill]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={fill} />
        ))}
        {ROOFS.map(([x, y, w, h, fill]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="2" fill={fill} />
        ))}

        {strips(BLOCK_D)}
        <rect x="532" y="312" width="268" height="288" fill="url(#rf-rows-v)" />
        {strips(BLOCK_E)}
        <rect x="0" y="612" width="800" height="300" fill="url(#rf-rows-v)" />

        {/* flooded paddy strips sit above the row texture */}
        {WATER_STRIPS.map(([x, y, w, h, fill]) => (
          <g key={`${x}-${y}`}>
            <rect x={x} y={y} width={w} height={h} fill={fill} />
            <rect x={x} y={y} width={w} height={h} fill="url(#rf-water)" />
          </g>
        ))}

        {/* "your field" */}
        <rect
          x="586"
          y="312"
          width="64"
          height="288"
          fill="none"
          stroke="#FFFDF9"
          strokeWidth="5"
        />
        <circle cx="618" cy="456" r="20" fill="#FFFDF9" fillOpacity="0.4" />
        <circle cx="618" cy="456" r="9" fill="#231C15" stroke="#FFFDF9" strokeWidth="3.5" />
      </g>
    </svg>
  );
}
