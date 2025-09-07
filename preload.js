const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  askForCalendarId: () => ipcRenderer.invoke('ask-for-calendar-id'),
  sendCalendarId: (calendarId, title) => ipcRenderer.send('calendar-id', calendarId, title),
  askForServiceKey: () => ipcRenderer.invoke('ask-for-service-key'),
  sendServiceKey: (serviceKey) => ipcRenderer.invoke('save-service-key', serviceKey),
  startConfigServer: () => ipcRenderer.invoke('start-config-server'),
  stopConfigServer: () => ipcRenderer.invoke('stop-config-server'),
  reconfigure: () => ipcRenderer.invoke('reconfigure'),
  getCurrentConfig: () => ipcRenderer.invoke('get-current-config'),
  saveConfiguration: (configData) => ipcRenderer.invoke('save-configuration', configData),
});

contextBridge.exposeInMainWorld('calendarAPI', {
  listEvents: () => ipcRenderer.send('calendar:list-events'),
  statusEvent: () => ipcRenderer.send('calendar:status-event'),
  quickReservation: (duration, startTime) => ipcRenderer.send('calendar:quick-reservation', duration, startTime),
  finishReservation: (eventId) => ipcRenderer.send('calendar:finish-reservation', eventId),
  
  onListEventsSuccess: (callback) => ipcRenderer.on('calendar:list-events-success', callback),
  onListEventsFailure: (callback) => ipcRenderer.on('calendar:list-events-failure', callback),
  onStatusEventSuccess: (callback) => ipcRenderer.on('calendar:status-event-success', callback),
  onStatusEventFailure: (callback) => ipcRenderer.on('calendar:status-event-failure', callback),
  onQuickReservationSuccess: (callback) => ipcRenderer.on('calendar:quick-reservation-success', callback),
  onQuickReservationFailure: (callback) => ipcRenderer.on('calendar:quick-reservation-failure', callback),
  onFinishReservationSuccess: (callback) => ipcRenderer.on('calendar:finish-reservation-success', callback),
  onFinishReservationFailure: (callback) => ipcRenderer.on('calendar:finish-reservation-failure', callback),
  
  removeAllListeners: () => ipcRenderer.removeAllListeners(),
});

contextBridge.exposeInMainWorld('appAPI', {
  getCalendarName: () => ipcRenderer.invoke('get-calendar-name'),
});