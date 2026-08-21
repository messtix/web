import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Logo from './Logo';

const links = [
  { to: '/', label: 'Inicio' },
  { to: '/sobre-mi', label: 'Sobre Mí' },
  { to: '/servicios', label: 'Servicios' },
  { to: '/portafolio', label: 'Portafolio' },
  { to: '/blog', label: 'Blog' },
  { to: '/contacto', label: 'Contacto' },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <nav className="nav">
        <NavLink to="/" className="logo" onClick={() => setOpen(false)}>
          <Logo />
        </NavLink>
        <ul className={`nav-links${open ? ' open' : ''}`}>
          {links.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} end={link.to === '/'} onClick={() => setOpen(false)}>
                {link.label}
              </NavLink>
            </li>
          ))}
          <li className="nav-cta">
            <a href="https://calendly.com/messtix" target="_blank" rel="noreferrer" className="btn btn-primary">
              Asesoría Gratis
            </a>
          </li>
        </ul>
        <button
          className="nav-toggle"
          aria-label="Abrir menú"
          onClick={() => setOpen((o) => !o)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>
    </header>
  );
}
