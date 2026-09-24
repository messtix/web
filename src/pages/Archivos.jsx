import { useEffect, useState } from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Icon from '../components/Icon';
import { checkSession, participantLogin, participantLogout, listResources } from '../api/files';

const TYPE_ICON = { folder: 'folder', link: 'link', file: 'file' };
const TYPE_LABEL = { folder: 'Carpeta', link: 'Enlace', file: 'Archivo' };

function LoginGate({ onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await participantLogin(username, password);
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
    <div className="container" style={{ maxWidth: 420, paddingTop: 90, paddingBottom: 90 }}>
      <span className="icon-badge icon-badge-outline"><Icon name="lock" /></span>
      <span className="eyebrow">Acceso Restringido</span>
      <h1>Directorio de Archivos</h1>
      <p className="section-lead">Ingresa con las credenciales que te fueron compartidas.</p>
      <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
        <div>
          <label htmlFor="p-username">Usuario</label>
          <input
            id="p-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="p-password">Contraseña</label>
          <input
            id="p-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: 'var(--vino-text)' }}>{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
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

function ResourceList({ onLogout }) {
  const [resources, setResources] = useState(null);
  const [error, setError] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState(null);

  useEffect(() => {
    listResources()
      .then((res) => setResources(res.resources))
      .catch(() => setError('No se pudo cargar el directorio. Intenta de nuevo.'));
  }, []);

  async function handleLogout() {
    await participantLogout();
    onLogout();
  }

  const items = (resources || []).filter((r) => (r.parent_id || null) === currentFolderId);
  const breadcrumb = currentFolderId ? folderPath(currentFolderId, resources || []) : [];

  return (
    <div className="container" style={{ paddingTop: 60, paddingBottom: 90 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="eyebrow">Recursos</span>
          <h1>Directorio de Archivos</h1>
          <p className="section-lead">Carpetas, enlaces y materiales disponibles para ti.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={handleLogout}>
          <Icon name="logout" /> Salir
        </button>
      </div>

      {resources !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 20, fontSize: '.9rem' }}>
          <button type="button" className="btn-ghost" onClick={() => setCurrentFolderId(null)}>Raíz</button>
          {breadcrumb.map((f) => (
            <span key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>/</span>
              <button type="button" className="btn-ghost" onClick={() => setCurrentFolderId(f.id)}>{f.title}</button>
            </span>
          ))}
        </div>
      )}

      {error && <p style={{ color: 'var(--vino-text)', marginTop: 24 }}>{error}</p>}
      {!error && resources === null && <p style={{ marginTop: 32 }}>Cargando…</p>}
      {!error && resources !== null && items.length === 0 && (
        <p style={{ marginTop: 32 }}>Esta carpeta todavía no tiene archivos.</p>
      )}

      {!error && resources !== null && items.length > 0 && (
        <div className="grid grid-3" style={{ marginTop: 40 }}>
          {items.map((r) =>
            r.type === 'folder' ? (
              <button
                key={r.id}
                type="button"
                className="skill-card resource-card"
                onClick={() => setCurrentFolderId(r.id)}
              >
                <span className="icon-badge icon-badge-outline">
                  <Icon name="folder" />
                </span>
                <span>
                  <strong style={{ display: 'block' }}>{r.title}</strong>
                  <span className="resource-type">Carpeta</span>
                  {r.description && <span className="resource-desc">{r.description}</span>}
                </span>
              </button>
            ) : (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="skill-card resource-card"
              >
                <span className="icon-badge icon-badge-outline">
                  <Icon name={TYPE_ICON[r.type] || 'link'} />
                </span>
                <span>
                  <strong style={{ display: 'block' }}>{r.title}</strong>
                  <span className="resource-type">{TYPE_LABEL[r.type] || 'Enlace'}</span>
                  {r.description && <span className="resource-desc">{r.description}</span>}
                </span>
              </a>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function Archivos() {
  useDocumentTitle('Directorio de Archivos | Messtix');
  const [loggedIn, setLoggedIn] = useState(null);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, []);

  useEffect(() => {
    checkSession()
      .then((res) => setLoggedIn(res.loggedIn))
      .catch(() => setLoggedIn(false));
  }, []);

  if (loggedIn === null) {
    return (
      <div className="container" style={{ paddingTop: 90, paddingBottom: 90 }}>
        <p>Cargando…</p>
      </div>
    );
  }

  if (!loggedIn) {
    return <LoginGate onLoggedIn={() => setLoggedIn(true)} />;
  }

  return <ResourceList onLogout={() => setLoggedIn(false)} />;
}
