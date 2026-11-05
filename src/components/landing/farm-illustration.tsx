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
              <g transform="translate(358 576) scale(2.05)">
                <Farmer kind="sow" prefix={id} />
                <g transform="translate(-27 31)">
                  <use href={`#${p('basket')}`} x="-24" y="-17" width="48" height="35" />
                </g>
                {Array.from({ length: 6 }, (_, i) => (
                  <g key={i}>
                    <use href={`#${p('seed')}`} x="43" y="14" width="4" height="3">
                      <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0 0;38 21;60 59"
                        keyTimes="0;.4;1"
                        dur="2.6s"
                        begin={`${-i * 0.43}s`}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0;1;1;0"
                        keyTimes="0;.1;.8;1"
                        dur="2.6s"
                        begin={`${-i * 0.43}s`}
                        repeatCount="indefinite"
                      />
                    </use>
                  </g>
                ))}
              </g>
              <g transform="translate(253 730)">
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
              <g transform="translate(426 576) scale(2.05)">
                <g
                  transform="translate(40 26)"
                  stroke="#426b70"
                  strokeWidth=".8"
                  strokeLinejoin="round"
                >
                  <path d="M-6-3q-9-22 7-22 16 0 14 21" fill="none" strokeWidth="3" />
                  <path d="M-10-5h24l-3 22H-8Z" fill="#65959a" />
                  <ellipse cx="2" cy="-5" rx="12" ry="4" fill="#9bbec0" />
                  <path d="M12 9l23 8 3-5-24-12" fill="none" stroke="#517f87" strokeWidth="5" />
                  <path d="m32 9 8 2-3 12-8-3Z" fill="#94b7b5" />
                </g>
                <Farmer kind="water" prefix={id} />
                {Array.from({ length: 11 }, (_, i) => (
                  <ellipse key={i} cx={77 + (i % 3) * 4} cy="42" rx="1.4" ry="2.8" fill="#b4d9dc">
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      values="0 0;17 31"
                      dur="1.1s"
                      begin={`${-i * 0.1}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;.9;0"
                      dur="1.1s"
                      begin={`${-i * 0.1}s`}
                      repeatCount="indefinite"
                    />
                  </ellipse>
                ))}
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
                          begin="14s"
                          dur="7s"
                          fill="freeze"
                          calcMode="spline"
                          keyTimes="0;1"
                          keySplines=".3 0 .3 1"
                        />
                        <use
                          href={`#${p('wheat')}`}
                          x="-18"
                          y={-76 - row * 2}
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
                            begin="18s"
                            dur="4.5s"
                            fill="freeze"
                          />
                          <use
                            href={`#${p('wheat')}`}
                            x="-18"
                            y={-76 - row * 2}
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
              <g transform="translate(438 576) scale(2.05)">
                <Farmer kind="harvest" prefix={id} />
                <g transform="translate(39 37) rotate(28)">
                  {Array.from({ length: 7 }, (_, i) => (
                    <use
                      key={i}
                      href={`#${p('wheat')}`}
                      x={-19 + i * 3}
                      y="-51"
                      width="21"
                      height="65"
                    />
                  ))}
                  <path d="m-12-1 27-1" stroke="#ac7e43" strokeWidth="4" />
                </g>
              </g>
              <g transform="translate(300 705) rotate(-18)">
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
              <g transform="translate(219 739)">
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

/** Original adult characters with articulated silhouettes and cel-style shading. */
function Farmer({ kind, prefix }: { kind: 'sow' | 'water' | 'harvest'; prefix: string }) {
  const harvest = kind === 'harvest',
    watering = kind === 'water',
    shirt = harvest ? '#7199a5' : '#d9a365',
    shade = harvest ? '#4e7584' : '#b87b45',
    outline = '#533c32',
    skin = '#bc825c',
    light = '#d49b70';
  return (
    <g data-farm-worker={kind} strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx="1" cy="80" rx="32" ry="5" fill="#3e4431" opacity=".18" />
      {/* Planted foot and bent knee give the figure weight. */}
      <path
        d="M-17 42-18 59-22 73q1 5 7 3l7-23 3-11M5 43l6 19 7 13q6 3 6-2l-6-23-2-9"
        fill={skin}
        stroke={outline}
        strokeWidth=".9"
      />
      <path d="m-17 51-1 16m32-14 5 16" fill="none" stroke="#9c6549" strokeWidth="1.6" />
      <path
        d="M-23 73q7-2 10 0l-1 5-15 1q-3-3 6-6M17 73q5-2 8 1l8 3q2 4-4 3l-12-2Z"
        fill="#78634e"
        stroke={outline}
        strokeWidth=".9"
      />
      <path
        d="m-23 74 7 2m3-3-3 4m35-3 5 3m-5-3-2 3"
        fill="none"
        stroke="#dbbc89"
        strokeWidth="1.2"
      />
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values={harvest ? '7 0 40;13 0 40;7 0 40' : '-.7 0 40;1 0 40;-.7 0 40'}
          dur={harvest ? '4s' : '5s'}
          repeatCount="indefinite"
        />
        {/* Far arm, forearm and thumb sit behind the torso. */}
        <path
          d={
            kind === 'sow'
              ? 'M-17-7q-8 7-10 21l1 12 5 4 4-3-3-4 2-10 9-14Z'
              : harvest
                ? 'M-17-7q-9 5-11 18l-7 9-4 1-2 4 6 3 6-3 11-13 7-13Z'
                : 'M-17-7q-9 8-10 20 5 9 18 12l6-2-3-4-12-8 9-12Z'
          }
          fill={skin}
          stroke={outline}
          strokeWidth=".9"
        />
        {harvest && (
          <g>
            <path
              d="M-29 32C-37 47-53 43-54 26-47 39-39 34-34 29Z"
              fill="#c1c9bd"
              stroke="#52685b"
              strokeWidth=".8"
            />
            <path d="m-38 24 9 8" stroke={outline} strokeWidth="4.6" />
            <path d="m-38 24 9 8" stroke="#a77d4e" strokeWidth="3" />
            <path d="m-38 23 3 2-1 2-3-1" fill={light} stroke={outline} strokeWidth=".6" />
          </g>
        )}
        {watering ? (
          <g>
            <path
              d="M-18 15 15 15l12 52q-24 9-51-1Z"
              fill="#a35048"
              stroke={outline}
              strokeWidth="1"
            />
            <path
              d="M-17 17q4 27-3 49m12-48 1 49m10-49 8 49m1-48 13 44"
              fill="none"
              stroke="#743c3a"
              strokeWidth="1.3"
            />
            <path d="m-23 63 49 1 1 4q-23 9-51-1Z" fill="#e1bc7f" />
            <path d="m-21 65 45 1" stroke="#754c38" strokeWidth=".7" />
          </g>
        ) : (
          <g>
            <path d="M-18 19h34l8 31q-21 8-47 0Z" fill="#668788" stroke={outline} strokeWidth="1" />
            <path d="M-18 19h34l8 31q-21 8-47 0Z" fill={`url(#${prefix}-cloth)`} />
            <path
              d="m-16 22-2 25m11-23-2 27m9-28 4 28m8-27 8 24"
              stroke="#355960"
              strokeWidth="1"
              opacity=".7"
              fill="none"
            />
            <path d="M-21 49q23 7 44 0" fill="none" stroke="#d8d7b7" strokeWidth="1.7" />
            <path d="m-13 23 15 3 12-5-3 9-9-1" fill="#46686c" stroke="#34565b" strokeWidth=".8" />
          </g>
        )}
        <path d="M-7-25v12q7 7 15-1L7-29Z" fill={light} stroke={outline} strokeWidth=".8" />
        <path d="m-6-24 13-2v7q-7 4-13-1" fill="#a56b4e" />
        <path
          d="M-8-17q-12 1-16 10l-4 11 12 5 1 15q17 5 34-1l-1-17 9-4-7-11-11-7-5 5Z"
          fill={watering ? '#c47a59' : shirt}
          stroke={outline}
          strokeWidth="1"
        />
        <path
          d="m-23-5 9 5-1 21-5-1-1-12-7-3m39-14 6 9 2 19-5 1 1-16-6-7"
          fill={watering ? '#a95b45' : shade}
        />
        {watering ? (
          <g>
            {/* Sari border follows the drape across the shoulder and waist. */}
            <path
              d="m-9-18 12 1 17 38-13 7-23-10 8-1 12 3Z"
              fill="#b45d50"
              stroke="#77453b"
              strokeWidth=".8"
            />
            <path d="m-8-18 4 1 15 37 8 1-3 3-10-2Z" fill="#e9c98a" />
            <path d="m-4-9 7 18m-13 8 13 5" stroke="#863f3a" strokeWidth=".9" fill="none" />
          </g>
        ) : (
          <g>
            <path
              d="m-8-18 8 8 6-7 4 6-6 5-4-4-6 6-6-7Z"
              fill="#f0cf97"
              stroke={shade}
              strokeWidth=".8"
            />
            <path
              d="M1-8v30m-17-16 3 4m25-1-3 7m-19 1-6 3"
              fill="none"
              stroke={shade}
              strokeWidth="1"
            />
            <path d="M7-4h9v9q-5 3-9-1Z" fill={shade} stroke={outline} strokeWidth=".5" />
            <path d="m7-3 9 1" stroke="#d9d8bc" strokeWidth=".8" />
            {[0, 8, 16].map((y) => (
              <circle
                key={y}
                cx="2.5"
                cy={y}
                r=".9"
                fill="#f8e7bf"
                stroke={shade}
                strokeWidth=".4"
              />
            ))}
            <path d="M-14 21q15 3 29 0" fill="none" stroke={shade} strokeWidth="1" />
            <path d="m-14-14 6-3-3 34-6-1Z" fill="#eee0bd" stroke="#907b5d" strokeWidth=".6" />
            <path d="m-14-5 5 1m-6 6 5 1m-6 6 5 1m-6 6 5 1" stroke="#9e614e" strokeWidth="1.2" />
          </g>
        )}
        {/* Brow, eyelids, nose bridge, cheek and jaw remain legible at hero size. */}
        <g transform="translate(1 -4) scale(.8)">
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-1 0 -29;1 0 -29;-1 0 -29"
              dur="5s"
              repeatCount="indefinite"
            />
            {watering && (
              <ellipse
                cx="-12"
                cy="-43"
                rx="9"
                ry="9"
                fill="#30332c"
                stroke={outline}
                strokeWidth="1"
              />
            )}
            <path
              d="M-10-48q3-12 15-9 11 3 10 17l3 8-5 2q-2 10-11 11-9-2-12-13Z"
              fill={light}
              stroke={outline}
              strokeWidth="1"
            />
            <path d="M-10-46q-3 11 1 19 4 7 11 8-10 1-14-7l-3-12Z" fill={skin} />
            <path d="M-10-36q-8-5-7 3 1 6 7 5" fill={light} stroke={outline} strokeWidth=".8" />
            <path d="m-12-31-2-3 3 1" fill="none" stroke="#9e6347" strokeWidth=".8" />
            <path
              d="M-13-37q-7-19 5-23 14-6 22 6l2 10-6-9q-6 4-12 1l-4 8Z"
              fill="#33362d"
              stroke={outline}
              strokeWidth=".8"
            />
            <path d="M-8-55q11-5 17 1" fill="none" stroke="#62604a" strokeWidth="1" />
            <path d="m2-43 8-1M1-39q4 2 9-1" stroke="#4a372c" strokeWidth="1" fill="none" />
            <g>
              <animate
                attributeName="opacity"
                values="1;1;0;1;1"
                keyTimes="0;.45;.47;.49;1"
                dur="4.8s"
                repeatCount="indefinite"
              />
              <path d="M1-39q4-4 9-1-4 4-9 1Z" fill="#fff7df" stroke={outline} strokeWidth=".65" />
              <ellipse cx="7" cy="-39.5" rx="1.6" ry="1.9" fill="#342e26" />
              <circle cx="7.5" cy="-40" r=".5" fill="#fff" stroke="none" />
            </g>
            <path d="m11-40 1 7 3 1-3 2" fill="none" stroke="#935e44" strokeWidth=".8" />
            <path d="m6-26 6-1m-4 3 3-.3" stroke="#774936" strokeWidth=".8" fill="none" />
            <path d="m-2-31 3-1" stroke="#dfa67b" strokeWidth="2" />
            {watering ? (
              <g>
                <circle
                  cx="-11"
                  cy="-26"
                  r="1.6"
                  fill="#e6bc58"
                  stroke="#8a6638"
                  strokeWidth=".6"
                />
                <circle cx="11" cy="-47" r=".9" fill="#a64e3e" />
                <path d="M-10-54q6 1 10-4" stroke="#79704b" strokeWidth=".7" fill="none" />
              </g>
            ) : (
              <path d="M6-29q3-3 5-1l3 1-1 1-4-1-3 1Z" fill="#4d3c2d" stroke="none" />
            )}
            {!watering &&
              (harvest ? (
                <g>
                  <path
                    d="M-15-50q0-12 14-12 16 0 18 13l-13 1-13-1-5 8Z"
                    fill="#e7d8ad"
                    stroke={outline}
                    strokeWidth=".8"
                  />
                  <path
                    d="m-13-53 27-2m-27 6 28-1m-27-6 3 9m6-11 3 9m6-8 3 8"
                    stroke="#a9684e"
                    strokeWidth="1.2"
                  />
                  <path
                    d="m-14-48-6 17 5 2 4-17"
                    fill="#e7d8ad"
                    stroke={outline}
                    strokeWidth=".7"
                  />
                </g>
              ) : (
                <use href={`#${prefix}-hat`} x="-34" y="-76" width="68" height="32" />
              ))}
          </g>
        </g>
        {/* Separate sleeve, elbow, palm and fingers make the action readable. */}
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={
              kind === 'sow'
                ? '0 16 -5;-24 16 -5;0 16 -5'
                : harvest
                  ? '0 16 -5;8 16 -5;0 16 -5'
                  : '-2 16 -5;2 16 -5;-2 16 -5'
            }
            dur={kind === 'sow' ? '2.6s' : '4s'}
            repeatCount="indefinite"
          />
          <path
            d={
              harvest
                ? 'M17-6q6 0 10 10l5 14 6 7-5 4-11-13-9-15Z'
                : 'M17-6q6 0 11 11l4 5 8 3-2 7-12-3-12-16Z'
            }
            fill={light}
            stroke={outline}
            strokeWidth=".9"
          />
          <path d="m18 3 8 10 7 3" stroke="#b67a56" strokeWidth="1" fill="none" />
          <path
            d="M17-10q8 2 11 15l-10 5-7-13Z"
            fill={watering ? '#c47a59' : shirt}
            stroke={outline}
            strokeWidth=".9"
          />
          <path d="m18 7 9-4" stroke={watering ? '#8e4f3e' : shade} strokeWidth="1.8" />
          <g transform={harvest ? 'translate(34 26) rotate(30)' : 'translate(37 16)'}>
            <path
              d={
                watering
                  ? 'M-3-3q1-4 5-4l6 1 1 5-2 4-4-1V-1L0 1l-3-1Z'
                  : 'M-2-3 3-5q3-2 4 0l-2 3 7 1q2 1 0 2l-6 1 5 1q2 2-1 2H3l-5-2Z'
              }
              fill={light}
              stroke={outline}
              strokeWidth=".7"
            />
            <path
              d={watering ? 'm3-4 4 1m-4 1 4 1' : 'm4 0 6 1m-6 1 5 1'}
              stroke="#a86c4e"
              strokeWidth=".6"
            />
            {watering && <path d="m-2-3 1 6" stroke="#e6bd64" strokeWidth="1.6" />}
          </g>
        </g>
      </g>
    </g>
  );
}
