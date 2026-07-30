require('dotenv').config();
const { query, dbType } = require('./config/database');

async function test() {
  try {
    console.log('DB Type:', dbType);
    console.log('Testing Menu Insert...');
    const insertSql = dbType === 'postgres'
      ? `INSERT INTO muhabbet_menus (menuDate, foodItems, activities) VALUES ('2026-07-20', 'Test', 'Test') RETURNING id`
      : `INSERT INTO muhabbet_menus (menuDate, foodItems, activities) VALUES ('2026-07-20', 'Test', 'Test')`;
      
    await query.run(insertSql);
    console.log('Menu added successfully.');
  } catch (err) {
    console.error('Menu Insert Error:', err);
  }

  try {
    console.log('Testing Settings Insert...');
    const insertSql2 = dbType === 'postgres'
      ? `INSERT INTO muhabbet_settings (settingKey, settingValue) VALUES ('isApplicationsOpen', 'false') RETURNING id`
      : `INSERT INTO muhabbet_settings (settingKey, settingValue) VALUES ('isApplicationsOpen', 'false')`;
      
    await query.run(insertSql2);
    console.log('Settings added successfully.');
  } catch (err) {
    console.error('Settings Insert Error:', err);
  }
  process.exit(0);
}
test();
