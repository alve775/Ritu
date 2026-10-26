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
                    <use href={`#${p('seed')}`} x="30" y="0" width="4" height="3">
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
                <Farmer kind="water" prefix={id} />
                <g transform="translate(40 26)">
                  <path d="M-10-5h24l-3 22H-8Z" fill="#65959a" />
                  <ellipse cx="2" cy="-5" rx="12" ry="4" fill="#9bbec0" />
                  <path
                    d="M-9 1q-22-9-19 6 1 13 17 7M12 9l23 8 3-5-24-12"
                    fill="none"
                    stroke="#517f87"
                    strokeWidth="5"
                  />
                  <path d="m32 9 8 2-3 12-8-3Z" fill="#94b7b5" />
                </g>
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
                <path d="m23 32 19 13q16-13 4-25" fill="none" stroke="#6b7769" strokeWidth="2.5" />
                <path d="m22 30 6 5" stroke="#a77847" strokeWidth="5" strokeLinecap="round" />
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

function Farmer({ kind, prefix }: { kind: 'sow' | 'water' | 'harvest'; prefix: string }) {
  const harvest = kind === 'harvest',
    shirt = '#bd7b51';
  return (
    <g data-farm-worker={kind}>
      <ellipse cx="0" cy="78" rx="28" ry="6" fill="#4c4e37" opacity=".17" />
      <path
        d="M-15 43-16 72l-8 5m32-34 7 28 9 6"
        stroke="#8e654c"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      <path d="m-24 78 13-1m27 1 13 1" stroke="#514f42" strokeWidth="5" strokeLinecap="round" />
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values={harvest ? '9 0 40;17 0 40;9 0 40' : '-1 0 40;1.5 0 40;-1 0 40'}
          dur={harvest ? '4s' : '5s'}
          repeatCount="indefinite"
        />
        <path d="M-18 20h35l7 30q-24 10-47 0Z" fill={harvest ? '#596f68' : '#63888a'} />
        <path d="M-18 20h35l7 30q-24 10-47 0Z" fill={`url(#${prefix}-cloth)`} />
        <path d="M-19 22q-3-24 2-34l16-9 18 9q6 13 4 34-19 8-40 0" fill={shirt} />
        <path
          d="M-2-18 2-9l7-7m-7 7v29"
          stroke={harvest ? '#5c7677' : '#a99979'}
          strokeWidth="1.5"
          fill="none"
        />
        <circle cx="4" cy="2" r="1" fill="#eee5c5" />
        <circle cx="4" cy="11" r="1" fill="#eee5c5" />
        <path d="M-4-23v8h11v-10" fill="#ac7c57" />
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="-2 1 -27;2 1 -27;-2 1 -27"
            dur="5s"
            repeatCount="indefinite"
          />
          <path d="M-11-42q16-10 25 1l-1 18q-9 11-21-1Z" fill="#bb8a61" />
          <path d="m11-35 5 5-5 2" fill="#bb8a61" />
          <path d="m5-22 6-1" stroke="#7b5b42" strokeWidth="1" />
          <circle cx="9" cy="-34" r="1.1" fill="#564c3b" />
          <path d="M-12-36q-3-14 14-15 13 0 14 11l-8-3-9 1-5 8" fill="#4b5040" />
          <use href={`#${prefix}-hat`} x="-35" y="-65" width="70" height="33" />
        </g>
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={
              kind === 'sow'
                ? '0 16 -5;-30 16 -5;0 16 -5'
                : harvest
                  ? '0 16 -5;13 16 -5;0 16 -5'
                  : '-5 16 -5;2 16 -5;-5 16 -5'
            }
            dur={kind === 'sow' ? '2.6s' : '4s'}
            repeatCount="indefinite"
          />
          <path
            d="m17-6 11 17 10 4"
            fill="none"
            stroke="#b9855c"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path d="m16-7 8 14" stroke={shirt} strokeWidth="12" strokeLinecap="round" />
          <path d="m34 14 8 2" stroke="#b9855c" strokeWidth="6" strokeLinecap="round" />
        </g>
        <path
          d={kind === 'sow' ? 'M-18-5-25 13-23 27' : 'M-17-5-22 13-6 23'}
          fill="none"
          stroke="#b9855c"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path d="m-17-7-5 12" stroke={shirt} strokeWidth="12" strokeLinecap="round" />
      </g>
    </g>
  );
}
