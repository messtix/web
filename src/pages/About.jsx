import { useState } from 'react';
import Lightbox from '../components/Lightbox';

const skills = [
  'Arquitectura Web',
  'WordPress Avanzado',
  'Optimización de Rendimiento',
  'Integraciones API',
  'Asistentes Virtuales',
  'Automatización de Procesos',
  'SEO Técnico',
  'Seguridad Web',
  'Servidores y Hosting',
];

const steps = [
  { num: '01', title: 'Analizar', desc: 'Estudio el problema del negocio a fondo.' },
  { num: '02', title: 'Diseñar', desc: 'Diseño la solución tecnológica ideal.' },
  { num: '03', title: 'Implementar', desc: 'Desarrollo e implemento la solución.' },
  { num: '04', title: 'Optimizar', desc: 'Monitoreo y mejoro continuamente.' },
];

const events = [
  'Charla sobre tipos de inteligencia artificial',
  'Ponencia sobre seguridad web en zuWebFest',
  'Charla sobre seguridad en WordPress',
  'Ponencia con micrófono',
  'Transmisión zuWebFest',
  'Charla zuWebFest19',
  'Panel en zuWebFest',
  'Ponencia con micrófono inalámbrico',
];

export default function About() {
  const [active, setActive] = useState(null);

  return (
    <>
      <section className="page-hero page-hero-profile">
        <div className="container">
          <div>
            <span className="eyebrow">Sobre Mí</span>
            <h1>Ingeniera en Computación</h1>
            <p className="section-lead">
              Especializada en desarrollo web, automatización de procesos e integraciones
              tecnológicas. Ayudo a empresas a optimizar sus sistemas digitales y crear
              soluciones eficientes.
            </p>
          </div>
          <div className="avatar-ring">MS</div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <span className="eyebrow">Habilidades</span>
          <h2 className="section-title">Experiencia y Competencias</h2>
          <div className="pills" style={{ marginTop: 32 }}>
            {skills.map((s) => (
              <span className="pill" key={s}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <span className="eyebrow">Metodología</span>
          <h2 className="section-title">Enfoque de Trabajo</h2>
          <p className="section-lead">Un proceso claro y estructurado para cada proyecto.</p>
          <div className="steps" style={{ marginTop: 40 }}>
            {steps.map((s) => (
              <div className="step" key={s.num}>
                <span className="num">{s.num}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <span className="eyebrow">Trayectoria</span>
          <h2 className="section-title">Participación en Eventos</h2>
          <p className="section-lead">
            Charlas y conferencias sobre desarrollo web, seguridad e inteligencia artificial.
          </p>
          <div className="gallery-grid" style={{ marginTop: 40 }}>
            {events.map((alt) => (
              <button
                key={alt}
                type="button"
                className="gallery-item"
                onClick={() => setActive({ alt })}
              >
                {alt}
              </button>
            ))}
          </div>
        </div>
      </section>

      {active && <Lightbox item={active} onClose={() => setActive(null)} />}
    </>
  );
}
