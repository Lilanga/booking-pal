const { app, BrowserWindow, ipcMain } = require('electron');

const gcal = require('./src/gcal');
const fs = require('node:fs');
const path = require('node:path');
const ConfigServer = require('./src/config-server');

const CONFIG_DIR = path.resolve(__dirname, './config');
const CALENDAR_CONFIG = path.resolve(CONFIG_DIR, 'calendar.json');
const SERVICE_KEY_CONFIG = path.resolve(CONFIG_DIR, 'service_key.json');

let calendarName = '';
let win;
let configServer = null;

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

function writeServiceKey(serviceKey) {
  return new Promise((resolve, reject) => {
    if (!serviceKey) {
      const error = new Error('Service key is required');
      console.error('Service key error:', error.message);
      reject(error);
      return;
    }

    try {
      // Ensure config directory exists
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }

      fs.writeFile(SERVICE_KEY_CONFIG, JSON.stringify(serviceKey, null, 2), error => {
        if (error) {
          console.error('Failed to write service key:', error);
          reject(error);
        } else {
          console.log('Service key saved successfully');
          resolve(serviceKey);
        }
      });
    } catch (error) {
      console.error('Unexpected error writing service key:', error);
      reject(error);
    }
  });
}

function checkServiceKeyExists() {
  return new Promise((resolve) => {
    fs.access(SERVICE_KEY_CONFIG, fs.constants.F_OK, (error) => {
      resolve(!error); // true if file exists, false if not
    });
  });
}

ipcMain.handle('get-calendar-name', () => {
  return calendarName;
});

ipcMain.handle('ask-for-service-key', async () => {
  // if win is not empty and is visible, hide it
  if (win?.isVisible())
    win.hide();

  const serviceKeyDialog = new BrowserWindow({
    width: 600,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  serviceKeyDialog.loadFile('src/templates/service-key-config.html');
  if (process.env.NODE_ENV !== 'development')
    serviceKeyDialog.setFullScreen(true);

  return new Promise((resolve) => {
    ipcMain.once('service-key-configured', (event) => {
      resolve(true);
      serviceKeyDialog.close();
    });
  });
});

ipcMain.handle('save-service-key', async (event, serviceKey) => {
  try {
    // Test the service key first
    const testResult = await gcal.testServiceKey(serviceKey);
    
    if (!testResult.valid) {
      return { success: false, error: testResult.error };
    }

    // If test passes, save the key
    await writeServiceKey(serviceKey);
    
    return { success: true, message: 'Service key saved and validated successfully' };
    
  } catch (error) {
    console.error('Failed to save service key:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('start-config-server', async () => {
  try {
    if (!configServer) {
      configServer = new ConfigServer();
      
      // Set up callback to handle received service keys
      configServer.setServiceKeyCallback(async (data) => {
        try {
          // Save the service key
          await writeServiceKey(data.serviceKey);
          
          // If room name and calendar ID are provided, save calendar config too
          if (data.roomName && data.calendarId) {
            await writeConfiguration(data.calendarId, data.roomName);
          }
          
          console.log('Configuration received via web server');
        } catch (error) {
          console.error('Failed to save configuration from web server:', error);
        }
      });
    }
    
    const result = await configServer.start();
    console.log(`Configuration server started at: ${result.url}`);
    
    return result;
    
  } catch (error) {
    console.error('Failed to start configuration server:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-config-server', async () => {
  try {
    if (configServer) {
      configServer.stop();
      configServer = null;
    }
    return { success: true };
  } catch (error) {
    console.error('Failed to stop configuration server:', error);
    return { success: false, error: error.message };
  }
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

  configDialog.loadFile('src/templates/calendar-config.html');
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

async function initializeApp() {
  try {
    // Step 1: Check if service key exists
    const serviceKeyExists = await checkServiceKeyExists();
    
    if (!serviceKeyExists) {
      console.log('Service key not found. Starting service key configuration...');
      // Show service key configuration dialog
      const serviceKeyDialog = new BrowserWindow({
        width: 600,
        height: 900,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          enableRemoteModule: false,
          preload: path.join(__dirname, 'preload.js')
        }
      });

      serviceKeyDialog.loadFile('src/templates/service-key-config.html');
      if (process.env.NODE_ENV !== 'development')
        serviceKeyDialog.setFullScreen(true);

      // Wait for service key to be configured
      await new Promise((resolve) => {
        const checkForServiceKey = async () => {
          const exists = await checkServiceKeyExists();
          if (exists) {
            serviceKeyDialog.close();
            resolve(true);
          } else {
            // Check again in 1 second
            setTimeout(checkForServiceKey, 1000);
          }
        };
        checkForServiceKey();
      });
    }

    // Step 2: Read calendar configuration (will prompt if not found)
    const configuration = await readConfiguration();

    // Step 3: Initialize Google Calendar API
    const gcalApi = new gcal.GCal(configuration.calendar_id);
    const client = await gcalApi.authorize();

    // Step 4: Create main window and set up event handlers
    createWindow();
    calendarName = configuration.title;

    // Set up calendar event handlers
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
    });

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

    console.log('Application initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

app.on('ready', () => {
  initializeApp();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // Stop config server if running
  if (configServer) {
    configServer.stop();
    configServer = null;
  }
  
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

