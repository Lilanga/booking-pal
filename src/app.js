import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { webFrame } from 'electron';
import { Link } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import { getEvents, updateEvents } from './store/actions';
import Status from './components/status';
import Schedule from './components/schedule';
import CheckConnection from './components/check_connection';
import { currentEvent, nextEvent, nextEventIdx } from './util';
import { STATUS_UPDATE_INTERVAL_MS } from './constants';

// Disable pinch zooming
webFrame.setVisualZoomLevelLimits(1, 1);

function currentHash() {
  return window.location.hash;
}

function isStatusView() {
  return /status/.test(currentHash());
}

const isCheckConnectionView = () => {
  return /check_connection/.test(currentHash());
};

const isScheduleView = () => {
  return /schedule/.test(currentHash());
};

function App({updateEvents}) {
  const [events, setEvents] = useState([]);
  let updateEventsInterval;

  useEffect(() => {
    ipcRenderer.send('calendar:list-events');
    setUpdateDisplayedEventsInterval();

    ipcRenderer.on('calendar:list-events-success', (event, events) => {
      if (isCheckConnectionView()) {
        window.location.hash = 'status';
      }

      setEvents(processEvents(events));
      updateEvents(events);
    });

    ipcRenderer.on('calendar:list-events-failure', (_event, error) => {
      console.error(error);
      window.location.hash = 'check_connection';
    });

    ipcRenderer.on('calendar:quick-reservation-success', (event, events) => {setEvents(events); updateEvents(events);});
    ipcRenderer.on('calendar:quick-reservation-failure', (event, error) => console.error(error));

    ipcRenderer.on('calendar:finish-reservation-success', (event, events) => {setEvents(events); updateEvents(events);} );
    ipcRenderer.on('calendar:finish-reservation-failure', (event, error) => console.error(error));

    // getEvents();

    return () => {
      ipcRenderer.removeAllListeners();
      clearInterval(updateEventsInterval);
    };
  }, []);

  function setUpdateDisplayedEventsInterval() {
    updateEventsInterval = setInterval(() => {
      ipcRenderer.send('calendar:list-events');
    }, STATUS_UPDATE_INTERVAL_MS);
  }

  function processEvents(events) {
    events = markAllDayEvents(events);
    events = removeUnconfirmedEvents(events);
    return events;
  }

  function markAllDayEvents(events) {
    return events?.map((event) => {
      if (event.start.dateTime) {
        return {
          ...event,
          isAllDay: false,
        };
      } else {  // all day events received from api call don't have the dateTime field
        const start = new Date(event.start.date);
        start.setHours(0);
        const end = new Date(event.end.date);
        end.setHours(0);
        return {
          ...event,
          start: { ...event.start, dateTime: start },
          end: { ...event.end, dateTime: end },
          isAllDay: true,
        };
      }
    });
  }

  function removeUnconfirmedEvents(events) {
    return events?.filter(event => {
      return event.status === 'confirmed';
    });
  }

  function handleQuickReservation(duration) {
    // duration is in minutes
    // if (duration * MILLISECONDS_PER_MINUTE > timeToNextEvent()) {
    //   return;
    // }
    ipcRenderer.send('calendar:quick-reservation', duration);
  }

  function handleFinishReservation(id) {
    ipcRenderer.send('calendar:finish-reservation', id);
  }

  function handleShowSchedule() {
    window.location.hash = 'schedule';
  }


  const props = { events, currentEvent: currentEvent(events), nextEvent: nextEvent(events), nextEventIdx: nextEventIdx(events), onQuickReservation: handleQuickReservation, onFinishReservation: handleFinishReservation, onShowSchedule: handleShowSchedule };
  return (
    <div id="app">
      {isStatusView() ? <Status {...props} /> : isScheduleView() ? <Schedule {...props} /> : <CheckConnection {...props} />}
      {drawFooter()}
    </div>
  );

  function drawFooter() {
    if (isCheckConnectionView())
      return '';

    const isStatus = isStatusView();
    const footerText = isStatus ?
      <span>full schedule <i className="icon icon-arrow-right"></i></span> :
      <span><i className="icon icon-arrow-left"></i> back to booking</span>;

    return (
      <footer>
        <div className="footer">
          {isStatus ? <Link to="/schedule">{footerText}</Link> : <Link to="/status">{footerText}</Link>}
        </div>
      </footer>
    );
  }
}

const mapStateToProps = state => ({
  events: state.events,
});

App.propTypes = {
  getEvents: PropTypes.func.isRequired,
  updateEvents: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, {getEvents, updateEvents})(App);