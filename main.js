const { app, BrowserWindow, ipcMain } = require('electron');

const gcal = require('./src/gcal');
const path = require('node:path');
const ConfigServer = require('./src/config-server');
const ConfigStore = require('./src/config-store');

let calendarName = '';
let win;
let configServer = null;
let configStore = new ConfigStore();

function writeConfiguration(calendar_id, title) {
  return new Promise(async (resolve, reject) => {
    try {
      const configuration = await configStore.setCalendarConfig(calendar_id, title);
      console.log('Configuration saved successfully');
      resolve(configuration);
    } catch (error) {
      console.error('Configuration error:', error.message);
      reject(error);
    }
  });
}

function writeServiceKey(serviceKey) {
  return new Promise(async (resolve, reject) => {
    try {
      const savedKey = await configStore.setServiceKey(serviceKey);
      console.log('Service key saved successfully');
      resolve(savedKey);
    } catch (error) {
      console.error('Service key error:', error.message);
      reject(error);
    }
  });
}

function checkServiceKeyExists() {
  return new Promise(async (resolve) => {
    resolve(await configStore.hasServiceKey());
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

ipcMain.handle('save-configuration', async (event, configData) => {
  try {
    const { serviceKey, roomName, calendarId } = configData;
    
    // Validate and save service key if provided
    if (serviceKey) {
      const testResult = await gcal.testServiceKey(serviceKey);
      if (!testResult.valid) {
        return { success: false, error: testResult.error };
      }
      await configStore.setServiceKey(serviceKey);
    }
    
    // Save calendar configuration if both room name and calendar ID are provided
    if (roomName && calendarId) {
      await configStore.setCalendarConfig(calendarId, roomName);
    }
    
    return { success: true, message: 'Configuration saved successfully' };
    
  } catch (error) {
    console.error('Failed to save configuration:', error);
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
          await configStore.setServiceKey(data.serviceKey);
          
          // If room name and calendar ID are provided, save calendar config too
          if (data.roomName && data.calendarId) {
            await configStore.setCalendarConfig(data.calendarId, data.roomName);
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

ipcMain.handle('get-current-config', async () => {
  try {
    return await configStore.getCurrentConfig();
  } catch (error) {
    console.error('Failed to get current configuration:', error);
    return {};
  }
});

ipcMain.handle('reconfigure', async () => {
  try {
    console.log('Starting reconfiguration flow...');
    
    // Get current configuration
    const currentConfig = await configStore.getCurrentConfig();

    // Set current config in web server if it exists
    if (configServer && (currentConfig.roomName || currentConfig.calendarId)) {
      configServer.setCurrentConfig({
        roomName: currentConfig.roomName,
        calendarId: currentConfig.calendarId
      });
    }
    
    // Show the service key configuration dialog (now with dismiss option)
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

    // Return success - dialog is shown, user can dismiss or reconfigure
    return { success: true };
    
  } catch (error) {
    console.error('Failed to start reconfiguration:', error);
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
  return new Promise(async (resolve, reject) => {
    try {
      const calendar = await configStore.getCalendarConfig();
      if (!calendar || !calendar.id || !calendar.title) {
        const validationError = new Error('Invalid configuration: missing calendar_id or title');
        console.error('Configuration validation error:', validationError.message);
        reject(validationError);
        return;
      }
      resolve({
        calendar_id: calendar.id,
        title: calendar.title
      });
    } catch (error) {
      console.error('Failed to read configuration:', error.message);
      reject(error);
    }
  });
}

function readConfiguration() {
  return new Promise((resolve, reject) => {
    readConfigurationFile()
      .then(configuration => resolve(configuration))
      .catch(async error => {
        console.error(error);
        // Check if calendar config exists in store
        if (await configStore.hasCalendarConfig()) {
          // Configuration exists but may be incomplete, reject the error
          reject(error);
        } else {
          // No calendar configuration exists, prompt user
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

    // Step 3: Get service key and initialize Google Calendar API
    const serviceKey = await configStore.getServiceKey();
    if (!serviceKey) {
      throw new Error('Service key not found in configuration store');
    }
    
    const gcalApi = new gcal.GCal(configuration.calendar_id, serviceKey);
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

    ipcMain.on('calendar:quick-reservation', (event, duration, startTime) => {
      client.insertEvent(duration, startTime)
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

