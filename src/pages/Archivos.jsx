import { useEffect, useState } from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Icon from '../components/Icon';
import { login, listResources, unlockFolder, lockAllFolders } from '../api/files';

const TYPE_ICON = { folder: 'folder', link: 'link', file: 'file' };
const TYPE_LABEL = { folder: 'Carpeta', link: 'Enlace', file: 'Archivo' };

function folderPath(id, cache) {
  const path = [];
  let current = id;
  while (current) {
    const folder = cache[current];
    if (!folder) break;
    path.unshift(folder);
    current = folder.parent_id;
  }
  return path;
}

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

function UnlockForm({ folder, onUnlocked }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await unlockFolder(folder.id, username, password);
      onUnlocked();
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
    <div style={{ maxWidth: 420, marginTop: 24 }}>
      <span className="icon-badge icon-badge-outline"><Icon name="lock" /></span>
      <h3 style={{ marginTop: 12 }}>{folder.title}</h3>
      <p className="section-lead">Ingresa el usuario y la contraseña de esta carpeta.</p>
      <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
        <div>
          <label htmlFor="f-username">Usuario</label>
          <input
            id="f-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="f-password">Contraseña</label>
          <input
            id="f-password"
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

function ResourceBrowser({ onLogout }) {
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folderCache, setFolderCache] = useState({});
  const [items, setItems] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ok | locked | error
  const [lockedFolder, setLockedFolder] = useState(null);

  function load(folderId) {
    setStatus('loading');
    listResources(folderId || undefined)
      .then((res) => {
        setItems(res.resources);
        setStatus('ok');
        setFolderCache((cache) => {
          const next = { ...cache };
          res.resources.forEach((r) => {
            if (r.type === 'folder') next[r.id] = r;
          });
          return next;
        });
      })
      .catch((err) => {
        if (err.message === 'locked') {
          const folder = folderCache[folderId];
          setLockedFolder(folder || { id: folderId, title: 'Carpeta' });
          setStatus('locked');
        } else {
          setStatus('error');
        }
      });
  }

  useEffect(() => {
    load(currentFolderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId]);

  function enterFolder(folder) {
    setFolderCache((cache) => ({ ...cache, [folder.id]: folder }));
    setCurrentFolderId(folder.id);
  }

  async function handleLogout() {
    await lockAllFolders();
    onLogout();
  }

  const breadcrumb = currentFolderId ? folderPath(currentFolderId, folderCache) : [];

  return (
    <div className="container" style={{ paddingTop: 60, paddingBottom: 90 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="eyebrow">Recursos</span>
          <h1>Directorio de Archivos</h1>
          <p className="section-lead">Carpetas, enlaces y materiales disponibles para ti.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={handleLogout}>
          <Icon name="logout" /> Cerrar Sesión
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 20, fontSize: '.9rem' }}>
        <button type="button" className="btn-ghost" onClick={() => setCurrentFolderId(null)}>Raíz</button>
        {breadcrumb.map((f) => (
          <span key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>/</span>
            <button type="button" className="btn-ghost" onClick={() => setCurrentFolderId(f.id)}>{f.title}</button>
          </span>
        ))}
      </div>

      {status === 'loading' && <p style={{ marginTop: 32 }}>Cargando…</p>}
      {status === 'error' && (
        <p style={{ color: 'var(--vino-text)', marginTop: 24 }}>
          No se pudo cargar el directorio. Intenta de nuevo.
        </p>
      )}
      {status === 'locked' && lockedFolder && (
        <UnlockForm folder={lockedFolder} onUnlocked={() => load(currentFolderId)} />
      )}

      {status === 'ok' && items !== null && items.length === 0 && (
        <p style={{ marginTop: 32 }}>
          {currentFolderId ? 'Esta carpeta todavía no tiene archivos.' : 'Todavía no tienes carpetas disponibles.'}
        </p>
      )}

      {status === 'ok' && items !== null && items.length > 0 && (
        <div className="grid grid-3" style={{ marginTop: 40 }}>
          {items.map((r) =>
            r.type === 'folder' ? (
              <button
                key={r.id}
                type="button"
                className="skill-card resource-card"
                onClick={() => enterFolder(r)}
              >
                <span className="icon-badge icon-badge-outline">
                  <Icon name={r.has_password ? 'lock' : 'folder'} />
                </span>
                <span>
                  <strong style={{ display: 'block' }}>{r.title}</strong>
                  <span className="resource-type">{r.has_password ? 'Carpeta protegida' : 'Carpeta'}</span>
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
  const [loggedIn, setLoggedIn] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, []);

  if (!loggedIn) {
    return <LoginGate onLoggedIn={() => setLoggedIn(true)} />;
  }

  return (
    <ResourceBrowser
      key={sessionKey}
      onLogout={() => {
        setLoggedIn(false);
        setSessionKey((k) => k + 1);
      }}
    />
  );
}
