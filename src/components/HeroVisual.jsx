import { useState } from 'react';

const chips = [
  {
    key: 'automation',
    label: 'Automatización',
    icon: 'M13 2 3 14h7l-1 8 10-12h-7l1-8Z',
    caption: 'Flujos automatizados',
  },
  {
    key: 'ai',
    label: 'Inteligencia Artificial',
    icon: 'M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z',
    caption: 'Asistentes inteligentes',
  },
  {
    key: 'web',
    label: 'Desarrollo Web',
    icon: 'M8 9l-4 3 4 3M16 9l4 3-4 3M13.5 6l-3 12',
    caption: 'Sitios rápidos y a medida',
  },
  {
    key: 'support',
    label: 'Soporte',
    icon: 'M12 3a7 7 0 0 0-7 7v3a3 3 0 0 0 3 3h1v-6H6v-0a6 6 0 0 1 12 0v0h-3v6h1a3 3 0 0 0 3-3v-3a7 7 0 0 0-7-7ZM9 16v2a3 3 0 0 0 3 3h1',
    caption: 'Acompañamiento continuo',
  },
];

const illustrations = {
  automation: (
    <svg viewBox="0 0 120 120" fill="none">
      <circle cx="26" cy="30" r="9" stroke="currentColor" strokeWidth="2" />
      <circle cx="94" cy="30" r="9" stroke="currentColor" strokeWidth="2" />
      <circle cx="60" cy="88" r="11" fill="currentColor" opacity=".18" stroke="currentColor" strokeWidth="2" />
      <path d="M33 34 53 80M87 34 67 80" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 6" />
      <path d="M52 88h-8M76 88h-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M60 22v-8M56 18l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 120 120" fill="none">
      <rect x="40" y="40" width="40" height="40" rx="8" stroke="currentColor" strokeWidth="2" />
      <circle cx="52" cy="54" r="3.5" fill="currentColor" />
      <circle cx="68" cy="54" r="3.5" fill="currentColor" />
      <path d="M50 68h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M60 40v-14M60 94v-14M40 60H26M94 60H80M46 46 36 36M74 46l10-10M46 74 36 84M74 74l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="26" cy="60" r="3" fill="currentColor" />
      <circle cx="94" cy="60" r="3" fill="currentColor" />
      <circle cx="60" cy="26" r="3" fill="currentColor" />
      <circle cx="60" cy="94" r="3" fill="currentColor" />
    </svg>
  ),
  web: (
    <svg viewBox="0 0 120 120" fill="none">
      <rect x="20" y="26" width="80" height="60" rx="8" stroke="currentColor" strokeWidth="2" />
      <path d="M20 42h80" stroke="currentColor" strokeWidth="2" />
      <circle cx="30" cy="34" r="2.2" fill="currentColor" />
      <circle cx="38" cy="34" r="2.2" fill="currentColor" />
      <circle cx="46" cy="34" r="2.2" fill="currentColor" />
      <path d="M40 62 30 70l10 8M64 62l10 8-10 8M56 58l-6 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  support: (
    <svg viewBox="0 0 120 120" fill="none">
      <path d="M32 62v-8a28 28 0 0 1 56 0v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="24" y="62" width="16" height="22" rx="6" stroke="currentColor" strokeWidth="2" />
      <rect x="80" y="62" width="16" height="22" rx="6" stroke="currentColor" strokeWidth="2" />
      <path d="M88 84v4a10 10 0 0 1-10 10H64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="58" cy="98" r="4" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
};

export default function HeroVisual() {
  const [active, setActive] = useState('automation');
  const current = chips.find((c) => c.key === active) ?? chips[0];

  return (
    <div className="hero-visual">
      <span className="blob blob-1"></span>
      <span className="blob blob-2"></span>

      {chips.map((chip, i) => (
        <button
          type="button"
          key={chip.key}
          className={`mock-chip mock-chip-${i + 1}${active === chip.key ? ' is-active' : ''}`}
          onMouseEnter={() => setActive(chip.key)}
          onFocus={() => setActive(chip.key)}
          onClick={() => setActive(chip.key)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d={chip.icon} strokeLinecap="round" strokeLinejoin="round" /></svg>
          {chip.label}
        </button>
      ))}

      <div className="mock-window">
        <div className="mock-window-bar">
          <span></span><span></span><span></span>
        </div>
        <div className="mock-window-body mock-window-illustration" key={current.key}>
          <div className="mock-illustration">{illustrations[current.key]}</div>
          <p className="mock-illustration-caption">{current.caption}</p>
        </div>
      </div>
    </div>
  );
}
