const { app, BrowserWindow, ipcMain } = require('electron');

const gcal = require('./src/gcal');
const fs = require('node:fs');
const path = require('node:path');

const CONFIG_DIR = path.resolve(__dirname, './config');
const CALENDAR_CONFIG = path.resolve(CONFIG_DIR, 'calendar.json');

let calendarName = '';

let win;

function writeConfiguration(calendar_id, title) {
  return new Promise((resolve, reject) => {
    if (!calendar_id || !title) {
      const error = new Error('Calendar ID and title are required');
      console.error('Configuration error:', error.message);
      reject(error);
      return;
    }

    const configuration = { calendar_id: calendar_id, title: title };

    try {
      fs.writeFile(CALENDAR_CONFIG, JSON.stringify(configuration, null, 2), error => {
        if (error) {
          console.error('Failed to write configuration:', error);
          reject(error);
        } else {
          console.log('Configuration saved successfully');
          resolve(configuration);
        }
      });
    } catch (error) {
      console.error('Unexpected error writing configuration:', error);
      reject(error);
    }
  });
}

ipcMain.handle('get-calendar-name', () => {
  return calendarName;
});

ipcMain.handle('ask-for-calendar-id', async () => {

  // if win is not empty and is visible, hide it
  if (win?.isVisible())
    win.hide();

  const configDialog = new BrowserWindow({
    width: 480,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  configDialog.loadFile('input.html');
  if (process.env.NODE_ENV !== 'development')
    configDialog.setFullScreen(true);

  return new Promise((resolve) => {
    ipcMain.once('calendar-id', (event, calendarId, title) => {
      resolve({calendarId, title});
      configDialog.close();
    });
  });
});

app.on('ready', () => {
  win = new BrowserWindow({
    width: 480,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // if win is not empty, hide it at the beginning
  win.hide();
  win.loadFile('index.html');
});

function readConfigurationFile() {
  return new Promise((resolve, reject) => {
    fs.readFile(CALENDAR_CONFIG, 'utf8', (error, content) => {
      if (error) {
        console.error('Failed to read configuration file:', error.message);
        reject(error);
        return;
      }

      try {
        const config = JSON.parse(content);
        if (!config.calendar_id || !config.title) {
          const validationError = new Error('Invalid configuration: missing calendar_id or title');
          console.error('Configuration validation error:', validationError.message);
          reject(validationError);
          return;
        }
        resolve(config);
      } catch (parseError) {
        console.error('Failed to parse configuration file:', parseError.message);
        reject(new Error('Configuration file is corrupted'));
      }
    });
  });
}

function readConfiguration() {
  return new Promise((resolve, reject) => {
    readConfigurationFile()
      .then(configuration => resolve(configuration))
      .catch(async error => {
        console.error(error);
        if (error.code !== 'ENOENT')
          reject(error);
        else {
            const {calendarId, title} = await win.webContents.executeJavaScript('window.electron.askForCalendarId()');
            writeConfiguration(calendarId, title)
            .then(configuration => resolve(configuration))
            .catch(error => reject(error));
        }
      });
  });
}

function createWindow() {
  // Close the previous window if it exists
  if (win && !win.isDestroyed())
    win.close();

  win = new BrowserWindow({
    width: 480,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (process.env.NODE_ENV !== 'development')
    win.setFullScreen(true);

  if (process.env.NODE_ENV === 'development')
    win.webContents.openDevTools();

  win.loadURL(`file://${__dirname}/index.html`);

  win.on('closed', () => {
    // Dereference the window object
    win = null;
  });

}

app.on('ready', () => {
  
  readConfiguration()
    .then(configuration => {
      const gcalApi = new gcal.GCal(configuration.calendar_id);

      gcalApi.authorize()
        .then(client => {
          // close the configuration window
          createWindow();

          calendarName = configuration.title;

          ipcMain.on('calendar:list-events', event => client.listEvents()
            .then(items => { 
              if (!event.sender.isDestroyed()) {
                event.sender.send('calendar:list-events-success', items);
              }
            })
            .catch(error => {
              console.error(error);
              if (!event.sender.isDestroyed()) {
                event.sender.send('calendar:list-events-failure', error);
              }
            })
          );

          ipcMain.on('calendar:status-event', event => client.statusEvent()
            .then(item => {
              if (!event.sender.isDestroyed()) {
                event.sender.send('calendar:status-event-success', item);
              }
            })
            .catch(error => {
              if (!event.sender.isDestroyed()) {
                event.sender.send('calendar:status-event-failure', error);
              }
            })
          );

          ipcMain.on('calendar:quick-reservation', (event, duration) => {
            client.insertEvent(duration)
              .then(response => { 
                if (!event.sender.isDestroyed()) {
                  event.sender.send('calendar:quick-reservation-success', response);
                }
              })
              .catch(error => { 
                if (!event.sender.isDestroyed()) {
                  event.sender.send('calendar:quick-reservation-failure', error);
                }
              });
          }
          );

          ipcMain.on('calendar:finish-reservation', (event, eventId) => {
            client.finishEvent(eventId)
              .then(response => {
                if (!event.sender.isDestroyed()) {
                  event.sender.send('calendar:finish-reservation-success', response);
                }
              })
              .catch(error => {
                if (!event.sender.isDestroyed()) {
                  event.sender.send('calendar:finish-reservation-failure', error);
                }
              });
          });
        })
        .catch((error) => {console.log(`error: ${error}`); process.exit();});
    }).catch(error => {
      console.error(error);
      process.exit();
    });
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

