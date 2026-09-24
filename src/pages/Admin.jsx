import { useEffect, useState } from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import RichTextEditor from '../components/RichTextEditor';
import {
  getSession,
  login,
  logout,
  changePassword,
  updateDisplayName,
  adminListPosts,
  adminGetPost,
  savePost,
  deletePost,
  uploadImage,
} from '../api/blog';
import {
  adminListProjects,
  adminGetProject,
  saveProject,
  deleteProject,
  uploadProjectImage,
} from '../api/portfolio';
import {
  adminListResources,
  saveResource,
  deleteResource,
  reorderResource,
  uploadResourceFile,
  adminListGuides,
  uploadGuide,
  updateGuide,
  deleteGuide,
} from '../api/files';

const ADMIN_PER_PAGE = 20;

function emptyPostForm(defaultAuthor) {
  return {
    id: '',
    title: '',
    excerpt: '',
    content: '',
    category: '',
    cover_image: '',
    author: defaultAuthor || '',
    published: false,
  };
}

function emptyProjectForm() {
  return {
    id: '',
    name: '',
    client: '',
    company: '',
    url: '',
    category: '',
    description: '',
    cover_image: '',
    published: false,
  };
}

function emptyResourceForm() {
  return {
    id: '',
    title: '',
    description: '',
    type: 'link',
    url: '',
    parent_id: '',
    username: '',
    password: '',
  };
}

