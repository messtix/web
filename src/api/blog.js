const BASE = '/blog-api.php';

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

export function listPosts(limit) {
  return request('list', limit ? { params: { limit } } : undefined);
}

export function getPost(slug) {
  return request('get', { params: { slug } });
}

export function getSession() {
  return request('session');
}

export function login(username, password) {
  const body = new FormData();
  body.set('username', username);
  body.set('password', password);
  return request('login', { method: 'POST', body });
}

export function logout() {
  return request('logout', { method: 'POST' });
}

export function changePassword(current, next) {
  const body = new FormData();
  body.set('current', current);
  body.set('new', next);
  return request('change_password', { method: 'POST', body });
}

export function updateDisplayName(name) {
  const body = new FormData();
  body.set('display_name', name);
  return request('update_display_name', { method: 'POST', body });
}

export function adminListPosts() {
  return request('admin_list');
}

export function adminGetPost(id) {
  return request('admin_get', { params: { id } });
}

export function savePost(post) {
  const body = new FormData();
  if (post.id) body.set('id', post.id);
  body.set('title', post.title);
  body.set('excerpt', post.excerpt);
  body.set('content', post.content);
  body.set('category', post.category);
  body.set('cover_image', post.cover_image || '');
  body.set('author', post.author || '');
  body.set('published', post.published ? 'true' : 'false');
  return request('save', { method: 'POST', body });
}

export function deletePost(id) {
  const body = new FormData();
  body.set('id', id);
  return request('delete', { method: 'POST', body });
}

export function uploadImage(file) {
  const body = new FormData();
  body.set('image', file);
  return request('upload_image', { method: 'POST', body });
}
