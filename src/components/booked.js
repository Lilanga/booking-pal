import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import Button from './button';
import { humanReadableDuration, timeLeft } from './../util';

const bookedStatusSubMessage = (currentEvent) => {
  const remainingTime = humanReadableDuration(timeLeft(currentEvent));
  return `for the next ${remainingTime}`;
};

const Booked = ({ currentEvent, onClick}) => {
  const [calendarName, setCalendarName] = useState('');
  const remainingTimeMessage = isEmpty(currentEvent) ? null : bookedStatusSubMessage(currentEvent);

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
    <div className='status-details' key={1}>
      <strong>{calendarName}</strong>
      <div className="action-buttons single">
        <Button icon="cancel" className="big" handleClick={onClick}/>
      </div>
      <h1>Booked</h1>
      <h2>{remainingTimeMessage}</h2>
    </div>
  );
};

Booked.propTypes = {
  currentEvent: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default Booked;
