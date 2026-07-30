require('dotenv').config();
const { query } = require('./config/database');

async function test() {
  const users = await query.all("SELECT id, fullName, email, role, assignedUnit FROM users");
  console.log(users);
  process.exit(0);
}
test();
