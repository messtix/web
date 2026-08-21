import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { getPost } from '../api/blog';
import cleanPostHtml from '../lib/cleanPostHtml';

function formatDate(iso) {
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ok | not_found | error

  useDocumentTitle(
    post ? `${post.title} | Blog Messtix` : 'Blog | María Sánchez - Messtix'
  );

  useEffect(() => {
    setStatus('loading');
    setPost(null);
    getPost(slug)
      .then((res) => {
        setPost(res.post);
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
          <p className="section-lead">Cargando artículo…</p>
        </div>
      </section>
    );
  }

  if (status === 'not_found') {
    return (
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Blog</span>
          <h1>Artículo no encontrado</h1>
          <p className="section-lead">
            Este artículo no existe o fue removido. <Link to="/blog">Volver al blog</Link>.
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
            Hubo un problema al cargar este artículo. Intenta de nuevo más tarde.
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">{post.category || 'Artículo'}</span>
          <h1>{post.title}</h1>
          <p className="section-lead post-meta">
            {formatDate(post.date)}
            {post.author && (
              <>
                {' '}· Autor: <span className="post-author">{post.author}</span>
              </>
            )}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <article className="post-article">
            {post.cover_image && (
              <img className="post-cover" src={post.cover_image} alt={post.title} />
            )}
            <div
              className="post-body"
              dangerouslySetInnerHTML={{ __html: cleanPostHtml(post.content) }}
            />
          </article>
          <p style={{ marginTop: 32 }}>
            <Link to="/blog" className="btn-ghost">← Volver al blog</Link>
          </p>
        </div>
      </section>
    </>
  );
}
