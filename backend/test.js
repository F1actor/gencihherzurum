require('dotenv').config();
const { query } = require('./config/database');
const jwt = require('jsonwebtoken');

async function run() {
  const user = await query.get("SELECT * FROM users WHERE role='SUPER_ADMIN' LIMIT 1");
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'gizli_anahtar');
  
  const res = await fetch('http://127.0.0.1:5000/api/reports/annual-report?unit=T%C3%BCm%20Sistem', {
    headers: { Authorization: 'Bearer ' + token }
  });
  
  console.log('STATUS:', res.status);
  console.log('BODY:', await res.text());
}

run().catch(console.error);
