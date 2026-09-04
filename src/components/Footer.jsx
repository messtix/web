import { Link } from 'react-router-dom';
import Logo from './Logo';
import SocialLinks from './SocialLinks';

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
              Desarrollo web, soporte y automatización con IA, adaptados a lo que necesitas.
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
              <li><Link to="/contacto">Formulario</Link></li>
            </ul>
            <SocialLinks />
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Messtix. Todos los derechos reservados.</span>
        </div>
      </div>
    </footer>
  );
}
