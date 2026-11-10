import { useId } from 'react';
import type { RefObject } from 'react';

// Follow the lower water contour, overlapping by 1.5 SVG units to avoid an
// exposed sky/bank seam between separately antialiased filled paths.
const FIELD_SURFACE = 'M-4096 419.5H-40Q282 351.5 534 379.5Q790 406.5 1008 345.5H5056V4096H-4096Z';

/** Original 2D vector artwork. Activity scenes are illustrative, never a crop-growth or spacing prescription. */
export function FarmIllustration({
  svgRef,
  stage,
}: {
  svgRef: RefObject<SVGSVGElement | null>;
  stage: number;
}) {
  const id = useId().replaceAll(':', ''),
    p = (name: string) => `${id}-${name}`,
    url = (name: string) => `url(#${p(name)})`;
  return (
    <svg
      ref={svgRef}
      className="farm-vector"
      viewBox="0 0 960 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      data-artwork="original-2d"
    >
      <defs>
        <clipPath id={p('whole-field')}>
          <path d={FIELD_SURFACE} />
        </clipPath>
        <linearGradient id={p('sky')} x2="0" y2="1">
          <stop stopColor="#e8f0ed" />
          <stop offset="1" stopColor="#fff5dc" />
        </linearGradient>
        <linearGradient id={p('earth')} x2="0.7" y2="1">
          <stop stopColor="#b59062" />
          <stop offset="1" stopColor="#80664a" />
        </linearGradient>
        <linearGradient id={p('water')} x2="1" y2="0.6">
          <stop stopColor="#8cbebc" />
          <stop offset="1" stopColor="#bed9ce" />
        </linearGradient>
        <pattern id={p('soil-specks')} width="37" height="29" patternUnits="userSpaceOnUse">
          <path d="m5 9 5-1m12 12 4 1m-21 4 2-1" stroke="#6d5439" strokeWidth="1.3" opacity=".25" />
          <circle cx="30" cy="4" r="1" fill="#e6c597" />
        </pattern>
        <pattern
          id={p('roof-ribs')}
          width="14"
          height="14"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-9)"
        >
          <path d="M2 0v14M5 0v14" stroke="#72908b" strokeWidth="1" />
          <path d="M0 0v14" stroke="#d9e4da" strokeWidth="2" />
        </pattern>
        <pattern id={p('cloth')} width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 3h12M0 8h12" stroke="#e1e3c7" strokeWidth="1.5" opacity=".7" />
          <path d="M3 0v12M8 0v12" stroke="#183f43" opacity=".3" />
        </pattern>
        <pattern id={p('weave')} width="7" height="5" patternUnits="userSpaceOnUse">
          <path d="M0 0h7M0 3h7M2 0v3m3 0v2" stroke="#9d793e" strokeWidth=".7" fill="none" />
        </pattern>
        <clipPath id={p('sowing-clip')}>
          <path d="M-40 445 409 404 453 800H-40Z" />
        </clipPath>
        <clipPath id={p('grain-clip')}>
          <path d="M494 356 1000 320 1000 616 455 518Z" />
        </clipPath>
        <clipPath id={p('young-clip')}>
          <path d="m458 547 542 102v151H469Z" />
        </clipPath>
        <symbol id={p('wheat')} viewBox="-15 -70 30 75">
          <path d="M0 2q-3-31 1-62" stroke="#8f8542" strokeWidth="1.8" fill="none" />
          <path d="M-1-18q-13-8-12-17 11 2 13 12m0-9q10-8 12-18-10 5-12 12" fill="#99a061" />
          {Array.from({ length: 6 }, (_, i) => (
            <g key={i}>
              <ellipse
                cx={i % 2 ? -3 : 3}
                cy={-38 - i * 4.2}
                rx="2.6"
                ry="5"
                transform={`rotate(${i % 2 ? -35 : 35} ${i % 2 ? -3 : 3} ${-38 - i * 4.2})`}
                fill={i % 2 ? 'var(--grain-dark, #d9b960)' : 'var(--grain-light, #e6c978)'}
              />
              <path
                d={`M${i % 2 ? -4 : 4} ${-39 - i * 4.2}l${i % 2 ? -3 : 3}-8`}
                stroke="#a7934b"
                strokeWidth=".7"
              />
            </g>
          ))}
        </symbol>
        <symbol id={p('seedling')} viewBox="-17 -38 34 41">
          <path d="M0 2Q-2-18 2-36" stroke="#587b4d" strokeWidth="1.7" fill="none" />
          <path
            d="M0-9Q-12-19-14-30-3-24 0-13M0-17Q11-29 15-30 12-16 0-12M1-22Q-4-35 4-38 7-32 1-22"
            fill="#7e9b5b"
          />
          <path d="M0-10-9-16m9 0 9-9" stroke="#a4b178" strokeWidth=".7" />
        </symbol>
        <symbol id={p('seed')} viewBox="0 0 10 6">
          <ellipse cx="5" cy="3" rx="4" ry="2.1" fill="#e3c16e" transform="rotate(-25 5 3)" />
          <path d="m2 4 5-3" stroke="#ac8d48" strokeWidth=".6" />
        </symbol>
        <symbol id={p('tree')} viewBox="-72 -160 144 165" overflow="visible">
          <path d="m-7 3 3-114h10L9 3" fill="#7e7760" />
          <path d="m1-50-27-30m29 12 23-25" stroke="#7e7760" strokeWidth="6" />
          <path
            d="M-63-84q-20-49 22-65 22-30 56-8 40-14 49 25 29 18 12 53-5 25-41 22-31 24-58-2-33 8-40-25"
            fill="#62835d"
          />
          <path
            d="M-59-110q-4-29 24-35 21-23 47-9 35-6 44 25-28-16-43-5-24-20-41 0-23-7-31 24"
            fill="#8ba675"
          />
          <path d="M-52-78q18 22 40 6 20 21 51-1" stroke="#497251" strokeWidth="3" fill="none" />
          {Array.from({ length: 15 }, (_, i) => (
            <path
              key={i}
              d={`M${-45 + ((i * 23) % 90)} ${-130 + ((i * 17) % 55)}q5-6 10-1`}
              stroke="#afbf8b"
              strokeWidth="2"
              opacity=".5"
              fill="none"
            />
          ))}
        </symbol>
        <symbol id={p('hat')} viewBox="-33 -20 66 31">
          <path d="M-22 0q4-20 23-18Q19-16 22 0Z" fill="#dbbc78" />
          <path d="M-21 0q4-19 22-17Q19-15 21 0" fill={url('weave')} opacity=".75" />
          <ellipse cx="0" cy="1" rx="31" ry="6" fill="#ba995a" />
          <ellipse cx="0" cy="-1" rx="31" ry="5" fill="#e4ca8a" />
          <path d="M-28-1q29 5 56 0" stroke="#ac8848" strokeWidth="1.3" fill="none" />
        </symbol>
        <symbol id={p('basket')} viewBox="-24 -17 48 35">
          <path d="M-21-10h42l-6 23q-15 8-30 0Z" fill="#c5a362" />
          <path d="M-21-10h42l-6 23q-15 8-30 0Z" fill={url('weave')} />
          <ellipse cy="-10" rx="21" ry="6" fill="#e0c48b" />
          <ellipse cy="-10" rx="17" ry="3.5" fill="#86734c" />
        </symbol>
      </defs>
      <g className="farm-world">
        <path d="M-4096-4096H5056V4096H-4096Z" fill={url('sky')} />
        <g opacity=".55" fill="#fdfbf1">
          <path d="M63 88q8-17 25-10 4-23 25-22 25-2 27 22 20-7 27 11Z">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0;22 0;0 0"
              dur="28s"
              repeatCount="indefinite"
            />
          </path>
          <path d="M471 65q5-15 23-13 12-27 34-12 17-7 23 10 21-2 26 15Z">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0;-18 0;0 0"
              dur="36s"
              repeatCount="indefinite"
            />
          </path>
        </g>
        <circle data-frame="sun" cx="798" cy="94" r="40" fill="#eac67b" />
        <circle data-frame="sun" cx="798" cy="94" r="52" fill="#eac67b" opacity=".12" />
        {[0, 1, 2].map((i) => (
          <g
            key={i}
            transform={`translate(${285 + i * 36} ${111 + (i % 2) * 13}) scale(${1 - i * 0.12})`}
          >
            <path
              d="M-11 0q5-7 11 0 6-7 11 0"
              fill="none"
              stroke="#6b8071"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0;12 -4;0 0"
                dur={`${7 + i}s`}
                repeatCount="indefinite"
              />
            </path>
          </g>
        ))}
        <path
          d="M-4096 246H-60q144-52 324-13 160-46 318-21 211-51 430-2H5056v162H-4096Z"
          fill="#bac7a0"
        />
        <path
          d="M-4096 272H-50q189-28 358-5 173-40 314-16 182-37 395-2H5056v149H-4096Z"
          fill="#9bad82"
        />
        {Array.from({ length: 17 }, (_, i) => (
          <g key={i} transform={`translate(${i * 65 - 30} ${264 + (i % 3) * 5})`}>
            <path d="M0 7v-26m0 11-7-8m7 4 8-13" stroke="#72876c" strokeWidth="2" />
            <ellipse cx="-4" cy="-18" rx="12" ry="14" fill={i % 2 ? '#859a73' : '#788f6d'} />
          </g>
        ))}
        <path
          d="M-4096 293H-20q220-12 485-5 198-27 515-11H5056v86H980L-20 396H-4096Z"
          fill="#a6b481"
        />
        {Array.from({ length: 10 }, (_, i) => (
          <path
            key={i}
            d={`M${i * 100 - 30} 290  ${i * 86 - 40} 372`}
            stroke="#d9d1a1"
            strokeWidth="4"
          />
        ))}
        {/* A Bengal homestead: corrugated roof, shaded veranda, bamboo fence and stored grain. */}
        <g data-frame="house" transform="translate(661 189)">
          <path d="M-27 109 147 105l45 24-220 7Z" fill="#819268" opacity=".4" />
          <path d="M0 30h118v83H0Z" fill="#dfd5b3" />
          <path d="M81 28h48v85H81Z" fill="#c7bc96" />
          <path d="m-20 31 54-49 109 22 20 38-102-8Z" fill="#9aafa3" />
          <path d="m-20 31 54-49 109 22 20 38-102-8Z" fill={url('roof-ribs')} />
          <path d="m-22 32 85 4L165 44" fill="none" stroke="#667f77" strokeWidth="5" />
          <path d="M10 44h31v66H10Z" fill="#57695b" />
          <path d="M15 48h22v58H15Z" fill="#3e5549" />
          <circle cx="33" cy="80" r="1.6" fill="#dabd76" />
          <path d="M59 51h25v27H59Z" fill="#667b68" />
          <path d="M71 52v25m-10-12h22" stroke="#e1d8b6" strokeWidth="2" />
          <path d="m94 52 20-3v29H94Z" fill="#a19d7e" />
          <path d="m-15 80 112 5 17 13-133-5Z" fill="#879b8b" />
          <path d="M-9 93v29m105-24v24" stroke="#7d7557" strokeWidth="4" />
          <path d="m-16 121 128 1 10 8H-20Z" fill="#b7ac87" />
          <g transform="translate(138 102)">
            <path d="M-11-10q-4-23 8-32h12q11 16 8 38-16 8-28-6" fill="#c7b983" />
            <path d="m-4-37 14-1m-17 10q10 6 19 0m-20 15q11 6 23 0" fill="none" stroke="#aa9d6c" />
          </g>
          <path d="M112 69h14m-14 8h14m-14 8h14" stroke="#9d9774" />
        </g>
        <g data-frame="hay" transform="translate(870 292)">
          <path d="M-35 8q1-60 34-74 30 19 31 71Z" fill="#c9ac67" />
          {Array.from({ length: 9 }, (_, i) => (
            <path
              key={i}
              d={`M${-27 + i * 7} 3Q${-21 + i * 6} -32 0 -60`}
              fill="none"
              stroke="#ad9255"
              strokeWidth="1.2"
            />
          ))}
          <path d="M-39 8q42 8 77-1" fill="none" stroke="#9e864b" strokeWidth="4" />
        </g>
        <g data-frame="tree" transform="translate(106 304)">
          <use href={`#${p('tree')}`} x="-110" y="-244" width="220" height="252" />
          <path d="M-3-118q-7 33-15 49m24-32 8 49" stroke="#77775e" fill="none" strokeWidth="2" />
        </g>
        <g data-frame="banana" transform="translate(565 299)">
          <path d="M0 0q-3-40 3-90" stroke="#8c9966" strokeWidth="7" />
          {[-1, 1].flatMap((d) =>
            [0, 1, 2].map((i) => (
              <path
                key={`${d}-${i}`}
                d={`M3 ${-69 + i * 19}q${d * 44}-42 ${d * 70} 4Q${d * 28} ${-90 + i * 20} 3 ${-69 + i * 19}`}
                fill={i % 2 ? '#6c925e' : '#83a56b'}
              />
            )),
          )}
        </g>
        <g stroke="#8f916b" fill="none">
          {Array.from({ length: 18 }, (_, i) => (
            <path key={i} d={`M${207 + i * 23} ${312 - i * 0.9}v-31`} strokeWidth="3" />
          ))}
          <path d="m204 296 410-17m-410 29 410-17" strokeWidth="2.5" />
        </g>
        {/* Open channel with moving reflections. It is a landscape detail, not a water-use model. */}
        <path
          d="M-4096 369H-40q324-63 578-33 250 27 470-32H5056v53H1008q-218 61-474 34-252-28-574 40H-4096Z"
          fill="#d2c698"
        />
        <path
          d="M-4096 378H-40q324-63 578-33 250 27 470-32H5056v34H1008q-218 61-474 34-252-28-574 40H-4096Z"
          fill={url('water')}
          data-surface="canal-water"
        />
        <g stroke="#e1ebe1" strokeWidth="2" opacity=".8">
          {Array.from({ length: 19 }, (_, i) => (
            <path
              key={i}
              d={`M${i * 57 - 30} ${381 - Math.sin(i * 0.32) * 20}h${12 + (i % 4) * 4}`}
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0;19 0;0 0"
                dur={`${5 + (i % 4)}s`}
                repeatCount="indefinite"
              />
            </path>
          ))}
        </g>
        <path d={FIELD_SURFACE} fill={url('earth')} data-surface="soil" />
        <path d={FIELD_SURFACE} fill={url('soil-specks')} />
        <g clipPath={url('whole-field')}>
          {Array.from({ length: 13 }, (_, row) => (
            <g key={row}>
              <path
                d={`M-4096 ${462 + row * 33}H-50Q430 ${400 + row * 35} 1010 ${430 + row * 37}H5056`}
                fill="none"
                stroke="#c9a675"
                strokeWidth="7"
              />
              <path
                d={`M-4096 ${468 + row * 33}H-50Q430 ${406 + row * 35} 1010 ${436 + row * 37}H5056`}
                fill="none"
                stroke="#806243"
                strokeWidth="2"
              />
            </g>
          ))}
        </g>
        <g transform="translate(400 348)">
          <path d="m0-14 58-4 19 53-59 6Z" fill="#ae956a" />
          {Array.from({ length: 8 }, (_, i) => (
            <path
              key={i}
              d={`m${3 + i * 2.3} ${-10 + i * 6.5} 57-4`}
              stroke="#dac092"
              strokeWidth="4"
            />
          ))}
          <path d="M-2-10 16 41m45-55 16 51" stroke="#8b7956" strokeWidth="3" />
        </g>
        <g className="farm-action" data-story-shot={stage} key={stage}>
          {stage === 0 && (
            <g data-activity="sow">
              {Array.from({ length: 7 }, (_, row) => (
                <g key={row}>
                  {Array.from({ length: 20 }, (_, col) => (
                    <use
                      key={col}
                      href={`#${p('seed')}`}
                      x={col * 49 - 15}
                      y={462 + row * 39 - Math.sin(col * 0.15) * 23}
                      width="5"
                      height="4"
                    />
                  ))}
                </g>
              ))}
              <g className="farm-solid" transform="translate(358 576) scale(2.05)">
                <Farmer kind="sow" prefix={id} />
              </g>
              <g className="farm-solid" transform="translate(253 730)">
                <use href={`#${p('basket')}`} x="-37" y="-27" width="74" height="54" />
              </g>
            </g>
          )}
          {stage === 1 && (
            <g data-activity="care">
              <g clipPath={url('whole-field')}>
                {Array.from({ length: 10 }, (_, row) => (
                  <g key={row}>
                    {Array.from({ length: 22 }, (_, col) => (
                      <g
                        key={col}
                        transform={`translate(${col * 46 - 12} ${464 + row * 35 - Math.sin(col * 0.15) * 24})`}
                      >
                        <use
                          href={`#${p('seedling')}`}
                          x="-14"
                          y={-22 - row}
                          width="28"
                          height={27 + row}
                        />
                      </g>
                    ))}
                  </g>
                ))}
              </g>
              <g className="farm-solid" transform="translate(426 576) scale(2.05)">
                <Farmer kind="water" prefix={id} />
              </g>
            </g>
          )}
          {stage === 2 && (
            <g data-activity="grow" clipPath={url('whole-field')}>
              {Array.from({ length: 9 }, (_, row) => (
                <g key={row}>
                  {Array.from({ length: 29 }, (_, col) => (
                    <g
                      key={col}
                      transform={`translate(${col * 35 + (row % 2) * 15 - 10} ${477 + row * 38 - Math.sin(col * 0.14) * 27})`}
                    >
                      <g>
                        <animateTransform
                          attributeName="transform"
                          type="scale"
                          values="1 .35;1 1"
                          begin="6s"
                          dur="2.4s"
                          fill="freeze"
                          calcMode="spline"
                          keyTimes="0;1"
                          keySplines=".3 0 .3 1"
                        />
                        <use
                          href={`#${p('wheat')}`}
                          x="-18"
                          y={-(81 + row * 2) * 0.96}
                          width="36"
                          height={81 + row * 2}
                          style={
                            {
                              '--grain-light': '#98ab68',
                              '--grain-dark': '#789357',
                            } as React.CSSProperties
                          }
                        />
                        <g opacity="0">
                          <animate
                            attributeName="opacity"
                            values="0;1"
                            begin="7s"
                            dur="1.6s"
                            fill="freeze"
                          />
                          <use
                            href={`#${p('wheat')}`}
                            x="-18"
                            y={-(81 + row * 2) * 0.96}
                            width="36"
                            height={81 + row * 2}
                          />
                        </g>
                      </g>
                    </g>
                  ))}
                </g>
              ))}
            </g>
          )}
          {stage === 3 && (
            <g data-activity="harvest">
              <g clipPath={url('whole-field')}>
                {Array.from({ length: 9 }, (_, row) => (
                  <g key={row}>
                    {Array.from({ length: 27 }, (_, col) =>
                      col < 12 ? (
                        <path
                          key={col}
                          d={`M${col * 36 - 12} ${472 + row * 38}v-12m5 11 1-9`}
                          stroke="#a89b60"
                          strokeWidth="2"
                        />
                      ) : (
                        <use
                          key={col}
                          href={`#${p('wheat')}`}
                          x={col * 36 - 25}
                          y={395 + row * 38 - Math.sin(col * 0.14) * 24}
                          width="36"
                          height={80 + row * 2}
                        />
                      ),
                    )}
                  </g>
                ))}
              </g>
              <g className="farm-solid" transform="translate(385 576) scale(2.05)">
                <Farmer kind="harvest" prefix={id} />
              </g>
              <g className="farm-solid" transform="translate(300 705) rotate(-18)">
                {Array.from({ length: 10 }, (_, i) => (
                  <use
                    key={i}
                    href={`#${p('wheat')}`}
                    x={-33 + i * 5}
                    y="-60"
                    width="25"
                    height="85"
                  />
                ))}
                <path d="M-17 0h39m-38 5h37" stroke="#ab7c41" strokeWidth="3" />
              </g>
              <g className="farm-solid" transform="translate(219 739)">
                <use href={`#${p('basket')}`} x="-37" y="-27" width="74" height="54" />
              </g>
            </g>
          )}
        </g>
        <g transform="translate(29 756)">
          <path d="M0 40q2-45-17-64Q3-14 9 14 7-29 29-46 11 13 16 40" fill="#6c8758" />
          <path d="M11 40q6-30 30-37-14 17-21 37" fill="#91a16b" />
        </g>
        <g transform="translate(940 760)">
          <path d="M0 40q2-45-17-64Q3-14 9 14 7-29 29-46 11 13 16 40" fill="#6c8758" />
        </g>
      </g>
    </svg>
  );
}

