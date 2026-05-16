interface LogoProps {
  size?: number;
  className?: string;
  title?: string;
}

export function Logo({ size = 36, className, title = "Peristil" }: LogoProps) {
  const gradId = "peristil-bg-grad";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0e7490" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7" fill={`url(#${gradId})`} />
      <g
        stroke="#fb923c"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      >
        <path d="M10 27 C 10.5 22 11 17 12 13" />
        <path d="M12 13 Q 7.5 11.5 4 13" />
        <path d="M12 13 Q 7 9 5 7" />
        <path d="M12 13 Q 10.5 7.5 10 4.5" />
        <path d="M12 13 Q 14.5 8 17 6.5" />
        <path d="M12 13 Q 16 12 18 13.5" />
      </g>
      <polygon points="17,10 24,10 20.5,5" fill="#ffffff" />
      <rect x="17" y="10" width="7" height="16" fill="#ffffff" />
      <line x1="17" y1="14.5" x2="24" y2="14.5" stroke="#0e7490" strokeWidth="0.7" strokeLinecap="round" />
      <line x1="17" y1="19" x2="24" y2="19" stroke="#0e7490" strokeWidth="0.7" strokeLinecap="round" />
      <line x1="17" y1="23.5" x2="24" y2="23.5" stroke="#0e7490" strokeWidth="0.7" strokeLinecap="round" />
    </svg>
  );
}
