const http = require('http');
const jwt = require('jsonwebtoken');

// Kaul user ID 5, email kaul@gmail.com
const token = jwt.sign(
  {
    sub: 5,
    email: 'kaul@gmail.com',
    nombre: 'Kaul',
    apellido: 'Admin',
    rol: 'ADMINISTRADOR',
  },
  'no utilizar en producción',
  { expiresIn: '1h' }
);

function fetchJson(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: 'localhost',
        port: 3000,
        path: urlPath,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('--- TEST 1: PRODUCTOS FÍSICOS ---');
  const prodRes = await fetchJson('/api/v1/reports/inventory?tipoItem=productos&page=1&limit=10');
  console.log('Status:', prodRes.status);
  console.log('KPIs:', prodRes.data?.kpis);
  console.log('Total Productos:', prodRes.data?.total);
  console.log('First 3 items:', prodRes.data?.data?.slice(0, 3));
  console.log('Disclosure:', prodRes.data?.disclosure);

  console.log('\n--- TEST 2: SERVICIOS TÉCNICOS ---');
  const srvRes = await fetchJson('/api/v1/reports/inventory?tipoItem=servicios&page=1&limit=10');
  console.log('Status:', srvRes.status);
  console.log('KPIs:', srvRes.data?.kpis);
  console.log('Total Servicios:', srvRes.data?.total);
  console.log('First 3 items:', srvRes.data?.data?.slice(0, 3));
  console.log('Disclosure:', srvRes.data?.disclosure);
}

run().catch(console.error);