/** Three different field workers drawn in the same flat style as the scenery: no outlines, two tones per colour. */
function Farmer({ kind, prefix }: { kind: 'sow' | 'water' | 'harvest'; prefix: string }) {
  return (
    <g data-farm-worker={kind} strokeLinecap="round" strokeLinejoin="round">
      {kind === 'sow' && <Sower prefix={prefix} />}
      {kind === 'water' && <Waterer />}
      {kind === 'harvest' && <Reaper prefix={prefix} />}
    </g>
  );
}

const EASE = '.42 0 .58 1';

/** An older farmer in a bamboo mathal, vest and lungi, broadcasting seed from a basket. */
function Sower({ prefix }: { prefix: string }) {
  const skin = '#8a5a3c',
    dark = '#724830',
    vest = '#f4ecd9',
    vestShade = '#dccfb3',
    lungi = '#2f6b5a',
    grey = '#ece7dc';
  return (
    <g>
      <ellipse cx="5" cy="80" rx="30" ry="4.5" fill="#3e4431" opacity=".18" />
      {/* Legs in a walking stride */}
      <path d="M-3 28-10 56-14 76" fill="none" stroke={dark} strokeWidth="7" />
      <path d="M-20 80q0-5 5-5h6q6 1 8 5Z" fill={dark} />
      <path d="M3 28 13 54 17 76" fill="none" stroke={skin} strokeWidth="7.5" />
      <path d="M12 80q0-5 5-5h7q7 1 9 5Z" fill={skin} />
      <path d="M-9 13H9q7 21 13 44-18 7-40 1 5-24 9-45Z" fill={lungi} />
      <path
        d="M-13 31q15 4 29 0m-32 14q18 5 36-1M-2 14q-3 22-7 45M5 14q4 22 7 45"
        fill="none"
        stroke="#6fa391"
        strokeWidth="1.2"
        opacity=".75"
      />
      <path d="M-18 58q22 6 40-1" fill="none" stroke="#e9e4d0" strokeWidth="1.6" />
      {/* Far arm carries the seed basket in front of the waist */}
      <path d="M3-19 8-2 20 7" fill="none" stroke={dark} strokeWidth="6" />
      <g data-held-prop="seed-basket">
        <use href={`#${prefix}-basket`} x="8" y="-4" width="32" height="23" />
      </g>
      <path d="m35.5 6-5 1m5.5 2.5-5 1m4.5 2.5-4.5.8" stroke={dark} strokeWidth="2.4" />
      <path d="M-7-24q-4 16-2 38H9q2-14 0-26-1-8-4-12-6-3-12 0Z" fill={vest} />
      <path d="M-7-24q-4 16-2 38h5q-3-20 1-38Z" fill={vestShade} />
      <circle cx="8" cy="14.5" r="3" fill="#24554a" />
      <path d="M0-24 2-30" fill="none" stroke={skin} strokeWidth="7" />
      {/* Gamcha over the shoulder */}
      <path d="M-6-25q-5 15-4 31l6 1q-1-17 4-31Z" fill="#c2453a" />
      <path d="m-9.5-13 6 .7m-6.6 6.3 6 .6m-5.8 6.4 6 .6" stroke="#f3d9c8" strokeWidth="1.1" />
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="-1.5 3 -28;1.5 3 -28;-1.5 3 -28"
          dur="5s"
          repeatCount="indefinite"
        />
        <path d="M-7-42q0-10 11-9 9 1 9 9l2.5 5-2.5 1q0 6-7 7-10 1-13-7Z" fill={skin} />
        <ellipse cx="-1" cy="-39" rx="2.2" ry="3" fill={dark} />
        <path d="M-7-44q-2 8 2 11l2-5q-1-4 0-7Z" fill="#cfc9bc" />
        <path d="M-3-34q0 7 9 6.5 6-.5 7-6.5-4 3-8 2.5-5-.5-8-2.500Z" fill={grey} />
        <path d="M8-35.800q4-1.6 6.5.6-3 1-6.5.4Z" fill={grey} />
        <ellipse cx="8" cy="-41.5" rx="1.1" ry="1.5" fill="#2a211c" />
        <path d="M5.5-44.500q3-1.5 5.5 0" fill="none" stroke={grey} strokeWidth="1.2" />
        {/* Bamboo mathal */}
        <path d="M-21-48Q3-74 28-48 3-42-21-48Z" fill="#e6c67f" />
        <path d="M-21-48Q3-42 28-48 3-45.5-21-48Z" fill="#b99548" />
        <path
          d="M-9-56q12 4 25 0m-31 5q18 5 37 0M3.5-61v14m-9-11-4 10m22-10 4 10"
          fill="none"
          stroke="#c9a557"
          strokeWidth="1"
        />
      </g>
      {/* Near arm swings from the basket to the throw */}
      <g data-worker-arm="near">
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="36 -1 -19;-8 -1 -19;-8 -1 -19;36 -1 -19;36 -1 -19"
          keyTimes="0;.34;.44;.82;1"
          dur="2.6s"
          calcMode="spline"
          keySplines={`${EASE};${EASE};${EASE};${EASE}`}
          repeatCount="indefinite"
        />
        <path d="M-1-19 13-9 30-13" fill="none" stroke={skin} strokeWidth="6.5" />
        <path d="m30-16 6-1.500m-5 4.5 6.5.5m-7.5 2.5 5.5 2" stroke={skin} strokeWidth="2.2" />
        <circle cx="31" cy="-13.5" r="3.6" fill={skin} />
        <circle data-release-point="" cx="36" cy="-13" r="0" />
      </g>
      <circle cx="-1" cy="-19" r="4.2" fill={skin} />
      <SownSeeds prefix={prefix} />
    </g>
  );
}

