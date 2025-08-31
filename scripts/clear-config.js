#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Clear BookingPal configuration files for testing purposes
 * This script removes the electron-store configuration files from the user's system
 */

function getConfigPath() {
  const platform = os.platform();
  const homeDir = os.homedir();
  
  switch (platform) {
    case 'win32':
      return path.join(homeDir, 'AppData', 'Roaming', 'booking-pal-config', 'config.json');
    case 'darwin':
      return path.join(homeDir, 'Library', 'Preferences', 'booking-pal-config.json');
    case 'linux':
      return path.join(homeDir, '.config', 'booking-pal-config', 'config.json');
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

function clearConfig() {
  const configPath = getConfigPath();
  const configDir = path.dirname(configPath);
  
  console.log(`Clearing BookingPal configuration...`);
  console.log(`Config path: ${configPath}`);
  
  try {
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
      console.log('✓ Configuration file deleted successfully');
      
      // Try to remove the directory if it's empty (for Windows/Linux)
      if (os.platform() !== 'darwin') {
        try {
          fs.rmdirSync(configDir);
          console.log('✓ Configuration directory removed');
        } catch (err) {
          // Directory not empty or doesn't exist, that's fine
          console.log('- Configuration directory kept (not empty or doesn\'t exist)');
        }
      }
    } else {
      console.log('- No configuration file found');
    }
    
    console.log('\n✓ Configuration cleared successfully!');
    console.log('The app will start with fresh configuration on next run.');
    
  } catch (error) {
    console.error('✗ Error clearing configuration:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  clearConfig();
}

module.exports = { clearConfig, getConfigPath };