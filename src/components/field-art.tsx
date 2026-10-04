export function FieldArt({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 640 350"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="320" y1="0" x2="320" y2="350" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e5eddf" />
          <stop offset="1" stopColor="#f1ecd2" />
        </linearGradient>
        <linearGradient
          id="front"
          x1="310"
          y1="175"
          x2="400"
          y2="350"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#8fa573" />
          <stop offset="1" stopColor="#415c38" />
        </linearGradient>
        <pattern
          id="riceRows"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-16)"
        >
          <path d="M0 0V20" stroke="#b6c48c" strokeWidth="3" opacity=".65" />
        </pattern>
        <pattern
          id="goldRows"
          width="15"
          height="15"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(23)"
        >
          <path d="M0 0V15" stroke="#ecdf9e" strokeWidth="2" opacity=".8" />
        </pattern>
      </defs>
      <rect width="640" height="350" fill="url(#sky)" />
      <circle cx="470" cy="64" r="35" fill="#e1b759" opacity=".82" />
      <path d="M0 127C105 85 185 133 291 111S476 77 640 127V213H0Z" fill="#becbad" />
      <path d="M0 156C90 111 204 180 340 137S514 139 640 152V250H0Z" fill="#9fb58c" />
      <g fill="#536e48">
        <path d="M73 144V113h5v31Z" />
        <ellipse cx="75" cy="106" rx="19" ry="23" />
        <path d="M570 159V122h5v37Z" />
        <ellipse cx="572" cy="118" rx="21" ry="26" />
        <ellipse cx="549" cy="125" rx="14" ry="18" />
      </g>
      <path d="M0 187L256 146L415 178L146 240Z" fill="#c7bb70" />
      <path d="M0 187L256 146L415 178L146 240Z" fill="url(#goldRows)" />
      <path d="M423 183L640 155V223L529 252L284 226Z" fill="#748b57" />
      <path d="M423 183L640 155V223L529 252L284 226Z" fill="url(#riceRows)" />
      <path d="M0 198L139 249L437 187L463 193L153 262L0 213Z" fill="#eee2b9" />
      <path d="M0 236L147 276L353 230L640 280V350H0Z" fill="url(#front)" />
      <path d="M0 236L147 276L353 230L640 280V350H0Z" fill="url(#riceRows)" />
      <path d="M0 339L347 256L640 308V323L345 271L30 350H0Z" fill="#d4ce9a" />
      <path
        d="M463 193C484 208 492 219 531 222L640 241V257L524 238C483 235 471 212 450 202Z"
        fill="#adc4ba"
      />
      <path d="M248 125L279 106L311 125V153H248Z" fill="#ede2bd" />
      <path d="M243 126L279 101L316 126Z" fill="#886b4e" />
      <path d="M273 134H283V153H273Z" fill="#715e45" />
      <g stroke="#4f6243" strokeWidth="2" strokeLinecap="round">
        <path d="M349 52q9-8 18 0q9-8 18 0M383 78q6-6 12 0q6-6 12 0" />
      </g>
      <g transform="translate(178 230)">
        <circle cx="0" cy="0" r="4" fill="#6e5137" />
        <path d="M-7 9L0 4L7 9L4 21H-4Z" fill="#e6bf70" />
        <path d="M-2 21L-5 30M2 21L5 29" stroke="#4b5242" strokeWidth="3" strokeLinecap="round" />
        <path d="M-8 9L-12 19M6 10L12 18" stroke="#6e5137" strokeWidth="2" />
        <path d="M-8 0Q0-12 8 0Z" fill="#bc975c" />
      </g>
      <g fill="#344f33" opacity=".75">
        <path d="M35 350q-5-45-22-53q18 1 27 38q-2-56 15-64q-8 26-9 79Z" />
        <path d="M589 350q-3-52-21-67q21 2 29 42q0-51 20-66q-12 35-13 91Z" />
      </g>
    </svg>
  );
}
