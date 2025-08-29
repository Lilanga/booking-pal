const {GET_EVENTS, GET_EVENTS_REQUEST, FAILED_EVENT} = require('./types');
const {processEvents} = require('../../gcal/eventHelpers');

export const getEvents = () => dispatch => {
  if (!window.calendarAPI) {
    console.error('Calendar API not available');
    dispatch({
      type: FAILED_EVENT,
      payload: 'Calendar API not available'
    });
    return;
  }

  try {
    // request events
    window.calendarAPI.listEvents();
    dispatch({
      type: GET_EVENTS_REQUEST,
      payload: null
    });

    window.calendarAPI.onListEventsSuccess((_event, items) => {
      const processedEvents = processEvents(items);
      dispatch({
        type: GET_EVENTS,
        payload: processedEvents
      });
    });

    window.calendarAPI.onListEventsFailure((_event, error) => {
      console.error(`Calendar events error: ${error}`);
      dispatch({
        type: FAILED_EVENT,
        payload: error
      });
    });
  } catch (error) {
    console.error('Error getting events:', error);
    dispatch({
      type: FAILED_EVENT,
      payload: error.message
    });
  }
};

export const updateEvents = (events) => dispatch => {
  const processedEvents = processEvents(events);
  dispatch({
    type: GET_EVENTS,
    payload: processedEvents
  });
};

export const quickReservation = duration => dispatch => {
  if (!window.calendarAPI) {
    console.error('Calendar API not available');
    dispatch({
      type: FAILED_EVENT,
      payload: 'Calendar API not available'
    });
    return;
  }

  try {
    // reservation request
    window.calendarAPI.quickReservation(duration);
    
    window.calendarAPI.onQuickReservationSuccess((_event, events) => {
      const processedEvents = processEvents(events);
      dispatch({
        type: GET_EVENTS,
        payload: processedEvents
      });
    });

    window.calendarAPI.onQuickReservationFailure((_event, error) => {
      console.error('Quick reservation error:', error);
      dispatch({
        type: FAILED_EVENT,
        payload: error
      });
    });
  } catch (error) {
    console.error('Error creating reservation:', error);
    dispatch({
      type: FAILED_EVENT,
      payload: error.message
    });
  }
};

export const finishReservation = eventId => dispatch => {
  if (!window.calendarAPI) {
    console.error('Calendar API not available');
    dispatch({
      type: FAILED_EVENT,
      payload: 'Calendar API not available'
    });
    return;
  }

  try {
    // event finish request
    window.calendarAPI.finishReservation(eventId);
    
    window.calendarAPI.onFinishReservationSuccess((_event, events) => {
      const processedEvents = processEvents(events);
      dispatch({
        type: GET_EVENTS,
        payload: processedEvents
      });
    });

    window.calendarAPI.onFinishReservationFailure((_event, error) => {
      console.error('Finish reservation error:', error);
      dispatch({
        type: FAILED_EVENT,
        payload: error
      });
    });
  } catch (error) {
    console.error('Error finishing reservation:', error);
    dispatch({
      type: FAILED_EVENT,
      payload: error.message
    });
  }
};