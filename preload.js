const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  askForCalendarId: () => ipcRenderer.invoke('ask-for-calendar-id'),
  sendCalendarId: (calendarId, title) => ipcRenderer.send('calendar-id', calendarId, title),
});