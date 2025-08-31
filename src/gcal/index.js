const { google } = require('googleapis');
const Client = require('./client');

function validateServiceKey(serviceKey) {
  return new Promise((resolve, reject) => {
    try {
      if (!serviceKey) {
        reject(new Error('Service key is required'));
        return;
      }
        
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
    } catch (error) {
      console.error('Failed to validate service account key:', error.message);
      reject(new Error('Service account key validation failed'));
    }
  });
}

let _calendarId;
let _serviceKey;
// Test service key by attempting to authenticate
async function testServiceKey(serviceKey) {
  try {
    // Validate required fields first
    const requiredFields = ['type', 'client_email', 'private_key', 'project_id'];
    const missingFields = requiredFields.filter(field => !serviceKey[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    if (serviceKey.type !== 'service_account') {
      throw new Error('Invalid service account key: type must be "service_account"');
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!serviceKey.client_email || !emailRegex.test(serviceKey.client_email)) {
      throw new Error('Invalid service account key: client_email format is invalid');
    }

    // Test actual authentication with Google
    const jwtClient = new google.auth.JWT(
      serviceKey.client_email,
      undefined,
      serviceKey.private_key,
      ['https://www.googleapis.com/auth/calendar'],
    );

    // Attempt to get an access token to verify the key works
    await jwtClient.authorize();
    
    console.log('Service account key validation successful');
    return { valid: true, message: 'Service account key is valid and can authenticate with Google Calendar API' };
    
  } catch (error) {
    console.error('Service key validation failed:', error.message);
    return { valid: false, error: error.message };
  }
}

exports.testServiceKey = testServiceKey;

exports.GCal = class GCal {
  constructor(calendarId, serviceKey) {
    _calendarId = calendarId;
    _serviceKey = serviceKey;
  }

  async authorize() {
    try {
      const serviceAccountKey = await validateServiceKey(_serviceKey);

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
