import useDocumentTitle from '../hooks/useDocumentTitle';

const projects = [
  {
    cat: 'Desarrollo Web',
    title: 'Sitio Corporativo a Medida',
    client: 'Cliente confidencial',
    label: 'Web',
    tags: ['React', 'Rendimiento', 'SEO'],
  },
  {
    cat: 'WordPress',
    title: 'Tienda en Línea WordPress',
    client: 'Comercio local',
    label: 'WooCommerce',
    tags: ['WordPress', 'WooCommerce', 'Optimización'],
  },
  {
    cat: 'Automatización',
    title: 'Flujo de Automatización de Ventas',
    client: 'Empresa de servicios',
    label: 'Automatización',
    tags: ['APIs', 'CRM', 'Zapier'],
  },
  {
    cat: 'Integraciones',
    title: 'Integración de Plataformas',
    client: 'Startup tecnológica',
    label: 'Integración',
    tags: ['API REST', 'CRM', 'Bases de datos'],
  },
  {
    cat: 'Inteligencia Artificial',
    title: 'Asistente Virtual para Atención al Cliente',
    client: 'Empresa de retail',
    label: 'Chatbot IA',
    tags: ['IA', 'Chatbot', 'Automatización'],
  },
  {
    cat: 'Soporte Técnico',
    title: 'Auditoría y Optimización de Rendimiento',
    client: 'Sitio institucional',
    label: 'Soporte',
    tags: ['Velocidad', 'Seguridad', 'Diagnóstico'],
  },
];

export default function Portfolio() {
  useDocumentTitle('Portafolio | María Sánchez - Messtix');

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Portafolio</span>
          <h1>Proyectos Recientes</h1>
          <p className="section-lead">
            Una muestra de soluciones tecnológicas desarrolladas para distintos sectores.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-3">
            {projects.map((p) => (
              <div className="port-card" key={p.title}>
                <div className="port-thumb">{p.label}</div>
                <div className="port-body">
                  <span className="port-cat">{p.cat}</span>
                  <h3>{p.title}</h3>
                  <p className="port-client">{p.client}</p>
                  <div className="tags">
                    {p.tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
