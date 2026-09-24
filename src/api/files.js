const BASE = '/files-api.php';

async function request(action, { method = 'GET', params, body } = {}) {
  const url = new URL(BASE, window.location.origin);
  url.searchParams.set('action', action);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    method,
    body,
    credentials: 'same-origin',
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('bad_response');
  }

  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'request_failed');
  }
  return data;
}

export function listResources(folderId) {
  return request('list', folderId ? { params: { folder_id: folderId } } : undefined);
}

export function login(username, password) {
  const body = new FormData();
  body.set('username', username);
  body.set('password', password);
  return request('login', { method: 'POST', body });
}

export function unlockFolder(folderId, username, password) {
  const body = new FormData();
  body.set('folder_id', folderId);
  body.set('username', username);
  body.set('password', password);
  return request('unlock_folder', { method: 'POST', body });
}

export function lockAllFolders() {
  return request('lock_all', { method: 'POST', body: new FormData() });
}

export function adminListResources() {
  return request('admin_list');
}

export function saveResource(resource) {
  const body = new FormData();
  if (resource.id) body.set('id', resource.id);
  body.set('title', resource.title);
  body.set('description', resource.description || '');
  body.set('type', resource.type);
  body.set('url', resource.url || '');
  body.set('parent_id', resource.parent_id || '');
  body.set('username', resource.username || '');
  body.set('password', resource.password || '');
  return request('save', { method: 'POST', body });
}

export function deleteResource(id) {
  const body = new FormData();
  body.set('id', id);
  return request('delete', { method: 'POST', body });
}

export function reorderResource(id, direction) {
  const body = new FormData();
  body.set('id', id);
  body.set('direction', direction);
  return request('reorder', { method: 'POST', body });
}

export function uploadResourceFile(file) {
  const body = new FormData();
  body.set('file', file);
  return request('upload', { method: 'POST', body });
}

export function adminListGuides() {
  return request('guides_list');
}

export function uploadGuide(title, slug, file) {
  const body = new FormData();
  body.set('title', title);
  body.set('slug', slug || '');
  body.set('file', file);
  return request('guides_upload', { method: 'POST', body });
}

export function updateGuide(id, title, slug) {
  const body = new FormData();
  body.set('id', id);
  body.set('title', title);
  body.set('slug', slug || '');
  return request('guides_update', { method: 'POST', body });
}

export function deleteGuide(id) {
  const body = new FormData();
  body.set('id', id);
  return request('guides_delete', { method: 'POST', body });
}
