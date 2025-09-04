import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { isEmpty } from 'lodash';
import { isAllDayEvent } from '../util';

const EventDuration = ({event}) => {
  const startTime = moment(event.start.dateTime);
  const endTime = moment(event.end.dateTime);

  if (isEmpty(event)) {
    return null;
  }

  const isAllDay = isAllDayEvent(event);
  
  if (isAllDay) {
    return (
      <p className="event-duration">All Day Event</p>
    );
  }

  // Calculate duration in minutes
  const durationMinutes = endTime.diff(startTime, 'minutes');
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  // Format duration
  let durationText = '';
  if (hours > 0 && minutes > 0) {
    durationText = `${hours}h ${minutes}min`;
  } else if (hours > 0) {
    durationText = `${hours}h`;
  } else {
    durationText = `${minutes}min`;
  }

  // Use 12-hour format with AM/PM
  const startFormatted = startTime.format("h:mm A");
  const endFormatted = endTime.format("h:mm A");
  
  return (
    <p className="event-duration">
      {`${startFormatted} - ${endFormatted} (${durationText})`}
    </p>
  );
};

EventDuration.propTypes = {
  event: PropTypes.object,
};

export default EventDuration;
