const {GET_EVENTS, GET_EVENTS_REQUEST, FAILED_EVENT} = require('./types');
const {processEvents} = require('../../gcal/eventHelpers');
const electron = require('electron');

const {ipcRenderer} = electron;

export const getEvents = () => dispatch => {
  // clean up any previous listeners
  ipcRenderer.removeAllListeners('calendar:list-events-success');
  ipcRenderer.removeAllListeners('calendar:list-events-failure');

  // request events
  ipcRenderer.send('calendar:list-events');
  dispatch({
    type: GET_EVENTS_REQUEST,
    payload: null
  });

  ipcRenderer.on('calendar:list-events-success', (_item, items) => {
  const processedEvents = processEvents(items);
    dispatch({
      type: GET_EVENTS,
      payload: processedEvents
    });
  });

  ipcRenderer.on('calendar:list-events-failure', (_event, error) => {
    dispatch({
      type: FAILED_EVENT,
      payload: error
    });
  });
};

export const updateEvents = (events) => dispatch => {
  const processedEvents = processEvents(events);
  dispatch({
    type: GET_EVENTS,
    payload: processedEvents
  });
};

export const quickReservation = duration => dispatch => {
  // clean up any previous listeners
  ipcRenderer.removeAllListeners('calendar:quick-reservation-success');
  ipcRenderer.removeAllListeners('calendar:quick-reservation-failure');

  // reservation request
  ipcRenderer.send('calendar:quick-reservation', duration);
  ipcRenderer.on('calendar:quick-reservation-success', (event, events) => {
    const processedEvents = processEvents(events);
    dispatch({
      type: GET_EVENTS,
      payload: processedEvents
    });
  });
};

export const finishReservation = eventId => dispatch => {
  // clean up any previous listeners
  ipcRenderer.removeAllListeners('calendar:finish-reservation-success');
  ipcRenderer.removeAllListeners('calendar:finish-reservation-failure');

  // event finish request
  ipcRenderer.send('calendar:finish-reservation', eventId);
  ipcRenderer.on('calendar:finish-reservation-success', (event, events) => {
    const processedEvents = processEvents(events);
    dispatch({
      type: GET_EVENTS,
      payload: processedEvents
    });
  });
};