const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:650650@localhost:5432/gencihh_db' });
pool.query('SELECT 1').then(() => {
  console.log('OK');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
