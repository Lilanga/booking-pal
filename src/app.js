import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { webFrame } from 'electron';
import { Link } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import { getEvents } from './store/actions';
import Status from './components/status';
import Schedule from './components/schedule';
import CheckConnection from './components/check_connection';
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

function App({getEvents}) {
  let updateEventsInterval;

  useEffect(() => {
    getEvents();
    setUpdateDisplayedEventsInterval();

    ipcRenderer.on('calendar:list-events-success', () => {
      if (isCheckConnectionView()) {
        window.location.hash = 'status';
      }

    });

    ipcRenderer.on('calendar:list-events-failure', (_event, error) => {
      console.error(error);
      window.location.hash = 'check_connection';
    });

    return () => {
      ipcRenderer.removeAllListeners();
      clearInterval(updateEventsInterval);
    };
  }, []);

  function setUpdateDisplayedEventsInterval() {
    updateEventsInterval = setInterval(() => {
      getEvents();
    }, STATUS_UPDATE_INTERVAL_MS);
  }

  return (
    <div id="app">
      {isStatusView() ? <Status /> : isScheduleView() ? <Schedule /> : <CheckConnection />}
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
};

export default connect(mapStateToProps, {getEvents})(App);