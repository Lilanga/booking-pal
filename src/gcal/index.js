const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const Client = require('./client');
const CONFIG_DIR = path.resolve(__dirname, '../../config');
const GOOGLE_CLIENT_SECRET = path.resolve(CONFIG_DIR, 'service_key.json');

function readCredentials() {
  return new Promise((resolve, reject) => {
    fs.readFile(GOOGLE_CLIENT_SECRET, (err, content) => {
      if (err)
        reject(err);
      else
        resolve(JSON.parse(content));
    });
  });
}

let _calendarId;
exports.GCal = class GCal {
  constructor(calendarId) {
    _calendarId = calendarId;
  }

  authorize() {
    return readCredentials().then(serviceAccountKey => {

      const jwtClient = new google.auth.JWT(
        serviceAccountKey.client_email,
        undefined,
        serviceAccountKey.private_key,
        ['https://www.googleapis.com/auth/calendar'],
      );

      return new Client(_calendarId, jwtClient);
    }).catch(function(error) {
      console.log(error);
      exit(1);
    });
  }
};
