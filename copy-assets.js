const fs = require('fs-extra');
const path = require('node:path');

const assetsSrcDir = path.join(__dirname, 'static', 'icons');
const assetsDestDir = path.join(__dirname, 'build', 'icons');

fs.copy(assetsSrcDir, assetsDestDir, err => {
  if (err) {
    console.error('Error copying assets:', err);
  } else {
    console.log('Assets copied successfully.');
  }
});