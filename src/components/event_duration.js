import React from 'react';
import moment from 'moment';
import { isEmpty } from 'lodash/lang';
import { isAllDayEvent } from '../util';

export default function EventDuration(props) {
  const { event } = props;
  const startTime = moment(event.start.dateTime);
  const endTime = moment(event.end.dateTime);

  if (isEmpty(event)) {
    return null;
  }

  const isAllDay = isAllDayEvent(event)
  return (
    <p className="event-duration">
      {isAllDay ?
        'All Day Event' :
        `${startTime.format("H:mm")} - ${endTime.format("H:mm")}`
      }
    </p>
  );
}
