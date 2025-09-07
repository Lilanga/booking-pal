import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { timeToEvent } from '../util';

// Format duration for the slider display (always show minutes)
const formatDurationMinutes = (minutes) => {
  return `${minutes} min`;
};

// Format duration for summary and button (show hours + minutes)
const formatDurationDetailed = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${minutes} minutes`;
  } else if (remainingMinutes === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  } else {
    const hourText = hours === 1 ? '1 hour' : `${hours} hours`;
    const minText = remainingMinutes === 1 ? '1 minute' : `${remainingMinutes} minutes`;
    return `${hourText} ${minText}`;
  }
};

// Format duration for button (compact hours + minutes)
const formatDurationCompact = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${minutes}min`;
  } else if (remainingMinutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${remainingMinutes}min`;
  }
};

const CustomBookingPopover = ({ 
  isVisible, 
  onClose, 
  onConfirm, 
  nextEvent,
  targetRef,
  calendarName = ''
}) => {
  const [startTime, setStartTime] = useState(moment());
  const [endTime, setEndTime] = useState(moment().add(30, 'minutes'));
  const [duration, setDuration] = useState(30);
  const popoverRef = useRef(null);

  // Calculate maximum booking time based on next event
  const maxEndTime = (nextEvent && nextEvent.start && nextEvent.start.dateTime) 
    ? moment(nextEvent.start.dateTime) 
    : moment().add(8, 'hours');
  const maxDurationMinutes = (nextEvent && nextEvent.start && nextEvent.start.dateTime)
    ? Math.floor(timeToEvent(nextEvent) / (1000 * 60)) 
    : 480; // 8 hours default

  // Handle outside click to close popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target) &&
          targetRef.current && !targetRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isVisible, onClose, targetRef]);

  // Reset times when popover opens
  useEffect(() => {
    if (isVisible) {
      const now = moment();
      setStartTime(now);
      setEndTime(now.clone().add(30, 'minutes'));
      setDuration(30);
    }
  }, [isVisible]);

  // Update duration when times change
  useEffect(() => {
    const diffMinutes = endTime.diff(startTime, 'minutes');
    setDuration(diffMinutes);
  }, [startTime, endTime]);

  const handleStartTimeChange = useCallback((minutes) => {
    const newStartTime = moment().add(minutes, 'minutes');
    setStartTime(newStartTime);
    
    // Adjust end time if it becomes invalid
    const minEndTime = newStartTime.clone().add(5, 'minutes'); // Minimum 5 minutes
    if (endTime.isBefore(minEndTime)) {
      setEndTime(minEndTime);
    }
  }, [endTime]);

  const handleEndTimeChange = useCallback((minutes) => {
    const newEndTime = moment().add(minutes, 'minutes');
    setEndTime(newEndTime);
  }, []);

  const handleDurationChange = useCallback((newDuration) => {
    const clampedDuration = Math.max(5, Math.min(newDuration, maxDurationMinutes));
    const newEndTime = startTime.clone().add(clampedDuration, 'minutes');
    setEndTime(newEndTime);
  }, [startTime, maxDurationMinutes]);

  const handleConfirm = () => {
    const finalDuration = Math.max(5, Math.min(duration, maxDurationMinutes));
    onConfirm(finalDuration, startTime.toISOString());
    onClose();
  };

  // Generate time options for sliders
  const generateStartTimeOptions = () => {
    const options = [];
    const maxStart = maxDurationMinutes - 5; // Leave at least 5 minutes for booking
    for (let i = 0; i <= Math.min(maxStart, 120); i += 5) { // Max 2 hours from now for start time
      options.push({
        value: i,
        label: moment().add(i, 'minutes').format('HH:mm'),
        time: moment().add(i, 'minutes')
      });
    }
    return options;
  };

  const generateDurationOptions = () => {
    const options = [];
    const maxFromStart = Math.floor((maxEndTime.diff(startTime, 'minutes') / 5)) * 5;
    const maxDur = Math.min(maxFromStart, maxDurationMinutes);
    
    for (let i = 5; i <= maxDur; i += 5) {
      options.push({
        value: i,
        label: i < 60 ? `${i}min` : `${Math.floor(i/60)}h ${i%60}min`.replace(' 0min', '')
      });
    }
    return options;
  };

  const startTimeOptions = generateStartTimeOptions();
  const durationOptions = generateDurationOptions();

  const currentStartMinutes = startTime.diff(moment(), 'minutes');
  const isValidBooking = duration >= 5 && duration <= maxDurationMinutes;

  if (!isVisible) return null;

  return (
    <div className="custom-booking-overlay">
      <div ref={popoverRef} className="custom-booking-popover">
        <div className="popover-header">
          <h4>Book {calendarName || 'Meeting Room'}</h4>
          <button className="close-btn" onClick={onClose} type="button">×</button>
        </div>
        
        <div className="booking-controls">
          <div className="time-section">
            <label>Start Time</label>
            <div className="time-slider-container">
              <input
                type="range"
                min="0"
                max={Math.min(120, Math.max(5, maxDurationMinutes - 5))}
                step="5"
                value={currentStartMinutes}
                onChange={(e) => handleStartTimeChange(parseInt(e.target.value))}
                className="time-slider"
              />
              <div className="time-display">{startTime.format('HH:mm')}</div>
            </div>
          </div>

          <div className="time-section">
            <label>Duration</label>
            <div className="time-slider-container">
              <input
                type="range"
                min="5"
                max={Math.max(30, Math.min(480, maxDurationMinutes))}
                step="5"
                value={duration}
                onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                className="time-slider"
              />
              <div className="time-display">
                {formatDurationMinutes(duration)}
              </div>
            </div>
          </div>

          <div className="booking-summary">
            <div className="summary-row">
              <span>From:</span> <strong>{startTime.format('HH:mm')}</strong>
            </div>
            <div className="summary-row">
              <span>To:</span> <strong>{endTime.format('HH:mm')}</strong>
            </div>
            <div className="summary-row">
              <span>Duration:</span> <strong>
                {formatDurationDetailed(duration)}
              </strong>
            </div>
          </div>

          {nextEvent && nextEvent.start && nextEvent.start.dateTime && (
            <div className="next-event-warning">
              <i className="icon-warning" />
              Next meeting at {moment(nextEvent.start.dateTime).format('HH:mm')}
            </div>
          )}
        </div>

        <div className="popover-actions">
          <button 
            className="confirm-btn" 
            onClick={handleConfirm}
            disabled={!isValidBooking}
            type="button"
          >
            <span className="booking-icon"></span>
            Book {formatDurationCompact(duration)}
          </button>
        </div>
      </div>
    </div>
  );
};

CustomBookingPopover.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  nextEvent: PropTypes.object,
  targetRef: PropTypes.object,
  calendarName: PropTypes.string
};

export default CustomBookingPopover;