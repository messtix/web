const services = [
  { num: '01', title: 'Desarrollo Web', desc: 'Sitios web modernos, rápidos y escalables, construidos a medida para tu negocio.' },
  { num: '02', title: 'Automatización Empresarial', desc: 'Flujos de trabajo automatizados que eliminan tareas manuales repetitivas.' },
  { num: '03', title: 'Integraciones CRM', desc: 'Conexión entre plataformas y sistemas para centralizar tu información.' },
  { num: '04', title: 'Asistentes Virtuales IA', desc: 'Chatbots inteligentes para atención al cliente disponibles 24/7.' },
  { num: '05', title: 'Soporte Técnico', desc: 'Diagnóstico y solución de problemas web, seguridad y rendimiento.' },
];

export default function Services() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Servicios</span>
          <h1>Soluciones para Impulsar tu Negocio Digital</h1>
          <p className="section-lead">
            Desarrollo web, automatización de procesos e inteligencia artificial adaptados
            a las necesidades reales de tu empresa.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-3">
            {services.map((s) => (
              <div className="card" key={s.num}>
                <span className="num">{s.num}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>¿Listo para optimizar tu negocio?</h2>
              <p>Agenda una asesoría gratuita y descubramos juntos la mejor solución.</p>
            </div>
            <div className="hero-actions" style={{ marginTop: 0 }}>
              <a href="https://calendly.com/messtix" target="_blank" rel="noreferrer" className="btn btn-primary">
                Solicitar Asesoría Gratuita
              </a>
              <a
                href="/contacto"
                className="btn btn-outline"
                style={{ borderColor: '#fff', color: '#fff' }}
              >
                Contacto
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
