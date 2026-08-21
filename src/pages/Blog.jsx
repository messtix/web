import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { listPosts } from '../api/blog';

export default function Blog() {
  useDocumentTitle('Blog | María Sánchez - Messtix');
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    listPosts()
      .then((res) => setPosts(res.posts))
      .catch(() => setError(true));
  }, []);

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
            <div className="grid grid-3">
              {posts.map((p) => (
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
          )}
        </div>
      </section>
    </>
  );
}