/** A woman in a marigold sari with a red border, tipping a watering can with both hands. */
function Waterer() {
  const skin = '#a36a47',
    dark = '#8a563a',
    sari = '#dd9a2b',
    sariShade = '#bf7f1d',
    red = '#a8362e',
    hair = '#2b2320';
  return (
    <g>
      <ellipse cx="3" cy="80" rx="28" ry="4.5" fill="#3e4431" opacity=".18" />
      <path d="M-13 80q0-4 4-4h6q4 1 5 4Z" fill={dark} />
      <path d="M3 80q0-4 4-4h6q5 1 6 4Z" fill={skin} />
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="4 0 40;5.5 0 40;4 0 40"
          dur="4s"
          calcMode="spline"
          keySplines={`${EASE};${EASE}`}
          repeatCount="indefinite"
        />
        <path d="M-9 12H8q6 32 9 62-17 5-36 0 6-34 10-62Z" fill={sari} />
        <path
          d="M4 14q5 30 6 62M0 14q3 30 3 63m-7-63q0 30-1 63"
          fill="none"
          stroke={sariShade}
          strokeWidth="1.2"
        />
        <path d="M-19 74q19 5 36 0l-.5-4.500q-17 5-34.8 0Z" fill={red} />
        {/* Anchal tail down the back */}
        <path d="M-8-20q-6 12-7 28l6 1q0-17 5-30Z" fill={sariShade} />
        <path d="m-15 8 6 1" stroke={red} strokeWidth="2" />
        {/* Far arm steadies the can from below */}
        <path d="M4-16 12 1 25 9" fill="none" stroke={dark} strokeWidth="5.5" />
        <path d="M-8-4H7l1 16H-9Z" fill={skin} />
        <path d="M-7-21q-3 9-1 18H8q2-9-2-18-6-3-13 0Z" fill={red} />
        <path d="M8 12 9 4Q6-10-3-22l-5 2q6 14 6 32Z" fill={sari} />
        <path d="M9 4Q6-10-3-22" fill="none" stroke={red} strokeWidth="1.6" />
        <path d="M0-22 1.5-28" fill="none" stroke={skin} strokeWidth="6.5" />
        <g>
          <path
            d="M-7-39q0-9 10-9 9 1 9.5 8l2 4.5-2 1q-.5 5.5-6.5 7-9 .5-12.5-5.500Z"
            fill={skin}
          />
          <path
            d="M-7.5-37q-1.5-13 10.5-13.5 8 .5 9.5 7.5-6.5-3-11.5 1-3 3-4 9-3 0-4.5-4Z"
            fill={hair}
          />
          <circle cx="-9.5" cy="-37" r="5.5" fill={hair} />
          <ellipse cx=".5" cy="-36.5" rx="2" ry="2.6" fill={dark} />
          <circle cx=".5" cy="-33" r="1.3" fill="#e6bc58" />
          <ellipse cx="8" cy="-38.5" rx="1.1" ry="1.5" fill="#2a211c" />
          <path d="M5.5-41.500q3-1.4 5.2-.2" fill="none" stroke={hair} strokeWidth="1" />
          <circle cx="10.5" cy="-43" r=".9" fill={red} />
          <path d="M10.5-31.500h2.5" stroke="#8a3d33" strokeWidth="1" />
        </g>
        {/* Near arm and can tip together */}
        <g data-worker-arm="near">
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="-3 -1 -17;3 -1 -17;-3 -1 -17"
            dur="4s"
            calcMode="spline"
            keySplines={`${EASE};${EASE}`}
            repeatCount="indefinite"
          />
          <circle data-contact="watering-can" cx="34.5" cy="-9.7" r="0" />
          <circle data-grip="watering-can" cx="34.5" cy="-9.7" r="0" />
          <g data-held-prop="watering-can" transform="translate(30 6) rotate(18)">
            <path d="M-11-4Q-20 1-11 9" fill="none" stroke="#3f7480" strokeWidth="2.6" />
            <path d="M10 6 30-8l2 4-21 16Z" fill="#5f97a3" />
            <path d="m29-11 6 3-3 8-6-3Z" fill="#8fbcc4" />
            <path d="M-11-8h22l-2 20H-9Z" fill="#5f97a3" />
            <path d="M-10 0h20" stroke="#8fbcc4" strokeWidth="1.4" />
            <ellipse cy="-8" rx="11" ry="3" fill="#8fbcc4" />
            <path d="M-8-9Q0-21 8-9" fill="none" stroke="#3f7480" strokeWidth="2.6" />
          </g>
          <g data-water-outlet="" transform="translate(62 12)">
            <path
              d="M0 0q5 22 8 64M-1.5 1q3 22 4 64M1.5 0q8 22 13 62"
              fill="none"
              stroke="#8fc3cc"
              strokeWidth=".9"
              opacity=".55"
            />
            {Array.from({ length: 12 }, (_, i) => (
              <ellipse key={i} cx={i % 3} cy="0" rx=".8" ry="1.5" fill="#8fc3cc" opacity="0">
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values={`0 0;${3 + (i % 3)} 24;${6 + (i % 3) * 3} 64`}
                  keyTimes="0;.45;1"
                  dur=".9s"
                  begin={`${(i * 0.075).toFixed(3)}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0;.9;.75;0"
                  keyTimes="0;.1;.8;1"
                  dur=".9s"
                  begin={`${(i * 0.075).toFixed(3)}s`}
                  repeatCount="indefinite"
                />
              </ellipse>
            ))}
          </g>
          <path d="M-1-17 12-2 34-9.5" fill="none" stroke={skin} strokeWidth="6" />
          <path d="M-1-17 4.5-10.5" fill="none" stroke={red} strokeWidth="7.5" />
          <path d="m27-5.5 1.5-4m1.5 5 1.5-4" stroke="#e6bc58" strokeWidth="1.3" />
          <circle cx="34.5" cy="-9.7" r="3.5" fill={skin} />
        </g>
      </g>
    </g>
  );
}

/** A young man bent low with a sickle, head wrapped in a gamcha, lungi folded to the knee. */
function Reaper({ prefix }: { prefix: string }) {
  const skin = '#94603f',
    dark = '#7b4c31',
    shirt = '#3f7f93',
    shirtShade = '#2f6577',
    lungi = '#3b4a73',
    hair = '#2b2320';
  return (
    <g>
      <ellipse cx="8" cy="80" rx="38" ry="4.5" fill="#3e4431" opacity=".18" />
      <path d="M-13 26-22 52-22 76" fill="none" stroke={dark} strokeWidth="7.5" />
      <path d="M-27 80q0-5 5-5h6q6 1 8 5Z" fill={dark} />
      <path d="M-8 26 10 46 6 76" fill="none" stroke={skin} strokeWidth="8" />
      <path d="M1 80q0-5 5-5h7q7 1 9 5Z" fill={skin} />
      <path d="M-20 14q-7 20-7 38 19 8 42-2-5-16-13-34Z" fill={lungi} />
      <path
        d="M-25 34q18 6 34-2m-36 14q20 7 40-2"
        fill="none"
        stroke="#8a95bd"
        strokeWidth="1.3"
        opacity=".8"
      />
      <path d="M-6 16q6 16 8 36" fill="none" stroke="#2c3858" strokeWidth="1.4" />
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 -10 24;3.5 -10 24;3.5 -10 24;0 -10 24"
          keyTimes="0;.3;.55;1"
          dur="1.8s"
          calcMode="spline"
          keySplines={`${EASE};${EASE};${EASE}`}
          repeatCount="indefinite"
        />
        {/* Far arm grips a handful of standing stalks */}
        <path d="M21 18 32 33 39 47" fill="none" stroke={dark} strokeWidth="6" />
        <g data-held-prop="grain">
          <circle data-contact="grain" cx="39.5" cy="48" r="0" />
          <circle data-stalk-base="" cx="39" cy="65" r="0" />
          {Array.from({ length: 5 }, (_, i) => (
            <g key={i} transform={`rotate(${(i - 2) * 5} 41 80)`}>
              <use href={`#${prefix}-wheat`} x={23 + i * 3} y="14" width="24" height="75" />
            </g>
          ))}
        </g>
        <circle data-grip="grain" cx="39.5" cy="48" r="0" />
        <ellipse cx="39.5" cy="48" rx="5.2" ry="3.6" transform="rotate(-12 39.5 48)" fill={dark} />
        <path d="M-10 22Q4 11 20 17" fill="none" stroke={shirt} strokeWidth="21" />
        <path d="M-12 30Q2 22 20 26" fill="none" stroke={shirtShade} strokeWidth="4" />
        <path d="M25 15 30 12" fill="none" stroke={skin} strokeWidth="7" />
        <g transform="translate(32 50) rotate(35 3 -40)">
          <path d="M-7-42q0-10 11-9 9 1 9 9l2.5 5-2.5 1q0 6-7 7-10 1-13-7Z" fill={skin} />
          <ellipse cx="-1" cy="-39" rx="2.2" ry="3" fill={dark} />
          <path d="M-7-43q-2 7 1 10l2-4q-1-3 0-6Z" fill={hair} />
          <path d="M8.5-35.200q3-1.3 5 .4-2.5 1.2-5 .8Z" fill={hair} />
          <ellipse cx="8" cy="-41" rx="1.1" ry="1.5" fill="#2a211c" />
          <path d="M5.5-44q3-1.5 5.5 0" fill="none" stroke={hair} strokeWidth="1.2" />
          {/* Gamcha tied round the head */}
          <path d="M-8-41q-1-12 12-11.5 9 .5 9.5 9-11-3-21.5 2.500Z" fill="#c2453a" />
          <path d="M-8-43q-6 0-8 6l4 1q1-4 5-4Z" fill="#a8362e" />
          <path
            d="M-5-47q9-4 17-2m-14-2 2 6m5-8 1 6"
            fill="none"
            stroke="#f3d9c8"
            strokeWidth="1"
          />
        </g>
        {/* Near arm pulls the sickle through the stalks */}
        <g data-worker-arm="near">
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="-7 18 19;9 18 19;9 18 19;-7 18 19"
            keyTimes="0;.3;.55;1"
            dur="1.8s"
            calcMode="spline"
            keySplines={`${EASE};${EASE};${EASE}`}
            repeatCount="indefinite"
          />
          <g data-held-prop="sickle">
            <circle data-contact="sickle" cx="27.5" cy="60.5" r="0" />
            <circle data-cutting-edge="" cx="45" cy="61" r="0" />
            <path d="M33 63.500q14 10 22-9-8 11-20 4.500Z" fill="#dfe5dc" />
            <path d="M33 63.500q14 10 22-9" fill="none" stroke="#8fa39a" strokeWidth=".9" />
            <path d="m24.5 60 9.5 4" stroke="#7a5536" strokeWidth="3.6" />
          </g>
          <path d="M18 19 14 40 27 60" fill="none" stroke={skin} strokeWidth="6.5" />
          <path d="M18 19 16 29" fill="none" stroke={shirtShade} strokeWidth="9" />
          <circle cx="27.5" cy="60.5" r="3.8" fill={skin} />
          <circle data-grip="sickle" cx="27.5" cy="60.5" r="0" />
        </g>
      </g>
    </g>
  );
}

/** Seeds leave the open hand at the top of the throw and fall on their own. */
function SownSeeds({ prefix }: { prefix: string }) {
  return (
    <g data-seed-release="" transform="translate(36.5 -18.2)">
      <circle data-seed-origin="" cx="0" cy="0" r="0" />
      {Array.from({ length: 6 }, (_, i) => {
        const release = 0.34 + i * 0.012,
          times = `0;${release};${release + 0.18};${release + 0.42};1`;
        return (
          <use key={i} href={`#${prefix}-seed`} x="0" y="0" width="4" height="3" opacity="0">
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`0 0;0 0;${17 + i * 2} ${10 + i};${30 + i * 3} ${86 + i * 2};${30 + i * 3} ${86 + i * 2}`}
              keyTimes={times}
              begin="0s"
              dur="2.6s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;0;1;0;0"
              keyTimes={times}
              begin="0s"
              dur="2.6s"
              repeatCount="indefinite"
            />
          </use>
        );
      })}
    </g>
  );
}
