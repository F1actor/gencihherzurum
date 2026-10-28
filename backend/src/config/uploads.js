const path = require('path');

// In production set UPLOAD_DIR to a directory outside the deployment release.
// Example: /home/CPANEL_USER/app-data/gencihh-uploads
const uploadDirectory = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, '..', 'modules', 'uploads')
);

module.exports = { uploadDirectory };
