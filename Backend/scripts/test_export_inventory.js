const http = require('http');
const jwt = require('jsonwebtoken');

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

function testExport(format, tipoItem) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: 'localhost',
        port: 3000,
        path: `/api/v1/reports/export/${format}?type=inventory&tipoItem=${tipoItem}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        let size = 0;
        res.on('data', (c) => (size += c.length));
        res.on('end', () => {
          resolve({ status: res.statusCode, size, contentType: res.headers['content-type'] });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('Testing Excel export for productos...');
  const xlsxProd = await testExport('excel', 'productos');
  console.log('Excel productos:', xlsxProd);

  console.log('Testing Excel export for servicios...');
  const xlsxSrv = await testExport('excel', 'servicios');
  console.log('Excel servicios:', xlsxSrv);

  console.log('Testing PDF export for productos...');
  const pdfProd = await testExport('pdf', 'productos');
  console.log('PDF productos:', pdfProd);

  console.log('Testing PDF export for servicios...');
  const pdfSrv = await testExport('pdf', 'servicios');
  console.log('PDF servicios:', pdfSrv);
}

run().catch(console.error);
