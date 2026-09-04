import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { listPosts } from '../api/blog';
import Icon from '../components/Icon';
import Reveal from '../components/Reveal';

const specialties = [
  { icon: 'code', title: 'Desarrollo Web', desc: 'Sitios web modernos, rápidos y escalables.' },
  { icon: 'automation', title: 'Automatización de Procesos', desc: 'Flujos de trabajo automatizados.' },
  { icon: 'link', title: 'Integraciones CRM', desc: 'Conexión entre plataformas y sistemas.' },
  { icon: 'ai', title: 'Asistentes Virtuales IA', desc: 'Chatbots inteligentes para atención al cliente.' },
  { icon: 'support', title: 'Soporte Técnico', desc: 'Diagnóstico y solución de problemas web.' },
];

const problems = [
  { icon: 'speed', title: 'Sitios web lentos', desc: 'Optimización de rendimiento y velocidad de carga.' },
  { icon: 'repeat', title: 'Procesos manuales repetitivos', desc: 'Automatización para ahorrar tiempo y recursos.' },
  { icon: 'gears', title: 'Falta de automatización', desc: 'Implementación de flujos automáticos.' },
  { icon: 'network', title: 'Sistemas desconectados', desc: 'Integración de plataformas mediante APIs.' },
  { icon: 'bug', title: 'Errores técnicos constantes', desc: 'Auditorías y soluciones técnicas especializadas.' },
];

export default function Home() {
  useDocumentTitle('María Sánchez | Desarrollo Web, Automatización e IA');
  const [latestPosts, setLatestPosts] = useState([]);

  useEffect(() => {
    listPosts(3)
      .then((res) => setLatestPosts(res.posts))
      .catch(() => setLatestPosts([]));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container">
          <div>
            <span className="hero-badge">Consultora en Soluciones Digitales</span>
            <h1>
              Desarrollo Web, <em>Automatización</em> e Inteligencia Artificial adaptado a tu
              necesidad.
            </h1>
            <p className="lead">
              Ayudo a optimizar sitios web, automatizar procesos y desarrollar soluciones
              digitales eficientes, adaptadas a cada necesidad.
            </p>
            <div className="hero-actions">
              <a href="/servicios" className="btn btn-primary">Ver Servicios</a>
              <a href="/portafolio" className="btn btn-outline">Ver Portafolio</a>
              <a href="https://calendly.com/messtix" target="_blank" rel="noreferrer" className="btn btn-ghost">
                Solicitar Asesoría →
              </a>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <span className="blob blob-1"></span>
            <span className="blob blob-2"></span>

            <div className="mock-chip mock-chip-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 9l-4 3 4 3M16 9l4 3-4 3M13.5 6l-3 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Código limpio
            </div>
            <div className="mock-chip mock-chip-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Automatización
            </div>
            <div className="mock-chip mock-chip-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M12 3v2M12 19v2M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M3 12h2M19 12h2M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5" strokeLinecap="round" /></svg>
              IA Aplicada
            </div>

            <div className="mock-window">
              <div className="mock-window-bar">
                <span></span><span></span><span></span>
              </div>
              <div className="mock-window-body">
                <div className="mock-line w-45"></div>
                <div className="mock-line w-90"></div>
                <div className="mock-line w-70"></div>
                <div className="mock-line w-45"></div>
                <div className="mock-line w-90"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <span className="eyebrow">Especialización</span>
          <h2 className="section-title">Áreas de Especialización</h2>
          <p className="section-lead">
            Soluciones tecnológicas integrales para impulsar tu negocio digital.
          </p>
          <div className="grid grid-3" style={{ marginTop: 40 }}>
            {specialties.map((s, i) => (
              <Reveal className="card" delay={i * 60} key={s.title}>
                <span className="icon-badge"><Icon name={s.icon} /></span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <span className="eyebrow">Soluciones</span>
          <h2 className="section-title">Problemas que Resuelvo</h2>
          <p className="section-lead">
            Identifico y soluciono los problemas técnicos que frenan tu negocio.
          </p>
          <div className="grid grid-3" style={{ marginTop: 40 }}>
            {problems.map((p, i) => (
              <Reveal className="problem-card" delay={i * 60} key={p.title}>
                <span className="icon-badge icon-badge-outline"><Icon name={p.icon} /></span>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {latestPosts.length > 0 && (
        <section className="section">
          <div className="container">
            <span className="eyebrow">Blog</span>
            <h2 className="section-title">Últimas Publicaciones</h2>
            <p className="section-lead">
              Artículos recientes sobre desarrollo web, automatización e inteligencia artificial.
            </p>
            <div className="grid grid-3" style={{ marginTop: 40 }}>
              {latestPosts.map((p) => (
                <Link to={`/blog/${p.slug}`} className="blog-card" key={p.slug}>
                  {p.cover_image && (
                    <div className="blog-card-cover">
                      <img src={p.cover_image} alt={p.title} loading="lazy" />
                    </div>
                  )}
                  <span className="blog-meta">{p.category || 'Artículo'}</span>
                  <h3>{p.title}</h3>
                  {p.excerpt && <p>{p.excerpt}</p>}
                </Link>
              ))}
            </div>
            <p style={{ marginTop: 32 }}>
              <Link to="/blog" className="btn-ghost">Ver todos los artículos →</Link>
            </p>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Optimiza, automatiza y potencia tu presencia digital</h2>
              <p>Consultoría personalizada en desarrollo web, soporte, automatización e inteligencia artificial, adaptada a tus necesidades.</p>
            </div>
            <div className="hero-actions" style={{ marginTop: 0 }}>
              <a href="https://calendly.com/messtix" target="_blank" rel="noreferrer" className="btn btn-primary">
                Solicitar Asesoría Gratuita
              </a>
              <a href="/contacto" className="btn btn-outline-invert">
                Contacto
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
