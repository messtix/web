export default function Logo({ variant = 'dark' }) {
  const rect = variant === 'light' ? '#ffffff' : '#141212';
  const accent = variant === 'light' ? '#c94a5f' : '#7a1128';
  const text = variant === 'light' ? '#ffffff' : '#141212';

  return (
    <svg
      viewBox="0 0 500 150"
      xmlns="http://www.w3.org/2000/svg"
      className="brand-logo"
      role="img"
      aria-label="Messtix, by María Sánchez"
    >
      <g transform="translate(0,42)">
        <rect x="0" y="20" width="14" height="46" rx="7" fill={rect} />
        <rect x="27" y="0" width="14" height="66" rx="7" fill={accent} />
        <rect x="54" y="20" width="14" height="46" rx="7" fill={rect} />
      </g>
      <text
        x="102"
        y="95"
        fontFamily="'Poppins','Century Gothic','Arial Rounded MT Bold',sans-serif"
        fontWeight="800"
        fontSize="54"
        letterSpacing="-0.5"
        fill={text}
      >
        mess<tspan fill={accent}>tix</tspan>
      </text>
    </svg>
  );
}
