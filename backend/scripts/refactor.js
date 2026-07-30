const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const controllersDir = path.join(baseDir, 'controllers');
const routesDir = path.join(baseDir, 'routes');
const srcDir = path.join(baseDir, 'src');
const modulesDir = path.join(srcDir, 'modules');

if (!fs.existsSync(srcDir)) fs.mkdirSync(srcDir);
if (!fs.existsSync(modulesDir)) fs.mkdirSync(modulesDir);

const mapping = {
  'admin': { controller: 'adminController.js', route: 'admin.js' },
  'auth': { controller: 'authController.js', route: 'auth.js' },
  'events': { controller: 'eventController.js', route: 'events.js' },
  'reports': { controller: 'reportController.js', route: 'reports.js' },
  'llm': { controller: 'llmController.js', route: 'llm.js' },
  'muhabbet': { controller: 'muhabbetController.js', route: 'muhabbet.js' },
  'system': { controller: 'announcementController.js', route: 'system.js' }
};

function updateImports(filePath, depth) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  
  const prefix = '../'.repeat(depth);
  
  content = content.replace(/\.\.\/config\//g, prefix + 'config/');
  content = content.replace(/\.\.\/middleware\//g, prefix + 'middleware/');
  content = content.replace(/\.\.\/services\//g, prefix + 'services/');
  content = content.replace(/\.\.\/controllers\//g, './'); 

  if (filePath.endsWith('systemRoutes.js')) {
    content = content.replace(/announcementController/g, 'systemController');
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

for (const [moduleName, files] of Object.entries(mapping)) {
  const modPath = path.join(modulesDir, moduleName);
  if (!fs.existsSync(modPath)) fs.mkdirSync(modPath);

  const ctrlSource = path.join(controllersDir, files.controller);
  const routeSource = path.join(routesDir, files.route);

  const newCtrlName = moduleName === 'system' ? 'systemController.js' : files.controller;
  const newRouteName = moduleName + 'Routes.js';

  const ctrlDest = path.join(modPath, newCtrlName);
  const routeDest = path.join(modPath, newRouteName);

  if (fs.existsSync(ctrlSource)) {
    fs.copyFileSync(ctrlSource, ctrlDest);
    updateImports(ctrlDest, 3);
  }

  if (fs.existsSync(routeSource)) {
    fs.copyFileSync(routeSource, routeDest);
    updateImports(routeDest, 3);
  }
}

const serverPath = path.join(baseDir, 'server.js');
if (fs.existsSync(serverPath)) {
  let content = fs.readFileSync(serverPath, 'utf8');
  content = content.replace(/\.\/routes\/auth/g, './src/modules/auth/authRoutes');
  content = content.replace(/\.\/routes\/admin/g, './src/modules/admin/adminRoutes');
  content = content.replace(/\.\/routes\/events/g, './src/modules/events/eventsRoutes');
  content = content.replace(/\.\/routes\/reports/g, './src/modules/reports/reportsRoutes');
  content = content.replace(/\.\/routes\/system/g, './src/modules/system/systemRoutes');
  content = content.replace(/\.\/routes\/llm/g, './src/modules/llm/llmRoutes');
  content = content.replace(/\.\/routes\/muhabbet/g, './src/modules/muhabbet/muhabbetRoutes');
  fs.writeFileSync(serverPath, content, 'utf8');
}

console.log('Refactoring completed successfully.');
