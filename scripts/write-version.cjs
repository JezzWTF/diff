const fs = require('fs');
const pkg = require('../package.json');
fs.writeFileSync('dist/version.txt', pkg.version);
//fs.writeFileSync('dist/version.json', JSON.stringify({ version: pkg.version }, null, 2)); // version in JSON format, if needed (<== possible Repomon changes)