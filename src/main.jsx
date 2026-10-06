import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, '')
  : '';

// Automatically prepend backend URL (if configured) and attach Bearer token to all /api/ requests
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

  if (token && isApiRequest) {
    const opts = { ...options };
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
    const res = await nativeFetch(targetUrl, opts);
    if (res.status === 401 || res.headers.get('x-session-status') === 'expired') {
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('auth_token');
    }
    return res;
  }
  const res = await nativeFetch(targetUrl, options);
  if (res.status === 401) {
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token');
  }
  return res;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
