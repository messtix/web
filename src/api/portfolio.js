const BASE = '/portfolio-api.php';

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

export function listProjects(category) {
  return request('list', category ? { params: { category } } : undefined);
}

export function getProject(slug) {
  return request('get', { params: { slug } });
}

export function adminListProjects() {
  return request('admin_list');
}

export function adminGetProject(id) {
  return request('admin_get', { params: { id } });
}

export function saveProject(project) {
  const body = new FormData();
  if (project.id) body.set('id', project.id);
  body.set('name', project.name);
  body.set('client', project.client);
  body.set('company', project.company);
  body.set('url', project.url || '');
  body.set('category', project.category);
  body.set('description', project.description);
  body.set('cover_image', project.cover_image || '');
  body.set('published', project.published ? 'true' : 'false');
  return request('save', { method: 'POST', body });
}

export function deleteProject(id) {
  const body = new FormData();
  body.set('id', id);
  return request('delete', { method: 'POST', body });
}

export function uploadProjectImage(file) {
  const body = new FormData();
  body.set('image', file);
  return request('upload_image', { method: 'POST', body });
}
