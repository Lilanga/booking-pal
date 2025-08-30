const { google } = require('googleapis');

let _auth;
let _calendarId;
let calendar = google.calendar('v3');

const MILLISECONDS_PER_MINUTE = 60000;
const MAX_RETRY_ATTEMPTS = 3;
const BASE_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds

// Rate limiting variables
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // Minimum 100ms between requests

const { generateSecureRandom } = require('../util/secure-random');

// Exponential backoff with jitter
function calculateRetryDelay(attempt) {
  const exponentialDelay = Math.min(BASE_RETRY_DELAY * 2 ** attempt, MAX_RETRY_DELAY);
  const jitter = generateSecureRandom() * 0.1 * exponentialDelay;
  return exponentialDelay + jitter;
}

// Rate limiting helper
function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    return new Promise(resolve => {
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest);
    });
  }
  return Promise.resolve();
}

// Retry wrapper for API calls
async function retryApiCall(apiCall, maxRetries = MAX_RETRY_ATTEMPTS) {
  await waitForRateLimit();
  lastRequestTime = Date.now();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      console.error(`API call attempt ${attempt + 1} failed:`, error.message);
      
      // Don't retry on certain error types
      if (error.code === 403 && error.message.includes('forbidden')) {
        throw new Error('Calendar access forbidden. Check permissions.');
      }
      if (error.code === 404) {
        throw new Error('Calendar not found. Check calendar ID.');
      }
      if (error.code === 401) {
        throw new Error('Authentication failed. Check credentials.');
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw new Error(`API call failed after ${maxRetries + 1} attempts: ${error.message}`);
      }
      
      // Wait before retry
      const delay = calculateRetryDelay(attempt);
      console.log(`Retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

module.exports = class Client {
  constructor(calendarId, auth) {
    if (!calendarId || !auth) {
      throw new Error('Calendar ID and authentication are required');
    }
    _calendarId = calendarId;
    _auth = auth;
    calendar = google.calendar({version: "v3", auth: _auth});
  }

  async listEvents() {
    try {
      const timeMin = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
      const timeMax = new Date(new Date().setHours(23, 59, 59)).toISOString();
      
      return await retryApiCall(async () => {
        const response = await calendar.events.list({
          calendarId: _calendarId,
          timeMin,
          timeMax,
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 50 // Limit results for better performance
        });
        
        return response.data.items || [];
      });
    } catch (error) {
      console.error('Error listing events:', error.message);
      throw new Error(`Failed to retrieve calendar events: ${error.message}`);
    }
  }

  async insertEvent(duration = 15) {
    try {
      if (!duration || duration <= 0 || duration > 480) { // Max 8 hours
        throw new Error('Invalid duration: must be between 1 and 480 minutes');
      }

      const now = new Date();
      const endTime = new Date(now.getTime() + duration * MILLISECONDS_PER_MINUTE);
      
      const resource = {
        summary: `Quick Reservation ${duration} min`,
        description: `Quick Reservation for ${duration} minutes`,
        start: {
          dateTime: now.toISOString(),
        },
        end: {
          dateTime: endTime.toISOString(),
        },
        status: 'confirmed'
      };

      await retryApiCall(async () => {
        await calendar.events.insert({
          calendarId: _calendarId,
          resource,
        });
      });

      // Return updated events list
      return await this.listEvents();
    } catch (error) {
      console.error('Error inserting event:', error.message);
      throw new Error(`Failed to create reservation: ${error.message}`);
    }
  }

  async finishEvent(eventId) {
    try {
      if (!eventId) {
        throw new Error('Event ID is required');
      }

      const now = new Date();
      const resource = {
        end: {
          dateTime: now.toISOString(),
        },
      };

      await retryApiCall(async () => {
        await calendar.events.patch({
          calendarId: _calendarId,
          eventId,
          resource,
        });
      });

      // Return updated events list
      return await this.listEvents();
    } catch (error) {
      console.error('Error finishing event:', error.message);
      throw new Error(`Failed to finish reservation: ${error.message}`);
    }
  }

  async statusEvent() {
    try {
      const now = new Date().getTime();
      const events = await this.listEvents();
      
      if (!events || events.length === 0) {
        return {};
      }

      const item = events.find((e) => {
        if (!e.start || !e.end) {
          console.warn('Event missing start or end time:', e.id);
          return false;
        }

        const start = new Date(e.start.dateTime || e.start.date).getTime();
        const end = new Date(e.end.dateTime || e.end.date).getTime();
        
        // Check if event is currently active
        if (now >= start && now <= end) {
          return true;
        }
        
        // Check if event is upcoming
        if (now < start) {
          return true;
        }
        
        return false;
      });

      return item || {};
    } catch (error) {
      console.error('Error getting event status:', error.message);
      throw new Error(`Failed to get event status: ${error.message}`);
    }
  }
};
