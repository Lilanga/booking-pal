import {GET_EVENTS, GET_EVENTS_REQUEST, FAILED_EVENT} from './types';
import {processEvents} from '../../gcal/eventHelpers';
import { getCalendarAPIManager } from '../../util/calendar_api_manager';

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
    const apiManager = getCalendarAPIManager();
    
    // Request events
    window.calendarAPI.listEvents();
    dispatch({
      type: GET_EVENTS_REQUEST,
      payload: null
    });

    // Add listeners with proper cleanup tracking
    apiManager.addListener('list-events-success', (_event, items) => {
      try {
        const processedEvents = processEvents(items);
        dispatch({
          type: GET_EVENTS,
          payload: processedEvents
        });
      } catch (error) {
        console.error('Error processing events:', error);
        dispatch({
          type: FAILED_EVENT,
          payload: 'Failed to process events'
        });
      }
    }, 'get-events-success');

    apiManager.addListener('list-events-failure', (_event, error) => {
      console.error(`Calendar events error: ${error}`);
      dispatch({
        type: FAILED_EVENT,
        payload: error
      });
    }, 'get-events-failure');

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
    const apiManager = getCalendarAPIManager();
    
    // Reservation request
    window.calendarAPI.quickReservation(duration);
    
    apiManager.addListener('quick-reservation-success', (_event, events) => {
      try {
        const processedEvents = processEvents(events);
        dispatch({
          type: GET_EVENTS,
          payload: processedEvents
        });
      } catch (error) {
        console.error('Error processing reservation events:', error);
        dispatch({
          type: FAILED_EVENT,
          payload: 'Failed to process reservation'
        });
      }
    }, `quick-reservation-success-${Date.now()}`);

    apiManager.addListener('quick-reservation-failure', (_event, error) => {
      console.error('Quick reservation error:', error);
      dispatch({
        type: FAILED_EVENT,
        payload: error
      });
    }, `quick-reservation-failure-${Date.now()}`);

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

  if (!eventId) {
    console.error('Event ID is required to finish reservation');
    dispatch({
      type: FAILED_EVENT,
      payload: 'Event ID is required'
    });
    return;
  }

  try {
    const apiManager = getCalendarAPIManager();
    
    // Event finish request
    window.calendarAPI.finishReservation(eventId);
    
    apiManager.addListener('finish-reservation-success', (_event, events) => {
      try {
        const processedEvents = processEvents(events);
        dispatch({
          type: GET_EVENTS,
          payload: processedEvents
        });
      } catch (error) {
        console.error('Error processing finished reservation events:', error);
        dispatch({
          type: FAILED_EVENT,
          payload: 'Failed to process finished reservation'
        });
      }
    }, `finish-reservation-success-${Date.now()}`);

    apiManager.addListener('finish-reservation-failure', (_event, error) => {
      console.error('Finish reservation error:', error);
      dispatch({
        type: FAILED_EVENT,
        payload: error
      });
    }, `finish-reservation-failure-${Date.now()}`);

  } catch (error) {
    console.error('Error finishing reservation:', error);
    dispatch({
      type: FAILED_EVENT,
      payload: error.message
    });
  }
};