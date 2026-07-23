require('dotenv').config();
const { initDatabase } = require('./config/database');

async function run() {
  console.log('Initializing DB with type:', process.env.DB_TYPE);
  await initDatabase();
  console.log('DB Initialized.');
  process.exit(0);
}

run();
