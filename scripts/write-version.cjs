const fs = require('fs');
const pkg = require('../package.json');

try {
  // Verify that the 'dist' directory exists, and create it if it does not.
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }
  fs.writeFileSync('dist/version.txt', pkg.version);
} catch (error) {
  console.error('Failed to write version file:', error);
  process.exit(1);
}
//fs.writeFileSync('dist/version.json', JSON.stringify({ version: pkg.version }, null, 2)); // version in JSON format, if needed (<== possible Repomon changes)