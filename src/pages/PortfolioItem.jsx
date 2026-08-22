import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { getProject } from '../api/portfolio';

export default function PortfolioItem() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ok | not_found | error

  useDocumentTitle(
    project ? `${project.name} | Portafolio Messtix` : 'Portafolio | María Sánchez - Messtix'
  );

  useEffect(() => {
    setStatus('loading');
    setProject(null);
    getProject(slug)
      .then((res) => {
        setProject(res.project);
        setStatus('ok');
      })
      .catch((err) => {
        setStatus(err.message === 'not_found' ? 'not_found' : 'error');
      });
  }, [slug]);

  if (status === 'loading') {
    return (
      <section className="page-hero">
        <div className="container">
          <p className="section-lead">Cargando proyecto…</p>
        </div>
      </section>
    );
  }

  if (status === 'not_found') {
    return (
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Portafolio</span>
          <h1>Proyecto no encontrado</h1>
          <p className="section-lead">
            Este proyecto no existe o fue removido. <Link to="/portafolio">Volver al portafolio</Link>.
          </p>
        </div>
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section className="page-hero">
        <div className="container">
          <p className="section-lead">
            Hubo un problema al cargar este proyecto. Intenta de nuevo más tarde.
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">{project.category}</span>
          <h1>{project.name}</h1>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <article className="post-article">
            {project.cover_image ? (
              <div className="port-detail-cover-wrap">
                <img className="port-detail-cover" src={project.cover_image} alt={project.name} />
              </div>
            ) : (
              <div className="port-detail-placeholder">{project.name}</div>
            )}

            <dl className="port-detail-meta">
              {project.client && (
                <div>
                  <dt>Cliente</dt>
                  <dd>{project.client}</dd>
                </div>
              )}
              {project.company && (
                <div>
                  <dt>Empresa</dt>
                  <dd>{project.company}</dd>
                </div>
              )}
              <div>
                <dt>Categoría</dt>
                <dd>{project.category}</dd>
              </div>
              {project.url && (
                <div>
                  <dt>URL</dt>
                  <dd>
                    <a href={project.url} target="_blank" rel="noreferrer">
                      {project.url.replace(/^https?:\/\//, '')}
                    </a>
                  </dd>
                </div>
              )}
            </dl>

            {project.description && (
              <p className="port-description">{project.description}</p>
            )}
          </article>

          <p style={{ marginTop: 32 }}>
            <Link to="/portafolio" className="btn-ghost">← Volver al portafolio</Link>
          </p>
        </div>
      </section>
    </>
  );
}
