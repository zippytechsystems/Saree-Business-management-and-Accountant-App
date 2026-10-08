/**
 * Unified API Client for Business Management App
 * Integrates directly with Hostinger MySQL backend API.
 */

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, '')
  : '';

export function getAuthToken() {
  return sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token') || null;
}

export function setAuthToken(token, persist = false) {
  if (persist) {
    localStorage.setItem('auth_token', token);
  }
  sessionStorage.setItem('auth_token', token);
}

export function removeAuthToken() {
  sessionStorage.removeItem('auth_token');
  localStorage.removeItem('auth_token');
}

export async function apiRequest(endpoint, options = {}) {
  let url = endpoint || '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (!url.startsWith('/api')) {
      url = `/api${url.startsWith('/') ? '' : '/'}${url}`;
    }
    if (API_BASE) {
      if (API_BASE.endsWith('/api') && url.startsWith('/api')) {
        url = `${API_BASE}${url.slice(4)}`;
      } else {
        url = `${API_BASE}${url}`;
      }
    }
  }

  const token = getAuthToken();
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (parseErr) {
      throw new Error(`Failed to parse JSON response from ${url}: ${parseErr.message}`);
    }
  } else {
    const rawText = await response.text();
    const trimmed = (rawText || '').trim();
    if (trimmed.startsWith('<') || contentType.includes('text/html')) {
      const titleMatch = trimmed.match(/<title>([^<]*)<\/title>/i);
      const h1Match = trimmed.match(/<h1>([^<]*)<\/h1>/i);
      const title = (titleMatch && titleMatch[1]) || (h1Match && h1Match[1]) || '';
      const err = new Error(
        `Server returned an HTML response (${response.status} ${response.statusText}${title ? ': ' + title.trim() : ''}) instead of JSON. Expected JSON from ${url}.`
      );
      err.status = response.status;
      err.isHtml = true;
      throw err;
    }

    if (!trimmed) {
      data = {};
    } else {
      try {
        data = JSON.parse(trimmed);
      } catch {
        const err = new Error(
          `Server returned non-JSON response (${response.status} ${response.statusText}): "${trimmed.slice(0, 100)}"`
        );
        err.status = response.status;
        throw err;
      }
    }
  }

  if (!response.ok) {
    const errorMsg =
      (typeof data === 'object' && data !== null && (data.error || data.message)) ||
      `HTTP Error ${response.status}: ${response.statusText}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export function apiGet(endpoint, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'GET' });
}

export function apiPost(endpoint, body, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'POST', body });
}

export function apiPut(endpoint, body, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'PUT', body });
}

export function apiPatch(endpoint, body, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'PATCH', body });
}

export function apiDelete(endpoint, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'DELETE' });
}

export default {
  apiRequest,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
};
