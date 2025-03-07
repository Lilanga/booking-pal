const { google } = require('googleapis');

let _auth;
let _calendarId;
let calendar = google.calendar('v3');

const MILLISECONDS_PER_MINUTE = 60000;

module.exports = class Client {
  constructor(calendarId, auth) {
    _calendarId = calendarId;
    _auth = auth;
    calendar = google.calendar({version: "v3", auth:_auth});
  }

  listEvents() {
    const timeMin = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    const timeMax = new Date(new Date().setHours(23, 59, 59)).toISOString();
    return new Promise((resolve, reject) => {
      calendar.events.list({
        calendarId: _calendarId,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime'
      }, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response.data.items);
        }
      });
    });
  }

  insertEvent(duration = 15) {
    const now = new Date();
    return new Promise((resolve, reject) => {
      const resource = {
        summary: `Quick Reservation ${duration}'`,
        description: `Quick Reservation ${duration}'`,
        start: {
          dateTime: now.toISOString(),
        },
        end: {
          dateTime: new Date(now.getTime() + duration * MILLISECONDS_PER_MINUTE).toISOString(),
        },
      };
      calendar.events.insert({
        calendarId: _calendarId,
        resource,
      }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(this.listEvents());
        }
      });
    });
  }

  finishEvent(eventId) {
    const now = new Date();
    return new Promise((resolve, reject) => {
      const resource = {
        end: {
          dateTime: now.toISOString(),
        },
      };
      calendar.events.patch({
        calendarId: _calendarId,
        eventId,
        resource,
      }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(this.listEvents());
        }
      });
    });
  }

  statusEvent() {
    const now = new Date().getTime();
    return this.listEvents()
      .then(events => {
        const item = events.find((e) => {
          const start = new Date(e.start.dateTime).getTime();
          const end = new Date(e.end.dateTime).getTime();
          if (now > start && now < end) {
            return true;
          }
          if (now < start) {
            return true;
          }
        });
        return item || {};
      });
  }
};
