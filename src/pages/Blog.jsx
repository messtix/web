import useDocumentTitle from '../hooks/useDocumentTitle';

const posts = [
  {
    meta: 'Desarrollo Web',
    title: '5 claves para optimizar la velocidad de tu sitio web',
    desc: 'Prácticas esenciales para reducir tiempos de carga y mejorar la experiencia de usuario.',
  },
  {
    meta: 'Automatización',
    title: 'Cómo la automatización de procesos ahorra tiempo a tu empresa',
    desc: 'Identifica tareas repetitivas y conviértelas en flujos automáticos eficientes.',
  },
  {
    meta: 'Inteligencia Artificial',
    title: 'Asistentes virtuales: el futuro de la atención al cliente',
    desc: 'Ventajas de implementar chatbots inteligentes en tu negocio.',
  },
  {
    meta: 'Seguridad Web',
    title: 'Buenas prácticas de seguridad para sitios WordPress',
    desc: 'Protege tu sitio de vulnerabilidades comunes con estas recomendaciones.',
  },
  {
    meta: 'SEO Técnico',
    title: 'Fundamentos de SEO técnico que todo sitio debería cumplir',
    desc: 'Los aspectos técnicos que más impactan tu posicionamiento en buscadores.',
  },
  {
    meta: 'Integraciones',
    title: 'Conectando tus sistemas: integraciones API explicadas',
    desc: 'Cómo unificar tus plataformas para una operación más eficiente.',
  },
];

export default function Blog() {
  useDocumentTitle('Blog | María Sánchez - Messtix');

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Blog</span>
          <h1>Artículos y Recursos</h1>
          <p className="section-lead">
            Contenido sobre desarrollo web, automatización e inteligencia artificial.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-3">
            {posts.map((p) => (
              <div className="blog-card" key={p.title}>
                <span className="blog-meta">{p.meta}</span>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
