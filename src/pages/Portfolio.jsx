import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { listProjects } from '../api/portfolio';

export default function Portfolio() {
  useDocumentTitle('Portafolio | María Sánchez - Messtix');
  const [projects, setProjects] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');

  useEffect(() => {
    listProjects()
      .then((res) => {
        setProjects(res.projects);
        setCategories(res.categories || []);
      })
      .catch(() => setError(true));
  }, []);

  const filtered = activeCategory
    ? (projects || []).filter((p) => p.category === activeCategory)
    : projects;

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Portafolio</span>
          <h1>Proyectos Recientes</h1>
          <p className="section-lead">
            Una muestra de soluciones tecnológicas desarrolladas para distintos sectores.
          </p>

          {categories.length > 0 && (
            <div className="category-filters">
              <button
                type="button"
                className={`category-filter${activeCategory === '' ? ' is-active' : ''}`}
                onClick={() => setActiveCategory('')}
              >
                Todos
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`category-filter${activeCategory === c ? ' is-active' : ''}`}
                  onClick={() => setActiveCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          {error && <p>No se pudieron cargar los proyectos. Intenta de nuevo más tarde.</p>}

          {!error && projects === null && <p>Cargando proyectos…</p>}

          {!error && projects !== null && filtered.length === 0 && (
            <p>Todavía no hay proyectos publicados en esta categoría.</p>
          )}

          {!error && filtered && filtered.length > 0 && (
            <div className="grid grid-3">
              {filtered.map((p) => (
                <Link to={`/portafolio/${p.slug}`} className="port-card" key={p.slug}>
                  {p.cover_image ? (
                    <div className="port-thumb-img">
                      <img src={p.cover_image} alt={p.name} loading="lazy" />
                    </div>
                  ) : (
                    <div className="port-thumb">{p.name}</div>
                  )}
                  <div className="port-body">
                    <span className="port-cat">{p.category}</span>
                    <h3>{p.name}</h3>
                    {p.description && <p className="port-desc">{p.description}</p>}
                    <div className="port-footer">
                      {p.company && <span className="port-company">{p.company}</span>}
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="port-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ver sitio →
                        </a>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
