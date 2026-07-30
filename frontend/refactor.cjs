const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const featuresDir = path.join(srcDir, 'features');
const sharedDir = path.join(srcDir, 'shared');
const sharedUiDir = path.join(sharedDir, 'ui');
const sharedContextDir = path.join(sharedDir, 'context');

// Create directories
[featuresDir, sharedDir, sharedUiDir, sharedContextDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Define target features for files
const fileMappings = {
  // Auth Feature
  'Login.jsx': 'auth',
  'Register.jsx': 'auth',
  'VerifyOtp.jsx': 'auth',
  'AuthLayout.jsx': 'auth',

  // Dashboard Feature
  'AdminDashboard.jsx': 'dashboard',
  'UnitDashboard.jsx': 'dashboard',
  'SystemSettingsPanel.jsx': 'dashboard',

  // Muhabbet Feature
  'MuhabbetApply.jsx': 'muhabbet',
  'MuhabbetPortal.jsx': 'muhabbet',
  'MuhabbetTeacherDashboard.jsx': 'muhabbet',
  'MuhabbetAdminPanel.jsx': 'muhabbet',

  // Public Feature
  'PublicHome.jsx': 'public',

  // Reports Feature
  'AnnualReportPanel.jsx': 'reports',
  'MonthlyReportPanel.jsx': 'reports',
  'PerformancePanel.jsx': 'reports',
  'MonthlyGoalsPanel.jsx': 'reports',

  // Events Feature
  'EventMediaGallery.jsx': 'events'
};

// Create feature directories
Object.values(fileMappings).forEach(feat => {
  const d = path.join(featuresDir, feat);
  if (!fs.existsSync(d)) fs.mkdirSync(d);
});

const fileLocations = {};

// Helper to find file in pages or components
function findAndMoveFile(fileName, featureName) {
  const pagesPath = path.join(srcDir, 'pages', fileName);
  const compPath = path.join(srcDir, 'components', fileName);
  
  const destDir = path.join(featuresDir, featureName);
  const destPath = path.join(destDir, fileName);

  if (fs.existsSync(pagesPath)) {
    fs.copyFileSync(pagesPath, destPath);
    fileLocations[fileName] = `../../features/${featureName}/${fileName}`;
  } else if (fs.existsSync(compPath)) {
    fs.copyFileSync(compPath, destPath);
    fileLocations[fileName] = `../../features/${featureName}/${fileName}`;
  }
}

// Move mapped files
Object.entries(fileMappings).forEach(([file, feature]) => {
  findAndMoveFile(file, feature);
});

// Move shared UI
const aiChatWidgetSrc = path.join(srcDir, 'components', 'AIChatWidget.jsx');
if (fs.existsSync(aiChatWidgetSrc)) {
  fs.copyFileSync(aiChatWidgetSrc, path.join(sharedUiDir, 'AIChatWidget.jsx'));
  fileLocations['AIChatWidget.jsx'] = `../../shared/ui/AIChatWidget.jsx`;
}

// Move contexts
const contextSrc = path.join(srcDir, 'context');
if (fs.existsSync(contextSrc)) {
  fs.readdirSync(contextSrc).forEach(file => {
    fs.copyFileSync(path.join(contextSrc, file), path.join(sharedContextDir, file));
    fileLocations[file] = `../../shared/context/${file}`;
  });
}

// Update App.jsx and main.jsx
function updateFileContent(filePath, isRoot = false) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace component and page imports based on their new locations
  Object.entries(fileMappings).forEach(([file, feature]) => {
    const baseName = file.replace('.jsx', '');
    const regex1 = new RegExp(`['"].*\\/pages\\/${baseName}['"]`, 'g');
    const regex2 = new RegExp(`['"].*\\/components\\/${baseName}['"]`, 'g');
    const regex3 = new RegExp(`['"]\\.\\/${baseName}['"]`, 'g'); // If imported from same dir
    
    // Determine relative path based on if it's from App.jsx or from a feature file
    const relPath = isRoot ? `./features/${feature}/${baseName}` : `../../features/${feature}/${baseName}`;
    
    content = content.replace(regex1, `'${relPath}'`);
    content = content.replace(regex2, `'${relPath}'`);
  });

  // Replace AIChatWidget
  const aiRel = isRoot ? './shared/ui/AIChatWidget' : '../../shared/ui/AIChatWidget';
  content = content.replace(/['"].*\/components\/AIChatWidget['"]/g, `'${aiRel}'`);

  // Replace Contexts
  const contextFiles = ['AuthContext', 'NotificationContext'];
  contextFiles.forEach(ctx => {
    const ctxRel = isRoot ? `./shared/context/${ctx}` : `../../shared/context/${ctx}`;
    content = content.replace(new RegExp(`['"].*\\/context\\/${ctx}['"]`, 'g'), `'${ctxRel}'`);
  });

  // Replace Assets (logo.jpg etc)
  const assetsRel = isRoot ? './assets' : '../../assets';
  content = content.replace(/['"]\.\.\/assets\//g, `'${assetsRel}/`);
  content = content.replace(/['"]\.\/assets\//g, `'${assetsRel}/`);

  fs.writeFileSync(filePath, content, 'utf8');
}

// Update App.jsx
updateFileContent(path.join(srcDir, 'App.jsx'), true);

// Update all feature files
Object.entries(fileMappings).forEach(([file, feature]) => {
  const destPath = path.join(featuresDir, feature, file);
  updateFileContent(destPath, false);
});

// Update Shared Contexts
const ctxDir = path.join(sharedContextDir);
if (fs.existsSync(ctxDir)) {
  fs.readdirSync(ctxDir).forEach(file => {
    updateFileContent(path.join(ctxDir, file), false);
  });
}

// Update Shared UI
if (fs.existsSync(path.join(sharedUiDir, 'AIChatWidget.jsx'))) {
  updateFileContent(path.join(sharedUiDir, 'AIChatWidget.jsx'), false);
}

console.log('Frontend refactoring completed successfully.');
