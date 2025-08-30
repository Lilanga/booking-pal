const fs = require('node:fs');
const path = require('node:path');
const { google } = require('googleapis');
const Client = require('./client');
const CONFIG_DIR = path.resolve(__dirname, '../../config');
const GOOGLE_CLIENT_SECRET = path.resolve(CONFIG_DIR, 'service_key.json');

function readCredentials() {
  return new Promise((resolve, reject) => {
    fs.readFile(GOOGLE_CLIENT_SECRET, 'utf8', (err, content) => {
      if (err) {
        console.error('Failed to read service account key:', err.message);
        reject(new Error(`Cannot read credentials file: ${err.message}`));
        return;
      }

      try {
        const serviceKey = JSON.parse(content);
        
        // Validate required service account fields
        const requiredFields = ['type', 'client_email', 'private_key', 'project_id'];
        const missingFields = requiredFields.filter(field => !serviceKey[field]);
        
        if (missingFields.length > 0) {
          const error = new Error(`Invalid service account key. Missing fields: ${missingFields.join(', ')}`);
          console.error('Service key validation error:', error.message);
          reject(error);
          return;
        }

        if (serviceKey.type !== 'service_account') {
          const error = new Error('Invalid service account key: type must be "service_account"');
          console.error('Service key validation error:', error.message);
          reject(error);
          return;
        }

        // Validate email format using a ReDoS-safe regex
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!serviceKey.client_email || typeof serviceKey.client_email !== 'string' || !emailRegex.test(serviceKey.client_email)) {
          const error = new Error('Invalid service account key: client_email format is invalid');
          console.error('Service key validation error:', error.message);
          reject(error);
          return;
        }

        console.log('Service account credentials validated successfully');
        resolve(serviceKey);
      } catch (parseError) {
        console.error('Failed to parse service account key:', parseError.message);
        reject(new Error('Service account key file is corrupted or invalid JSON'));
      }
    });
  });
}

let _calendarId;
exports.GCal = class GCal {
  constructor(calendarId) {
    _calendarId = calendarId;
  }

  async authorize() {
    try {
      const serviceAccountKey = await readCredentials();

      if (!_calendarId) {
        throw new Error('Calendar ID is not set');
      }

      const jwtClient = new google.auth.JWT(
        serviceAccountKey.client_email,
        undefined,
        serviceAccountKey.private_key,
        ['https://www.googleapis.com/auth/calendar'],
      );

      // Test authentication by getting a token
      try {
        await jwtClient.authorize();
        console.log('Google Calendar authentication successful');
      } catch (authError) {
        console.error('Google Calendar authentication failed:', authError.message);
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      return new Client(_calendarId, jwtClient);
    } catch (error) {
      console.error('Authorization error:', error.message);
      throw new Error(`Failed to authorize Google Calendar access: ${error.message}`);
    }
  }
};
