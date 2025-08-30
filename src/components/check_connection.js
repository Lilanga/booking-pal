import React, { useState, useEffect, useRef } from 'react';
import withErrorBoundary from './with_error_boundary';

const CheckConnection = () => {
  const [calendarName, setCalendarName] = useState('');
  const isUnmountedRef = useRef(false);

  useEffect(() => {
    const getCalendarName = async () => {
      try {
        if (isUnmountedRef.current) return;
        
        if (window.appAPI && typeof window.appAPI.getCalendarName === 'function') {
          const name = await window.appAPI.getCalendarName();
          if (!isUnmountedRef.current && name) {
            setCalendarName(name);
          }
        }
      } catch (error) {
        console.error('Error getting calendar name:', error);
        if (!isUnmountedRef.current) {
          setCalendarName('Calendar');
        }
      }
    };

    getCalendarName();

    return () => {
      isUnmountedRef.current = true;
    };
  }, []);

  return (
    <div className="no-connection">
      <strong>{calendarName}</strong>
      <div className="icon"><i className="icon icon-no-connection" /></div>
      <h3 className="text">Failed to connect to the Calendar Service</h3>
    </div>
  );
};

export default withErrorBoundary(CheckConnection);
