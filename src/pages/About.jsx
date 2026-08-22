import { useState } from 'react';
import Lightbox from '../components/Lightbox';
import useDocumentTitle from '../hooks/useDocumentTitle';

const skills = [
  'Arquitectura Web',
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
  { alt: 'Workshop: El poder de una web optimizada en zuWebFest22', img: '/img/eventos/poder-web-optimizada-zuwebfest22.jpg' },
  { alt: 'Foro: ¿Cómo vivir de WordPress? en zuWebFest21', img: '/img/eventos/foro-como-vivir-de-wordpress-zuwebfest21.jpg' },
  { alt: 'Las 7 Claves del Éxito en WordPress en #WCVenezuela2021', img: '/img/eventos/wcvenezuela2021-7-claves-exito-wordpress.jpg' },
  { alt: 'Workshop: ¿Cómo hacer una tienda online con WooCommerce? en zuWebFest20', img: '/img/eventos/woocommerce-zuwebfest20.jpg' },
  { alt: 'Workshop: WordPress Tabú - El placer de una web segura en zuWebFest19', img: '/img/eventos/wordpress-tabu-zuwebfest19.jpg' },
  { alt: 'MeetUp Mujeres en Tecnología: Comercio Electrónico Femenino', img: '/img/eventos/meetup-mujeres-tecnologia.jpg' },
  { alt: 'MeetUp de Emprendedores: Chatbots (Inteligencia Artificial) y Atención al Cliente', img: '/img/eventos/meetup-chatbots.jpg' },
  { alt: 'Maracaibo WordPress MeetUp: Las 12 claves del éxito en WordPress', img: '/img/eventos/maracaibo-wordpress-meetup.jpg' },
];

export default function About() {
  useDocumentTitle('Sobre Mí | María Sánchez - Messtix');
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <>
      <section className="page-hero page-hero-profile">
        <div className="container">
          <div>
            <span className="eyebrow">Sobre Mí</span>
            <h1>Consultora en Soluciones Digitales</h1>
            <p className="section-lead">
              Ingeniera en Computación, con más de 10 años de experiencia en el área
              tecnológica. Durante mi trayectoria he trabajado en la creación,
              implementación y optimización de soluciones digitales para distintos
              proyectos y necesidades.
            </p>
            <p className="section-lead">
              Mi enfoque combina estrategia, tecnología y funcionalidad para desarrollar
              soluciones prácticas que permitan optimizar procesos, mejorar experiencias y
              aprovechar mejor las herramientas digitales disponibles.
            </p>
            <p className="section-lead">
              También he participado en webinars, workshops, foros, meetups y conferencias
              sobre tecnología e innovación, manteniéndome en constante aprendizaje y
              actualización.
            </p>
            <p className="about-stack">
              Desarrollo Web · WordPress · WooCommerce · UX · Automatización · IA ·
              Integraciones · Soporte Web
            </p>
          </div>
          <div className="avatar-ring">
            <img src="/img/maria-sanchez.jpg" alt="María Sánchez" />
          </div>
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
            {events.map((event, index) => (
              <button
                key={event.alt}
                type="button"
                className="gallery-item"
                onClick={() => setActiveIndex(index)}
              >
                <img
                  src={event.img}
                  alt={event.alt}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextSibling.style.display = 'flex';
                  }}
                />
                <span className="gallery-item-fallback">{event.alt}</span>
                <span className="gallery-item-caption">{event.alt}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {activeIndex !== null && (
        <Lightbox
          items={events}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
          onNavigate={setActiveIndex}
        />
      )}
    </>
  );
}
