/**
 * Hostinger LiteSpeed / Phusion Passenger CommonJS Startup Loader
 * Resolves ERR_REQUIRE_ESM when lsnode.js loads type="module" Express apps
 */
(async () => {
  try {
    const appModule = await import('./backend/server.js');
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = appModule.default || appModule;
    }
  } catch (err) {
    console.error('[Hostinger Loader Error]:', err);
    process.exit(1);
  }
})();
