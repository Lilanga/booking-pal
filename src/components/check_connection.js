import React, { useState, useEffect } from 'react';

const CheckConnection = () => {
  const [calendarName, setCalendarName] = useState('');

  useEffect(() => {
    const getCalendarName = async () => {
      try {
        if (window.appAPI) {
          const name = await window.appAPI.getCalendarName();
          setCalendarName(name);
        }
      } catch (error) {
        console.error('Error getting calendar name:', error);
      }
    };

    getCalendarName();
  }, []);

  return (
    <div className="no-connection">
      <strong>{calendarName}</strong>
      <div className="icon"><i className="icon icon-no-connection" /></div>
      <h3 className="text">Failed to connect to the Calendar Service</h3>
    </div>
  );
};

export default CheckConnection;
