import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { listPosts } from '../api/blog';

const PER_PAGE = 6;

export default function Blog() {
  useDocumentTitle('Blog | María Sánchez - Messtix');
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    listPosts()
      .then((res) => setPosts(res.posts))
      .catch(() => setError(true));
  }, []);

  const totalPages = posts ? Math.max(1, Math.ceil(posts.length / PER_PAGE)) : 1;
  const currentPage = Math.min(page, totalPages);
  const pagePosts = posts
    ? posts.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)
    : [];

  function goToPage(p) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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
          {error && <p>No se pudieron cargar los artículos. Intenta de nuevo más tarde.</p>}

          {!error && posts === null && <p>Cargando artículos…</p>}

          {!error && posts !== null && posts.length === 0 && (
            <p>Todavía no hay artículos publicados. Vuelve pronto.</p>
          )}

          {!error && posts !== null && posts.length > 0 && (
            <>
              <div className="grid grid-3">
                {pagePosts.map((p) => (
                  <Link to={`/blog/${p.slug}`} className="blog-card" key={p.slug}>
                    {p.cover_image && (
                      <div className="blog-card-cover">
                        <img src={p.cover_image} alt={p.title} loading="lazy" />
                      </div>
                    )}
                    <span className="blog-meta">{p.category || 'Artículo'}</span>
                    <h3>{p.title}</h3>
                    {p.excerpt && <p>{p.excerpt}</p>}
                    {p.author && <p className="blog-card-author">Autor: {p.author}</p>}
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <nav className="pagination" aria-label="Paginación del blog">
                  <button
                    type="button"
                    className="pagination-arrow"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Página anterior"
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`pagination-page${p === currentPage ? ' is-active' : ''}`}
                      onClick={() => goToPage(p)}
                      aria-current={p === currentPage ? 'page' : undefined}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="pagination-arrow"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Página siguiente"
                  >
                    ›
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
