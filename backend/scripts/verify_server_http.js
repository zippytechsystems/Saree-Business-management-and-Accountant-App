import 'dotenv/config';
import http from 'http';
import app from '../server.js';

async function testHttpEndpoints() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5002, resolve));
  console.log('Test server listening on port 5002');

  try {
    // 1. Health check
    const healthRes = await fetch('http://127.0.0.1:5002/api/health');
    const healthData = await healthRes.json();
    console.log('GET /api/health Status:', healthRes.status);
    console.log('Health Database Info:', healthData.database);

    if (!healthData.database.mysql_connected) {
      throw new Error('Health check did not report MySQL connected!');
    }
    if (healthData.database.mode !== 'hostinger_mysql_authoritative') {
      throw new Error('Health check mode is not hostinger_mysql_authoritative!');
    }

    // 2. Dashboard metrics
    const dashRes = await fetch('http://127.0.0.1:5002/api/calculations/dashboard');
    const dashData = await dashRes.json();
    console.log('GET /api/calculations/dashboard Status:', dashRes.status);
    console.log('Dashboard Data summary:', {
      success: dashData.success,
      today_sales: dashData.data?.today_sales,
      monthly_sales: dashData.data?.monthly_sales,
      current_stock: dashData.data?.current_stock,
    });

    if (!dashData.success) {
      throw new Error('Dashboard endpoint failed!');
    }

    console.log('✓ HTTP Server endpoints operating perfectly with Hostinger MySQL backend!');
  } finally {
    server.close();
  }
}

testHttpEndpoints()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('HTTP test failed:', err);
    process.exit(1);
  });
