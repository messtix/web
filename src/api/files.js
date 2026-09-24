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

export function checkSession() {
  return request('check');
}

export function participantLogin(username, password) {
  const body = new FormData();
  body.set('username', username);
  body.set('password', password);
  return request('participant_login', { method: 'POST', body });
}

export function participantLogout() {
  return request('participant_logout', { method: 'POST', body: new FormData() });
}

export function listResources() {
  return request('list');
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

export function uploadGuide(title, file) {
  const body = new FormData();
  body.set('title', title);
  body.set('file', file);
  return request('guides_upload', { method: 'POST', body });
}

export function deleteGuide(id) {
  const body = new FormData();
  body.set('id', id);
  return request('guides_delete', { method: 'POST', body });
}
