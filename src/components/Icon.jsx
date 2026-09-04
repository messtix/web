const paths = {
  code: 'M8 9l-4 3 4 3M16 9l4 3-4 3M13.5 6l-3 12',
  automation: 'M13 2 3 14h7l-1 8 10-12h-7l1-8Z',
  link: 'M9.5 14.5l5-5M8 16.5 6 18.5a3.5 3.5 0 0 1-5-5l2-2M16 7.5l2-2a3.5 3.5 0 0 1 5 5l-2 2',
  ai: 'M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z',
  support: 'M12 3a7 7 0 0 0-7 7v3a3 3 0 0 0 3 3h1v-6H6v-0a6 6 0 0 1 12 0v0h-3v6h1a3 3 0 0 0 3-3v-3a7 7 0 0 0-7-7ZM9 16v2a3 3 0 0 0 3 3h1',
  speed: 'M12 21a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm0-8 4-3M4 5l2 2M20 5l-2 2',
  repeat: 'M4 9a8 8 0 0 1 14.3-4.7M20 15a8 8 0 0 1-14.3 4.7M20 4v5h-5M4 20v-5h5',
  gears: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.4 5.6l-1.5 1.5M7.1 16.9l-1.5 1.5M18.4 18.4l-1.5-1.5M7.1 7.1 5.6 5.6',
  network: 'M6 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 6v12M18 6v12M6 18h12',
  bug: 'M9 9V6a3 3 0 0 1 6 0v3M6 10h12v5a6 6 0 0 1-12 0v-5ZM3 9l3 2M21 9l-3 2M3 18l3-2M21 18l-3-2M9 3l1.5 2M15 3l-1.5 2',
};

export default function Icon({ name, className = '' }) {
  const d = paths[name];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
