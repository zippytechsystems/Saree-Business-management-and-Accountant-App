import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Automatically attach Bearer token to all /api/ requests
const nativeFetch = window.fetch;
window.fetch = (url, options = {}) => {
  const token = localStorage.getItem('auth_token');
  if (token && typeof url === 'string' && url.startsWith('/api')) {
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
    return nativeFetch(url, opts);
  }
  return nativeFetch(url, options);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
