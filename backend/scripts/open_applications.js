require('dotenv').config();
const { query, dbType } = require('./config/database');

async function test() {
  try {
    await query.run("DELETE FROM muhabbet_settings WHERE settingKey = 'isApplicationsOpen'");
    const insertSql = dbType === 'postgres'
      ? `INSERT INTO muhabbet_settings (settingKey, settingValue) VALUES ('isApplicationsOpen', 'true') RETURNING id`
      : `INSERT INTO muhabbet_settings (settingKey, settingValue) VALUES ('isApplicationsOpen', 'true')`;
      
    await query.run(insertSql);
    console.log('Opened successfully');
  } catch (err) {
    console.error('Update Error:', err);
  }
  process.exit(0);
}
test();
