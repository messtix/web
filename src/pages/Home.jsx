const specialties = [
  { num: '01', title: 'Desarrollo Web', desc: 'Sitios web modernos, rápidos y escalables.' },
  { num: '02', title: 'Automatización Empresarial', desc: 'Flujos de trabajo automatizados.' },
  { num: '03', title: 'Integraciones CRM', desc: 'Conexión entre plataformas y sistemas.' },
  { num: '04', title: 'Asistentes Virtuales IA', desc: 'Chatbots inteligentes para atención al cliente.' },
  { num: '05', title: 'Soporte Técnico', desc: 'Diagnóstico y solución de problemas web.' },
];

const problems = [
  { title: 'Sitios web lentos', desc: 'Optimización de rendimiento y velocidad de carga.' },
  { title: 'Procesos manuales repetitivos', desc: 'Automatización para ahorrar tiempo y recursos.' },
  { title: 'Falta de automatización', desc: 'Implementación de flujos automáticos.' },
  { title: 'Sistemas desconectados', desc: 'Integración de plataformas mediante APIs.' },
  { title: 'Errores técnicos constantes', desc: 'Auditorías y soluciones técnicas especializadas.' },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <div>
            <span className="hero-badge">Ingeniera en Computación</span>
            <h1>
              Desarrollo Web, <em>Automatización</em> e Inteligencia Artificial para Empresas
            </h1>
            <p className="lead">
              Ayudo a empresas a optimizar sus sitios web, automatizar procesos y crear
              sistemas digitales eficientes.
            </p>
            <div className="hero-actions">
              <a href="/servicios" className="btn btn-primary">Ver Servicios</a>
              <a href="/portafolio" className="btn btn-outline">Ver Portafolio</a>
              <a href="https://calendly.com/messtix" target="_blank" rel="noreferrer" className="btn btn-ghost">
                Solicitar Asesoría →
              </a>
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
            {specialties.map((s) => (
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
          <span className="eyebrow">Soluciones</span>
          <h2 className="section-title">Problemas que Resuelvo</h2>
          <p className="section-lead">
            Identifico y soluciono los problemas técnicos que frenan tu negocio.
          </p>
          <div className="grid grid-3" style={{ marginTop: 40 }}>
            {problems.map((p) => (
              <div className="problem-card" key={p.title}>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Optimiza tu infraestructura digital y automatiza tu negocio</h2>
              <p>Consultoría personalizada para llevar tu negocio al siguiente nivel tecnológico.</p>
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