function LoginForm({ onLoggedIn }) {
  const [username, setUsername] = useState('messtix');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      onLoggedIn();
    } catch (err) {
      setError(
        err.message === 'rate_limited'
          ? 'Demasiados intentos. Espera unos minutos.'
          : 'Usuario o contraseña incorrectos.'
      );
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
          <label htmlFor="admin-username">Usuario</label>
          <input
            id="admin-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="admin-password">Contraseña</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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

function PostForm({ initial, defaultAuthor, onSaved, onCancel }) {
  const [form, setForm] = useState(initial || emptyPostForm(defaultAuthor));
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
    setError('');

    if (uploading) {
      setError('Espera a que termine de subirse la imagen antes de guardar.');
      return;
    }

    const isContentEmpty = form.content.replace(/<[^>]*>/g, '').trim() === '';
    if (!form.title.trim() || isContentEmpty) {
      setError('El título y el contenido del artículo son obligatorios.');
      return;
    }

    setSaving(true);
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
        <label htmlFor="author">Autor</label>
        <input
          id="author"
          type="text"
          maxLength="80"
          placeholder="Nombre que se mostrará como autor"
          value={form.author}
          onChange={(e) => set('author', e.target.value)}
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
        <RichTextEditor
          value={form.content}
          onChange={(html) => set('content', html)}
          placeholder="Escribe el artículo…"
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
        <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
          {saving ? 'Guardando…' : uploading ? 'Subiendo imagen…' : 'Guardar Artículo'}
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function ProjectForm({ initial, categories, onSaved, onCancel }) {
  const [form, setForm] = useState(initial || emptyProjectForm());
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
      const res = await uploadProjectImage(file);
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
    setError('');

    if (uploading) {
      setError('Espera a que termine de subirse la imagen antes de guardar.');
      return;
    }

    if (!form.name.trim() || !form.category) {
      setError('El nombre del proyecto y la categoría son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      await saveProject(form);
      onSaved();
    } catch {
      setError('No se pudo guardar el proyecto. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
      <div>
        <label htmlFor="p-name">Nombre de Proyecto</label>
        <input
          id="p-name"
          type="text"
          required
          maxLength="150"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="p-client">Cliente</label>
        <input
          id="p-client"
          type="text"
          maxLength="150"
          value={form.client}
          onChange={(e) => set('client', e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="p-company">Empresa</label>
        <input
          id="p-company"
          type="text"
          maxLength="150"
          value={form.company}
          onChange={(e) => set('company', e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="p-url">URL</label>
        <input
          id="p-url"
          type="text"
          maxLength="300"
          placeholder="ejemplo.com"
          value={form.url}
          onChange={(e) => set('url', e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="p-category">Categoría</label>
        <select
          id="p-category"
          required
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
        >
          <option value="" disabled>Selecciona una categoría</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="p-description">Descripción</label>
        <textarea
          id="p-description"
          rows="6"
          maxLength="2000"
          placeholder="Breve descripción del proyecto"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="p-image">Imagen</label>
        <input id="p-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} />
        {uploading && <p>Subiendo imagen…</p>}
        {form.cover_image && (
          <img src={form.cover_image} alt="Vista previa" style={{ marginTop: 10, maxWidth: 240, borderRadius: 'var(--radius)' }} />
        )}
        {!form.cover_image && (
          <p style={{ fontSize: '.85rem', marginTop: 6 }}>
            Sin imagen se mostrará un recuadro de color con el nombre del proyecto.
          </p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          id="p-published"
          type="checkbox"
          style={{ width: 'auto' }}
          checked={form.published}
          onChange={(e) => set('published', e.target.checked)}
        />
        <label htmlFor="p-published" style={{ margin: 0 }}>Publicado (visible en el portafolio)</label>
      </div>

      {error && <p style={{ color: 'var(--vino)' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 12 }}>
        <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
          {saving ? 'Guardando…' : uploading ? 'Subiendo imagen…' : 'Guardar Proyecto'}
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function Pagination({ totalPages, currentPage, onGoToPage }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Paginación">
      <button
        type="button"
        className="pagination-arrow"
        onClick={() => onGoToPage(currentPage - 1)}
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
          onClick={() => onGoToPage(p)}
          aria-current={p === currentPage ? 'page' : undefined}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        className="pagination-arrow"
        onClick={() => onGoToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Página siguiente"
      >
        ›
      </button>
    </nav>
  );
}

function BlogPanel({ displayName }) {
  const [posts, setPosts] = useState(null);
  const [editing, setEditing] = useState(null); // null = list, {} = new, post = edit
  const [page, setPage] = useState(1);

  function reload() {
    adminListPosts().then((res) => setPosts(res.posts));
  }

  useEffect(reload, []);

  const totalPages = posts ? Math.max(1, Math.ceil(posts.length / ADMIN_PER_PAGE)) : 1;
  const currentPage = Math.min(page, totalPages);
  const pagePosts = posts
    ? posts.slice((currentPage - 1) * ADMIN_PER_PAGE, currentPage * ADMIN_PER_PAGE)
    : [];

  function goToPage(p) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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

  if (editing !== null) {
    return (
      <div>
        <h2 className="section-title" style={{ fontSize: '1.6rem' }}>
          {editing.id ? 'Editar Artículo' : 'Nuevo Artículo'}
        </h2>
        <PostForm
          initial={editing.id ? editing : null}
          defaultAuthor={displayName}
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <h2 className="section-title" style={{ fontSize: '1.6rem', margin: 0 }}>Artículos del Blog</h2>
        <button className="btn btn-primary" onClick={() => setEditing({})}>+ Nuevo Artículo</button>
      </div>

      {posts === null && <p style={{ marginTop: 32 }}>Cargando…</p>}

      {posts !== null && posts.length === 0 && (
        <p style={{ marginTop: 32 }}>Todavía no has creado ningún artículo.</p>
      )}

      {posts !== null && posts.length > 0 && (
        <>
          <p style={{ marginTop: 32, marginBottom: 0, fontSize: '.85rem', color: 'var(--gray-text)' }}>
            {posts.length} artículo{posts.length === 1 ? '' : 's'} en total
          </p>
          <div className="admin-post-list">
            {pagePosts.map((p) => (
              <div className="admin-post-row" key={p.id}>
                <div>
                  <strong>{p.title}</strong>
                  <span className={`admin-status ${p.published ? 'is-published' : 'is-draft'}`}>
                    {p.published ? 'Publicado' : 'Borrador'}
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: '.85rem' }}>
                    {p.date} · {p.category || 'Sin categoría'} · Autor: {p.author || '—'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-ghost" onClick={() => handleEdit(p.id)}>Editar</button>
                  <button className="btn-ghost" style={{ color: 'var(--vino)' }} onClick={() => handleDelete(p.id, p.title)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
          <Pagination totalPages={totalPages} currentPage={currentPage} onGoToPage={goToPage} />
        </>
      )}
    </div>
  );
}

function PortfolioPanel() {
  const [projects, setProjects] = useState(null);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null); // null = list, {} = new, project = edit
  const [page, setPage] = useState(1);

  function reload() {
    adminListProjects().then((res) => {
      setProjects(res.projects);
      setCategories(res.categories || []);
    });
  }

  useEffect(reload, []);

  const totalPages = projects ? Math.max(1, Math.ceil(projects.length / ADMIN_PER_PAGE)) : 1;
  const currentPage = Math.min(page, totalPages);
  const pageProjects = projects
    ? projects.slice((currentPage - 1) * ADMIN_PER_PAGE, currentPage * ADMIN_PER_PAGE)
    : [];

  function goToPage(p) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleEdit(id) {
    const res = await adminGetProject(id);
    setEditing(res.project);
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`¿Eliminar el proyecto "${name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    await deleteProject(id);
    reload();
  }

  if (editing !== null) {
    return (
      <div>
        <h2 className="section-title" style={{ fontSize: '1.6rem' }}>
          {editing.id ? 'Editar Proyecto' : 'Nuevo Proyecto'}
        </h2>
        <ProjectForm
          initial={editing.id ? editing : null}
          categories={categories}
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <h2 className="section-title" style={{ fontSize: '1.6rem', margin: 0 }}>Proyectos del Portafolio</h2>
        <button className="btn btn-primary" onClick={() => setEditing({})}>+ Nuevo Proyecto</button>
      </div>

      {projects === null && <p style={{ marginTop: 32 }}>Cargando…</p>}

      {projects !== null && projects.length === 0 && (
        <p style={{ marginTop: 32 }}>Todavía no has creado ningún proyecto.</p>
      )}

      {projects !== null && projects.length > 0 && (
        <>
          <p style={{ marginTop: 32, marginBottom: 0, fontSize: '.85rem', color: 'var(--gray-text)' }}>
            {projects.length} proyecto{projects.length === 1 ? '' : 's'} en total
          </p>
          <div className="admin-post-list">
            {pageProjects.map((p) => (
              <div className="admin-post-row" key={p.id}>
                <div>
                  <strong>{p.name}</strong>
                  <span className={`admin-status ${p.published ? 'is-published' : 'is-draft'}`}>
                    {p.published ? 'Publicado' : 'Borrador'}
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: '.85rem' }}>
                    {p.category} · {p.company || 'Sin empresa'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-ghost" onClick={() => handleEdit(p.id)}>Editar</button>
                  <button className="btn-ghost" style={{ color: 'var(--vino)' }} onClick={() => handleDelete(p.id, p.name)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
          <Pagination totalPages={totalPages} currentPage={currentPage} onGoToPage={goToPage} />
        </>
      )}
    </div>
  );
}

const RESOURCE_TYPES = [
  { value: 'link', label: 'Enlace' },
  { value: 'folder', label: 'Carpeta' },
  { value: 'file', label: 'Archivo' },
];

function descendantIds(id, resources) {
  const ids = [id];
  let changed = true;
  while (changed) {
    changed = false;
    for (const r of resources) {
      if (ids.includes(r.parent_id) && !ids.includes(r.id)) {
        ids.push(r.id);
        changed = true;
      }
    }
  }
  return ids;
}

function folderPath(id, resources) {
  const path = [];
  let current = id;
  while (current) {
    const folder = resources.find((r) => r.id === current);
    if (!folder) break;
    path.unshift(folder);
    current = folder.parent_id;
  }
  return path;
}

function ResourceForm({ initial, defaultParentId, resources, onSaved, onCancel }) {
  const hasFolders = resources.some((r) => r.type === 'folder');
  const [form, setForm] = useState(
    initial
      ? { ...emptyResourceForm(), ...initial, password: '' }
      : { ...emptyResourceForm(), parent_id: defaultParentId || '', type: hasFolders ? 'link' : 'folder' }
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const excluded = form.id ? descendantIds(form.id, resources) : [];
  const folderOptions = resources.filter((r) => r.type === 'folder' && !excluded.includes(r.id));
  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const res = await uploadResourceFile(file);
      set('url', res.url);
    } catch {
      setError('No se pudo subir el archivo. Verifica el formato y que pese menos de 25MB.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (uploading) {
      setError('Espera a que termine de subirse el archivo antes de guardar.');
      return;
    }

    if (!form.title.trim() || (form.type !== 'folder' && !form.url.trim())) {
      setError('El título y el enlace o archivo son obligatorios.');
      return;
    }

    if (form.type !== 'folder' && !form.parent_id) {
      setError('Selecciona la carpeta donde va este recurso. Los enlaces y archivos siempre van dentro de una carpeta.');
      return;
    }

    if (form.type === 'folder' && !form.username.trim()) {
      setError('Define un usuario para esta carpeta.');
      return;
    }

    if (form.type === 'folder' && !form.password && !form.has_password) {
      setError('Define una contraseña para el usuario de esta carpeta.');
      return;
    }

    setSaving(true);
    try {
      await saveResource(form);
      onSaved();
    } catch (err) {
      setError(
        err.message === 'password_required'
          ? 'Define una contraseña para el usuario de esta carpeta.'
          : err.message === 'username_required'
          ? 'Define un usuario para esta carpeta.'
          : err.message === 'parent_required'
          ? 'Selecciona la carpeta donde va este recurso.'
          : 'No se pudo guardar el recurso. Intenta de nuevo.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
      <div>
        <label htmlFor="r-title">Título</label>
        <input
          id="r-title"
          type="text"
          required
          maxLength="150"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="r-type">Tipo</label>
        <select id="r-type" value={form.type} onChange={(e) => set('type', e.target.value)}>
          {RESOURCE_TYPES.map((t) => (
            <option key={t.value} value={t.value} disabled={t.value !== 'folder' && folderOptions.length === 0}>
              {t.label}
            </option>
          ))}
        </select>
        {folderOptions.length === 0 && (
          <p style={{ fontSize: '.8rem', margin: '4px 0 0' }}>
            Crea al menos una carpeta antes de poder agregar enlaces o archivos.
          </p>
        )}
      </div>
      {form.type === 'folder' ? (
        <div>
          <label htmlFor="r-parent">Carpeta superior (opcional)</label>
          <select id="r-parent" value={form.parent_id || ''} onChange={(e) => set('parent_id', e.target.value)}>
            <option value="">Raíz (carpeta principal)</option>
            {folderOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {folderPath(f.id, resources).map((p) => p.title).join(' / ')}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label htmlFor="r-parent">Carpeta</label>
          <select
            id="r-parent"
            required
            value={form.parent_id || ''}
            onChange={(e) => set('parent_id', e.target.value)}
          >
            <option value="" disabled>Selecciona una carpeta</option>
            {folderOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {folderPath(f.id, resources).map((p) => p.title).join(' / ')}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label htmlFor="r-description">Descripción (opcional)</label>
        <textarea
          id="r-description"
          rows="2"
          maxLength="300"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>
      {form.type === 'folder' && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 16 }}>
          <p style={{ marginTop: 0, fontSize: '.85rem' }}>
            Toda carpeta necesita su propio usuario y contraseña: solo quien los tenga puede ver
            su contenido. Si usas el mismo usuario y contraseña en varias carpetas, esas
            credenciales dan acceso a todas ellas.
          </p>
          <div>
            <label htmlFor="r-username">Usuario</label>
            <input
              id="r-username"
              type="text"
              required
              maxLength="60"
              value={form.username}
              onChange={(e) => set('username', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="r-password">
              Contraseña {form.has_password ? '(déjalo en blanco para no cambiarla)' : ''}
            </label>
            <input
              id="r-password"
              type="text"
              maxLength="100"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
            />
          </div>
        </div>
      )}
      {form.type === 'folder' ? null : form.type === 'file' ? (
        <div>
          <label htmlFor="r-file">Archivo</label>
          <input
            id="r-file"
            type="file"
            accept=".pdf,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
          />
          {uploading && <p>Subiendo archivo…</p>}
          {form.url && !uploading && (
            <p style={{ fontSize: '.85rem', marginTop: 6 }}>Archivo listo: {form.url}</p>
          )}
        </div>
      ) : (
        <div>
          <label htmlFor="r-url">Enlace</label>
          <input
            id="r-url"
            type="text"
            placeholder="ejemplo.com/recurso"
            value={form.url}
            onChange={(e) => set('url', e.target.value)}
          />
        </div>
      )}

      {error && <p style={{ color: 'var(--vino)' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 12 }}>
        <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
          {saving ? 'Guardando…' : uploading ? 'Subiendo…' : 'Guardar Recurso'}
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function FilesPanel() {
  const [resources, setResources] = useState(null);
  const [editing, setEditing] = useState(null); // null = list, {} = new, resource = edit
  const [currentFolderId, setCurrentFolderId] = useState(null);

  function reload() {
    adminListResources().then((res) => setResources(res.resources));
  }

  useEffect(reload, []);

  async function handleDelete(id, title) {
    if (!window.confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    await deleteResource(id);
    reload();
  }

  async function handleMove(id, direction) {
    await reorderResource(id, direction);
    reload();
  }

  if (editing !== null) {
    return (
      <div>
        <h2 className="section-title" style={{ fontSize: '1.6rem' }}>
          {editing.id ? 'Editar Recurso' : 'Nuevo Recurso'}
        </h2>
        <ResourceForm
          initial={editing.id ? editing : null}
          defaultParentId={currentFolderId}
          resources={resources || []}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  const items = (resources || []).filter((r) => (r.parent_id || null) === currentFolderId);
  const breadcrumb = currentFolderId ? folderPath(currentFolderId, resources || []) : [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <h2 className="section-title" style={{ fontSize: '1.6rem', margin: 0 }}>Directorio de Archivos</h2>
        <button className="btn btn-primary" onClick={() => setEditing({})}>+ Nuevo Recurso</button>
      </div>
      <p style={{ marginTop: 12, fontSize: '.85rem' }}>
        Visible en <a href="/archivos" target="_blank" rel="noreferrer">/archivos</a>. Esta página
        no aparece en el menú y siempre pide usuario y contraseña antes de mostrar nada. Toda
        carpeta requiere su propio usuario y contraseña, y los enlaces y archivos solo pueden
        vivir dentro de una carpeta.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 20, fontSize: '.9rem' }}>
        <button type="button" className="btn-ghost" onClick={() => setCurrentFolderId(null)}>Raíz</button>
        {breadcrumb.map((f) => (
          <span key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>/</span>
            <button type="button" className="btn-ghost" onClick={() => setCurrentFolderId(f.id)}>{f.title}</button>
          </span>
        ))}
      </div>

      {resources === null && <p style={{ marginTop: 32 }}>Cargando…</p>}

      {resources !== null && items.length === 0 && (
        <p style={{ marginTop: 32 }}>Esta carpeta todavía no tiene recursos.</p>
      )}

      {resources !== null && items.length > 0 && (
        <div className="admin-post-list" style={{ marginTop: 24 }}>
          {items.map((r, i) => (
            <div className="admin-post-row" key={r.id}>
              <div>
                {r.type === 'folder' ? (
                  <button type="button" className="btn-ghost" style={{ fontWeight: 600 }} onClick={() => setCurrentFolderId(r.id)}>
                    {r.has_password ? '🔒' : '📁'} {r.title}
                  </button>
                ) : (
                  <strong>{r.title}</strong>
                )}
                <span className="admin-status is-published">
                  {RESOURCE_TYPES.find((t) => t.value === r.type)?.label || r.type}
                </span>
                {r.type === 'folder' && r.has_password && (
                  <span className="admin-status is-draft">Usuario: {r.username}</span>
                )}
                {r.url && <p style={{ margin: '4px 0 0', fontSize: '.85rem' }}>{r.url}</p>}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  className="btn-ghost"
                  disabled={i === 0}
                  onClick={() => handleMove(r.id, 'up')}
                  aria-label="Subir"
                >
                  ↑
                </button>
                <button
                  className="btn-ghost"
                  disabled={i === items.length - 1}
                  onClick={() => handleMove(r.id, 'down')}
                  aria-label="Bajar"
                >
                  ↓
                </button>
                <button className="btn-ghost" onClick={() => setEditing(r)}>Editar</button>
                <button className="btn-ghost" style={{ color: 'var(--vino)' }} onClick={() => handleDelete(r.id, r.title)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GuidesPanel() {
  const [guides, setGuides] = useState(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editSlug, setEditSlug] = useState('');

  function reload() {
    adminListGuides().then((res) => setGuides(res.guides));
  }

  useEffect(reload, []);

  async function handleUpload(e) {
    e.preventDefault();
    const file = e.target.elements['g-file'].files?.[0];
    if (!title.trim() || !file) {
      setError('Agrega un título y selecciona un archivo.');
      return;
    }
    setError('');
    setUploading(true);
    try {
      await uploadGuide(title.trim(), slug.trim(), file);
      setTitle('');
      setSlug('');
      e.target.reset();
      reload();
    } catch {
      setError('No se pudo subir el archivo. Verifica el formato y que pese menos de 25MB.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id, guideTitle) {
    if (!window.confirm(`¿Eliminar "${guideTitle}"? El enlace dejará de funcionar.`)) {
      return;
    }
    await deleteGuide(id);
    reload();
  }

  async function handleCopy(guide) {
    const fullUrl = `${window.location.origin}${guide.url}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(guide.id);
      setTimeout(() => setCopiedId(''), 2000);
    } catch {
      window.prompt('Copia el enlace:', fullUrl);
    }
  }

  function startEdit(guide) {
    setEditingId(guide.id);
    setEditTitle(guide.title);
    setEditSlug(guide.slug);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    await updateGuide(editingId, editTitle.trim(), editSlug.trim());
    setEditingId('');
    reload();
  }

  return (
    <div>
      <h2 className="section-title" style={{ fontSize: '1.6rem', margin: 0 }}>Guías</h2>
      <p style={{ marginTop: 12, fontSize: '.85rem' }}>
        Sube un archivo y obtén un enlace de descarga personalizado y público (sin usuario ni
        contraseña) para compartir donde quieras. La descarga conserva el nombre original del
        archivo.
      </p>

      <form onSubmit={handleUpload} style={{ marginTop: 24, maxWidth: 420 }}>
        <div>
          <label htmlFor="g-title">Título</label>
          <input
            id="g-title"
            type="text"
            maxLength="150"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="g-slug">Enlace personalizado (opcional)</label>
          <input
            id="g-slug"
            type="text"
            maxLength="80"
            placeholder="ej. guia-bienvenida"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <p style={{ fontSize: '.8rem', margin: '4px 0 0' }}>
            {window.location.origin}/guias/{slug.trim() || '…'}
          </p>
        </div>
        <div>
          <label htmlFor="g-file">Archivo</label>
          <input
            id="g-file"
            name="g-file"
            type="file"
            accept=".pdf,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
          />
        </div>
        {error && <p style={{ color: 'var(--vino)' }}>{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={uploading}>
          {uploading ? 'Subiendo…' : 'Subir Guía'}
        </button>
      </form>

      {guides === null && <p style={{ marginTop: 32 }}>Cargando…</p>}
      {guides !== null && guides.length === 0 && (
        <p style={{ marginTop: 32 }}>Todavía no has subido ninguna guía.</p>
      )}

      {guides !== null && guides.length > 0 && (
        <div className="admin-post-list" style={{ marginTop: 32 }}>
          {guides.map((g) =>
            editingId === g.id ? (
              <form className="admin-post-row" key={g.id} onSubmit={handleSaveEdit} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
                <div>
                  <label htmlFor={`e-title-${g.id}`}>Título</label>
                  <input
                    id={`e-title-${g.id}`}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor={`e-slug-${g.id}`}>Enlace personalizado</label>
                  <input
                    id={`e-slug-${g.id}`}
                    type="text"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn btn-primary">Guardar</button>
                  <button type="button" className="btn btn-outline" onClick={() => setEditingId('')}>Cancelar</button>
                </div>
              </form>
            ) : (
              <div className="admin-post-row" key={g.id}>
                <div>
                  <strong>{g.title}</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '.85rem' }}>
                    {window.location.origin}{g.url} · descarga: {g.original_filename}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn-ghost" onClick={() => handleCopy(g)}>
                    {copiedId === g.id ? '¡Copiado!' : 'Copiar Enlace'}
                  </button>
                  <a className="btn-ghost" href={g.url} target="_blank" rel="noreferrer">Abrir</a>
                  <button className="btn-ghost" onClick={() => startEdit(g)}>Editar</button>
                  <button className="btn-ghost" style={{ color: 'var(--vino)' }} onClick={() => handleDelete(g.id, g.title)}>Eliminar</button>
                </div>
              </div>
            )
          )}
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

function ChangeNameForm({ current, onDone, onChanged }) {
  const [name, setName] = useState(current || '');
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await updateDisplayName(name);
      onChanged(name);
      setOk(true);
    } catch {
      setError('No se pudo actualizar el nombre.');
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 24, maxWidth: 360 }}>
      <div>
        <label htmlFor="display-name">
          Nombre a mostrar como autor (texto plano, sin enlace)
        </label>
        <input
          id="display-name"
          type="text"
          required
          maxLength="80"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      {error && <p style={{ color: 'var(--vino)' }}>{error}</p>}
      {ok && <p>Nombre actualizado.</p>}
      <div style={{ display: 'flex', gap: 12 }}>
        <button type="submit" className="btn btn-primary">Guardar</button>
        <button type="button" className="btn btn-outline" onClick={onDone}>Cerrar</button>
      </div>
    </form>
  );
}

function Dashboard({ displayName, onDisplayNameChange }) {
  const [section, setSection] = useState('blog'); // 'blog' | 'portfolio' | 'files' | 'guides'
  const [panel, setPanel] = useState(null); // null | 'password' | 'name'

  async function handleLogout() {
    await logout();
    window.location.reload();
  }

  return (
    <div className="container" style={{ paddingTop: 60, paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Panel de Administración</h1>
          {displayName && <p style={{ margin: 0 }}>Sesión activa como <strong>{displayName}</strong></p>}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => setPanel(panel === 'name' ? null : 'name')}>Cambiar Nombre</button>
          <button className="btn btn-outline" onClick={() => setPanel(panel === 'password' ? null : 'password')}>Cambiar Contraseña</button>
          <button className="btn btn-outline" onClick={handleLogout}>Salir</button>
        </div>
      </div>

      {panel === 'password' && <ChangePasswordForm onDone={() => setPanel(null)} />}
      {panel === 'name' && (
        <ChangeNameForm
          current={displayName}
          onDone={() => setPanel(null)}
          onChanged={onDisplayNameChange}
        />
      )}

      <div className="category-filters" style={{ marginTop: 32 }}>
        <button
          type="button"
          className={`category-filter${section === 'blog' ? ' is-active' : ''}`}
          onClick={() => setSection('blog')}
        >
          Blog
        </button>
        <button
          type="button"
          className={`category-filter${section === 'portfolio' ? ' is-active' : ''}`}
          onClick={() => setSection('portfolio')}
        >
          Portafolio
        </button>
        <button
          type="button"
          className={`category-filter${section === 'files' ? ' is-active' : ''}`}
          onClick={() => setSection('files')}
        >
          Archivos
        </button>
        <button
          type="button"
          className={`category-filter${section === 'guides' ? ' is-active' : ''}`}
          onClick={() => setSection('guides')}
        >
          Guías
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        {section === 'blog' && <BlogPanel displayName={displayName} />}
        {section === 'portfolio' && <PortfolioPanel />}
        {section === 'files' && <FilesPanel />}
        {section === 'guides' && <GuidesPanel />}
      </div>
    </div>
  );
}

export default function Admin() {
  useDocumentTitle('Admin | Messtix');
  const [loggedIn, setLoggedIn] = useState(null);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    getSession()
      .then((res) => {
        setLoggedIn(res.loggedIn);
        setDisplayName(res.displayName || '');
      })
      .catch(() => setLoggedIn(false));
  }, []);

  if (loggedIn === null) {
    return (
      <div className="container" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <p>Cargando…</p>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <LoginForm
        onLoggedIn={() => {
          getSession().then((res) => {
            setLoggedIn(res.loggedIn);
            setDisplayName(res.displayName || '');
          });
        }}
      />
    );
  }

  return <Dashboard displayName={displayName} onDisplayNameChange={setDisplayName} />;
}
