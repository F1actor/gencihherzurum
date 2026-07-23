const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/MuhabbetTeacherDashboard.jsx',
  'src/pages/MuhabbetPortal.jsx',
  'src/components/MuhabbetAdminPanel.jsx'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Sadece tırnak içindeki '/api/muhabbet' kısımlarını bul ve değiştir (Backtick veya normal tırnak)
  content = content.replace(/'\/api\/muhabbet/g, '`${import.meta.env.VITE_API_URL}/api/muhabbet');
  content = content.replace(/"\/api\/muhabbet/g, '`${import.meta.env.VITE_API_URL}/api/muhabbet');
  content = content.replace(/`\/api\/muhabbet/g, '`${import.meta.env.VITE_API_URL}/api/muhabbet');

  // Son tırnağı bulup backtick ile değiştirmeyi denemektense basit regex ile yapalım:
  // fetch('/api/muhabbet...') -> fetch(`${import.meta.env.VITE_API_URL}/api/muhabbet...`)
  // Aslında en temizi, yukarıdaki replace sonrasında string'in kapanış tırnağını backtick yapmak
  // Ama daha güvenli olması için regex kullanalım:
  
  // Yeniden okuyalım orijinali
  content = fs.readFileSync(fullPath, 'utf8');
  
  // Önce normal tırnak içindeki tam yolları `${...}` içine al
  content = content.replace(/fetch\(['"]\/api\/muhabbet([^'"]*)['"]/g, 'fetch(`${import.meta.env.VITE_API_URL}/api/muhabbet$1`');
  
  // Backtick içindeki /api/muhabbet kısımları
  content = content.replace(/fetch\(`\/api\/muhabbet/g, 'fetch(`${import.meta.env.VITE_API_URL}/api/muhabbet');
  
  fs.writeFileSync(fullPath, content);
  console.log('Fixed', file);
});
