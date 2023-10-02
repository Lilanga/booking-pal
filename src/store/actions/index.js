const {GET_EVENTS} = require('./types');
const {processEvents} = require('../../gcal/eventHelpers');
const electron = require('electron');

const {ipcRenderer} = electron;

export const getEvents = () => dispatch => {
  ipcRenderer.send('calendar:list-events');
  ipcRenderer.on('calendar:list-events-success', (_item, items) => {
  const processedEvents = processEvents(items);
    dispatch({
      type: GET_EVENTS,
      payload: processedEvents
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
  ipcRenderer.send('calendar:finish-reservation', eventId);
  ipcRenderer.on('calendar:finish-reservation-success', (event, events) => {
    const processedEvents = processEvents(events);
    dispatch({
      type: GET_EVENTS,
      payload: processedEvents
    });
  });
};