const socials = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/messtix/',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/messtix',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 21v-7h2.5l.5-3H14V9a1.5 1.5 0 0 1 1.5-1.5H17V4.5a20 20 0 0 0-2.2-.1A3.8 3.8 0 0 0 10.8 8.4V11H8v3h2.8v7" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/messtix',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <line x1="7.5" y1="10" x2="7.5" y2="17" />
        <circle cx="7.5" cy="7" r="0.3" fill="currentColor" />
        <line x1="12" y1="17" x2="12" y2="12.5" />
        <path d="M12 13.5c0-1.5 1.2-2 2-2s2 .5 2 2V17" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    href: 'https://www.youtube.com/@MESSTIX/',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="6" width="18" height="12" rx="3" />
        <path d="M11 10l4 2-4 2z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export default function SocialLinks({ className = 'social-links' }) {
  return (
    <ul className={className}>
      {socials.map((s) => (
        <li key={s.name}>
          <a href={s.href} target="_blank" rel="noreferrer" aria-label={s.name}>
            {s.icon}
          </a>
        </li>
      ))}
    </ul>
  );
}
