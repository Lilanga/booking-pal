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
  return (
    <p className="event-duration">
      {isAllDay ?
        'All Day Event' :
        `${startTime.format("H:mm")} - ${endTime.format("H:mm")}`
      }
    </p>
  );
};

EventDuration.propTypes = {
  event: PropTypes.object,
};

export default EventDuration;
