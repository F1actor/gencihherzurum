require('dotenv').config();
const { query, dbType } = require('./config/database');

async function test() {
  try {
    const isApplicationsOpen = true;

    await query.run("DELETE FROM muhabbet_settings WHERE settingKey = 'isApplicationsOpen'");
    
    const insertSql = dbType === 'postgres'
      ? `INSERT INTO muhabbet_settings (settingKey, settingValue) VALUES ('isApplicationsOpen', ?) RETURNING id`
      : `INSERT INTO muhabbet_settings (settingKey, settingValue) VALUES ('isApplicationsOpen', ?)`;
      
    await query.run(insertSql, [isApplicationsOpen ? 'true' : 'false']);

    console.log('Update success');
  } catch (err) {
    console.error('Update Error:', err);
  }
  process.exit(0);
}
test();
