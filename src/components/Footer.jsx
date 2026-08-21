import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link to="/" className="logo">
              <Logo variant="light" />
            </Link>
            <p style={{ marginTop: 12, maxWidth: 280 }}>
              Desarrollo web, automatización e inteligencia artificial para empresas.
            </p>
          </div>
          <div>
            <h4>Navegación</h4>
            <ul>
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="/sobre-mi">Sobre Mí</Link></li>
              <li><Link to="/servicios">Servicios</Link></li>
              <li><Link to="/portafolio">Portafolio</Link></li>
            </ul>
          </div>
          <div>
            <h4>Contacto</h4>
            <ul>
              <li><a href="mailto:info@messtix.com">info@messtix.com</a></li>
              <li><a href="https://wa.me/584246383453" target="_blank" rel="noreferrer">WhatsApp</a></li>
              <li><a href="tel:+584246383453">+58 424 6383453</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Messtix. Todos los derechos reservados.</span>
        </div>
      </div>
    </footer>
  );
}
