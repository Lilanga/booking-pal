import React, { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { getEvents } from './store/actions';
import ErrorBoundary from './components/error_boundary';
import withErrorBoundary from './components/with_error_boundary';
import OfflineIndicator from './components/offline_indicator';
import { STATUS_UPDATE_INTERVAL_MS } from './constants';
import { getCalendarAPIManager } from './util/calendar_api_manager';

// Import offline test utilities in development
if (process.env.NODE_ENV === 'development') {
  import('./util/offline-test-utils');
}

function App({getEvents, route, children}) {
  const location = useLocation();
  const intervalRef = useRef(null);
  const wheelListenerRef = useRef(null);
  const isUnmountedRef = useRef(false);

  // Memoize the wheel event handler to prevent recreation on every render
  const handleWheelEvent = useCallback((e) => {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  }, []);

  // Memoize the getEvents function to prevent unnecessary effect runs
  const stableGetEvents = useCallback(() => {
    if (!isUnmountedRef.current) {
      getEvents();
    }
  }, [getEvents]);

  // Set up wheel event listener with proper cleanup
  useEffect(() => {
    wheelListenerRef.current = handleWheelEvent;
    document.addEventListener('wheel', wheelListenerRef.current, { passive: false });

    return () => {
      if (wheelListenerRef.current) {
        document.removeEventListener('wheel', wheelListenerRef.current);
        wheelListenerRef.current = null;
      }
    };
  }, [handleWheelEvent]);

  // Set up polling interval with proper cleanup
  useEffect(() => {
    stableGetEvents();
    
    // Set up interval
    intervalRef.current = setInterval(() => {
      stableGetEvents();
    }, STATUS_UPDATE_INTERVAL_MS);

    return () => {
      isUnmountedRef.current = true;
      
      // Clean up interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Clean up calendar API listeners using the manager
      try {
        const apiManager = getCalendarAPIManager();
        apiManager.destroy();
      } catch (error) {
        console.warn('Error cleaning up calendar API manager:', error);
      }
    };
  }, [stableGetEvents]);

  // Handle route changes - removed as React Router handles this now

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('App Error:', error, errorInfo);
      }}
      fallback={(error, errorInfo, retry, canRetry) => (
        <div className="app-error">
          <h1>Application Error</h1>
          <p>The meeting room booking system encountered an error.</p>
          {canRetry && (
            <button onClick={retry} type="button">
              Restart Application
            </button>
          )}
          <p>If the problem persists, please refresh the page or contact support.</p>
        </div>
      )}
    >
      <div id="app">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <ErrorBoundary>
          {drawFooter()}
        </ErrorBoundary>
        <OfflineIndicator position="top-right" showOnlineStatus={false} />
      </div>
    </ErrorBoundary>
  );

  function drawFooter() {
    if (location.pathname === '/check_connection')
      return '';

    const isStatus = location.pathname === '/' || location.pathname === '/status';
    const footerText = isStatus ?
      <span>full schedule <i className="icon icon-arrow-right" /></span> :
      <span><i className="icon icon-arrow-left" /> back to booking</span>;

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
  route: state.calendar.route,
});

App.propTypes = {
  getEvents: PropTypes.func.isRequired,
  route: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export default connect(mapStateToProps, {getEvents})(App);