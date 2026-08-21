import { useEffect, useState } from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import {
  getSession,
  login,
  logout,
  changePassword,
  adminListPosts,
  adminGetPost,
  savePost,
  deletePost,
  uploadImage,
} from '../api/blog';

const emptyForm = {
  id: '',
  title: '',
  excerpt: '',
  content: '',
  category: '',
  cover_image: '',
  published: false,
};

function LoginForm({ onLoggedIn }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(password);
      onLoggedIn();
    } catch {
      setError('Contraseña incorrecta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 80, paddingBottom: 80 }}>
      <span className="eyebrow">Admin</span>
      <h1>Acceso al Editor</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="admin-password">Contraseña</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
        </div>
        {error && <p style={{ color: 'var(--vino)' }}>{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

function PostForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const res = await uploadImage(file);
      set('cover_image', res.url);
    } catch {
      setError('No se pudo subir la imagen. Verifica que sea JPG, PNG o WEBP de menos de 5MB.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await savePost(form);
      onSaved();
    } catch {
      setError('No se pudo guardar el artículo. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
      <div>
        <label htmlFor="title">Título</label>
        <input
          id="title"
          type="text"
          required
          maxLength="200"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="category">Categoría</label>
        <input
          id="category"
          type="text"
          maxLength="60"
          placeholder="Ej. Desarrollo Web, IA, Seguridad…"
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="excerpt">Resumen corto</label>
        <textarea
          id="excerpt"
          rows="2"
          maxLength="300"
          placeholder="Aparece en la tarjeta del blog"
          value={form.excerpt}
          onChange={(e) => set('excerpt', e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="content">Contenido</label>
        <textarea
          id="content"
          rows="14"
          required
          placeholder="Escribe el artículo. Deja una línea en blanco entre párrafos."
          value={form.content}
          onChange={(e) => set('content', e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="cover-image">Imagen de portada</label>
        <input id="cover-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} />
        {uploading && <p>Subiendo imagen…</p>}
        {form.cover_image && (
          <img src={form.cover_image} alt="Vista previa" style={{ marginTop: 10, maxWidth: 240, borderRadius: 'var(--radius)' }} />
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          id="published"
          type="checkbox"
          style={{ width: 'auto' }}
          checked={form.published}
          onChange={(e) => set('published', e.target.checked)}
        />
        <label htmlFor="published" style={{ margin: 0 }}>Publicado (visible en el blog)</label>
      </div>

      {error && <p style={{ color: 'var(--vino)' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 12 }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar Artículo'}
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function Dashboard() {
  const [posts, setPosts] = useState(null);
  const [editing, setEditing] = useState(null); // null = list, {} = new, post = edit
  const [changingPw, setChangingPw] = useState(false);

  function reload() {
    adminListPosts().then((res) => setPosts(res.posts));
  }

  useEffect(reload, []);

  async function handleEdit(id) {
    const res = await adminGetPost(id);
    setEditing(res.post);
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`¿Eliminar el artículo "${title}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    await deletePost(id);
    reload();
  }

  async function handleLogout() {
    await logout();
    window.location.reload();
  }

  if (editing !== null) {
    return (
      <div className="container" style={{ paddingTop: 60, paddingBottom: 80 }}>
        <span className="eyebrow">Admin</span>
        <h1>{editing.id ? 'Editar Artículo' : 'Nuevo Artículo'}</h1>
        <PostForm
          initial={editing.id ? editing : null}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 60, paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Artículos del Blog</h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={() => setEditing({})}>+ Nuevo Artículo</button>
          <button className="btn btn-outline" onClick={() => setChangingPw((v) => !v)}>Cambiar Contraseña</button>
          <button className="btn btn-outline" onClick={handleLogout}>Salir</button>
        </div>
      </div>

      {changingPw && <ChangePasswordForm onDone={() => setChangingPw(false)} />}

      {posts === null && <p style={{ marginTop: 32 }}>Cargando…</p>}

      {posts !== null && posts.length === 0 && (
        <p style={{ marginTop: 32 }}>Todavía no has creado ningún artículo.</p>
      )}

      {posts !== null && posts.length > 0 && (
        <div className="admin-post-list">
          {posts.map((p) => (
            <div className="admin-post-row" key={p.id}>
              <div>
                <strong>{p.title}</strong>
                <span className={`admin-status ${p.published ? 'is-published' : 'is-draft'}`}>
                  {p.published ? 'Publicado' : 'Borrador'}
                </span>
                <p style={{ margin: '4px 0 0', fontSize: '.85rem' }}>{p.date} · {p.category || 'Sin categoría'}</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-ghost" onClick={() => handleEdit(p.id)}>Editar</button>
                <button className="btn-ghost" style={{ color: 'var(--vino)' }} onClick={() => handleDelete(p.id, p.title)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChangePasswordForm({ onDone }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await changePassword(current, next);
      setOk(true);
      setCurrent('');
      setNext('');
    } catch (err) {
      setError(
        err.message === 'password_too_short'
          ? 'La nueva contraseña debe tener al menos 8 caracteres.'
          : 'Contraseña actual incorrecta.'
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 24, maxWidth: 360 }}>
      <div>
        <label htmlFor="current-pw">Contraseña actual</label>
        <input id="current-pw" type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div>
        <label htmlFor="new-pw">Nueva contraseña</label>
        <input id="new-pw" type="password" required minLength="8" value={next} onChange={(e) => setNext(e.target.value)} />
      </div>
      {error && <p style={{ color: 'var(--vino)' }}>{error}</p>}
      {ok && <p>Contraseña actualizada.</p>}
      <div style={{ display: 'flex', gap: 12 }}>
        <button type="submit" className="btn btn-primary">Actualizar</button>
        <button type="button" className="btn btn-outline" onClick={onDone}>Cerrar</button>
      </div>
    </form>
  );
}

export default function Admin() {
  useDocumentTitle('Admin | Messtix');
  const [loggedIn, setLoggedIn] = useState(null);

  useEffect(() => {
    getSession()
      .then((res) => setLoggedIn(res.loggedIn))
      .catch(() => setLoggedIn(false));
  }, []);

  if (loggedIn === null) {
    return (
      <div className="container" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <p>Cargando…</p>
      </div>
    );
  }

  return loggedIn ? <Dashboard /> : <LoginForm onLoggedIn={() => setLoggedIn(true)} />;
}
