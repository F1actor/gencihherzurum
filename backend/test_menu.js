require('dotenv').config();
const jwt = require('jsonwebtoken');
const { query } = require('./config/database');

async function test() {
  try {
    const user = await query.get("SELECT * FROM users WHERE email = 'i.sinanakbulut1177@gmail.com'");
    if (!user) return console.log("No users!");
    
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'gencihh_erzurum_teakip_gizli_anahtar_2026', { expiresIn: '1h' });

    console.log('Sending PUT /api/muhabbet/settings with token...');
    const res2 = await fetch('http://localhost:5000/api/muhabbet/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ isApplicationsOpen: false })
    });
    const text2 = await res2.text();
    console.log('Settings PUT Status:', res2.status, text2);

    console.log('Sending POST /api/muhabbet/menus with token...');
    const res = await fetch('http://localhost:5000/api/muhabbet/menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        menuDate: '2026-07-20',
        foodItems: 'Test Food',
        activities: 'Test Activity'
      })
    });
    const text = await res.text();
    console.log('Menu Add Status:', res.status, text);

    process.exit(0);
  } catch (err) {
    console.error(err);
  }
}
test();
