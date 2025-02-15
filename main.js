const { app, BrowserWindow, ipcMain } = require('electron');
require('@electron/remote/main').initialize();

// const google = require('googleapis');
const gcal = require('./src/gcal');
const fs = require('fs');
// const readline = require('readline');
const path = require('path');

const CONFIG_DIR = path.resolve(__dirname, './config');
const CALENDAR_CONFIG = path.resolve(CONFIG_DIR, 'calendar.json');

global.calendarName = '';

let win;

function writeConfiguration(calendar_id, title) {
  return new Promise((resolve, reject) => {
    const configuration = { calendar_id: calendar_id, title: title };

    fs.writeFile(CALENDAR_CONFIG, JSON.stringify(configuration), error => {
      if (error){
        console.error(error);
        reject(error);
      }
      else
        resolve(configuration);
    });
  });
}

ipcMain.handle('ask-for-calendar-id', async () => {

  // if win is not empty, hide it
  if (win)
    win.hide();

  const configDialog = new BrowserWindow({
    width: 480,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  configDialog.loadFile('input.html');

  return new Promise((resolve) => {
    ipcMain.once('calendar-id', (event, calendarId, title) => {
      resolve({calendarId, title});
      configDialog.close();
      win.show();
    });
  });
});

app.on('ready', () => {
  win = new BrowserWindow({
    width: 480,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('index.html');
});

function readConfigurationFile() {
  return new Promise((resolve, reject) => {
    fs.readFile(CALENDAR_CONFIG, (error, content) => {
      if (error)
        reject(error);
      else
        resolve(JSON.parse(content));
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
  win = new BrowserWindow({
    width: 480,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
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

  require("@electron/remote/main").enable(win.webContents);
}

app.on('ready', () => {

  // configWindow = new BrowserWindow({
  //   webPreferences: {
  //     preload: path.join(__dirname, 'preload.js')
  //   }
  // });

  // configWindow.loadFile('index.html');
  
  readConfiguration()
    .then(configuration => {
      const gcalApi = new gcal.GCal(configuration.calendar_id);

      gcalApi.authorize()
        .then(client => {
          // close the configuration window
          win.close();
          createWindow();

          global.calendarName = configuration.title;

          ipcMain.on('calendar:list-events', event => client.listEvents()
            .then(items => { event.sender.send('calendar:list-events-success', items);})
            .catch(error => {
              console.error(error);
              event.sender.send('calendar:list-events-failure', error);
            })
          );

          ipcMain.on('calendar:status-event', event => client.statusEvent()
            .then(item => event.sender.send('calendar:status-event-success', item))
            .catch(error => event.sender.send('calendar:status-event-failure', error))
          );

          ipcMain.on('calendar:quick-reservation', (event, duration) => {
            client.insertEvent(duration)
              .then(response => { event.sender.send('calendar:quick-reservation-success', response);})
              .catch(error => { event.sender.send('calendar:quick-reservation-failure', error);});
          }
          );

          ipcMain.on('calendar:finish-reservation', (event, eventId) => {
            client.finishEvent(eventId)
              .then(response => event.sender.send('calendar:finish-reservation-success', response))
              .catch(error => event.sender.send('calendar:finish-reservation-failure', error));
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

