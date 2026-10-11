import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, '')
  : '';

// Automatically prepend backend URL (if configured), attach Bearer token to all /api/ requests,
// and safely intercept responses to catch HTML / non-JSON responses before throwing cryptic syntax errors
const nativeFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  let targetUrl = url;
  if (typeof url === 'string' && url.startsWith('/api') && API_BASE) {
    if (API_BASE.endsWith('/api')) {
      targetUrl = `${API_BASE}${url.slice(4)}`;
    } else {
      targetUrl = `${API_BASE}${url}`;
    }
  }

  const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
  const isApiRequest = typeof targetUrl === 'string' && (targetUrl.startsWith('/api') || (API_BASE && targetUrl.startsWith(API_BASE)));

  const opts = { ...options };
  if (token && isApiRequest) {
    if (!opts.headers) {
      opts.headers = {};
    }
    if (opts.headers instanceof Headers) {
      if (!opts.headers.has('Authorization')) {
        opts.headers.set('Authorization', `Bearer ${token}`);
      }
    } else if (Array.isArray(opts.headers)) {
      if (!opts.headers.some(([k]) => k.toLowerCase() === 'authorization')) {
        opts.headers.push(['Authorization', `Bearer ${token}`]);
      }
    } else {
      if (!opts.headers.Authorization && !opts.headers.authorization) {
        opts.headers = {
          ...opts.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }
  }

  const res = await nativeFetch(targetUrl, opts);

  if (res.status === 401 || res.headers.get('x-session-status') === 'expired') {
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token');
  }

  // Intercept res.json() safely so HTML error pages don't trigger "Unexpected token '<'"
  const originalJson = res.json.bind(res);
  res.json = async () => {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      let text = '';
      try {
        text = await res.text();
      } catch {
        text = '';
      }
      const trimmed = (text || '').trim();
      if (trimmed.startsWith('<') || contentType.includes('text/html')) {
        const titleMatch = trimmed.match(/<title>([^<]*)<\/title>/i);
        const h1Match = trimmed.match(/<h1>([^<]*)<\/h1>/i);
        const title = (titleMatch && titleMatch[1]) || (h1Match && h1Match[1]) || '';
        throw new Error(
          `Server returned an HTML page (${res.status} ${res.statusText}${title ? ': ' + title.trim() : ''}) instead of JSON. Expected JSON from backend.`
        );
      }
      if (!trimmed) {
        return {};
      }
      try {
        return JSON.parse(trimmed);
      } catch {
        throw new Error(
          `Server returned non-JSON response (${res.status} ${res.statusText}): "${trimmed.slice(0, 100)}"`
        );
      }
    }
    return originalJson();
  };

  return res;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
