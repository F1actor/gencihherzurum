require('dotenv').config();
const { query } = require('./config/database');

async function test() {
  const row = await query.get("SELECT settingValue FROM muhabbet_settings WHERE settingKey = 'isApplicationsOpen'");
  console.log("DB value:", row);
  process.exit(0);
}
test();
