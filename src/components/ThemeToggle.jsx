import useTheme from '../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      <svg viewBox="0 0 24 24" fill="none" className="icon-sun" aria-hidden="true">
        <circle cx="12" cy="12" r="4.6" stroke="currentColor" strokeWidth="1.8" />
        <path
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"
        />
      </svg>
      <svg viewBox="0 0 24 24" fill="none" className="icon-moon" aria-hidden="true">
        <path
          fill="currentColor"
          d="M20.6 15.2A8.8 8.8 0 1 1 8.8 3.4a.7.7 0 0 1 .8 1 7 7 0 0 0 9 9 .7.7 0 0 1 1 .8Z"
        />
      </svg>
    </button>
  );
}
