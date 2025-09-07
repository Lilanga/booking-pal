import { isEmpty } from 'lodash';
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Button from './button';
import CustomBookingPopover from './custom_booking_popover';
import { humanReadableDuration, timeToEvent } from './../util';
import { MILLISECONDS_PER_MINUTE } from './../constants';

const freeStatusSubMessage = (nextEvent) => {
  const remainingTime = humanReadableDuration(timeToEvent(nextEvent));
  return `for the next ${remainingTime}`;
};

const lessThan15MinutesToEvent = (event) => {
  return (!isEmpty(event) && timeToEvent(event) < 15 * MILLISECONDS_PER_MINUTE);
};

const lessThan30MinutesToEvent = (event) => {
  return (!isEmpty(event) && timeToEvent(event) < 30 * MILLISECONDS_PER_MINUTE);
};

const Free = ({ nextEvent, onClick15, onClick30, onCustomBooking}) => {
  const [calendarName, setCalendarName] = useState('');
  const [showCustomBooking, setShowCustomBooking] = useState(false);
  const customBookingButtonRef = useRef(null);
  const remainingTimeMessage = isEmpty(nextEvent) ? null : freeStatusSubMessage(nextEvent);

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

  const handleCustomBookingClick = () => {
    setShowCustomBooking(true);
  };

  const handleCustomBookingClose = () => {
    setShowCustomBooking(false);
  };

  const handleCustomBookingConfirm = (duration, startTime) => {
    if (onCustomBooking) {
      onCustomBooking(duration, startTime);
    }
  };

  return (
    <div className='status-details' key={1}>
      <strong>{calendarName}</strong>
      <h3>Quick Booking</h3>
      <div className="action-buttons multiple">
        <Button
          icon="15-min"
          handleClick={onClick15}
          disabled={lessThan15MinutesToEvent(nextEvent)}
        />
        <Button
          icon="30-min"
          handleClick={onClick30}
          disabled={lessThan30MinutesToEvent(nextEvent)}
        />
      </div>
      <h1>{"It's free"}</h1>
      <h2>{remainingTimeMessage}</h2>
      <div className="custom-booking-section">
        <button 
          ref={customBookingButtonRef}
          className="custom-booking-btn" 
          onClick={handleCustomBookingClick}
          type="button"
        >
          <span className="booking-icon"></span>
          Custom Booking
        </button>
      </div>
      
      <CustomBookingPopover
        isVisible={showCustomBooking}
        onClose={handleCustomBookingClose}
        onConfirm={handleCustomBookingConfirm}
        nextEvent={nextEvent}
        targetRef={customBookingButtonRef}
        calendarName={calendarName}
      />
    </div>
  );
};

Free.propTypes = {
  nextEvent: PropTypes.object,
  onClick15: PropTypes.func.isRequired,
  onClick30: PropTypes.func.isRequired,
  onCustomBooking: PropTypes.func,
};

export default Free;
