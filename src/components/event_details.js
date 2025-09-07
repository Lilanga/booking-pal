import React from 'react';
import PropTypes from 'prop-types';
import QRCode from "react-qr-code";
import Button from './button';
import Empty from './empty';
import Attendees from './attendees';
import classNames from 'classnames';
import { isEmpty } from 'lodash';
import EventDuration from './event_duration';

 const EventDetails = (props) => {
  const { event, isCurrent, expanded = false, handleExpandDetails } = props;

  const btnClasses = classNames({
    small: true,
    'expand-btn': true,
    expanded: expanded,
  });

  return (
    isEmpty(event) ?
      <Empty />
      :
      <div className='event-details flex-container'>
        <Button icon="arrow-up" className={btnClasses} handleClick={handleExpandDetails} />
        <h3 className="event-details-status">
          {isCurrent ? 'CURRENT MEETING' : 'COMING UP'}
        </h3>
        <h3 className="event-details-name">{event.summary}</h3>
        <div className="event-duration-container">
          <EventDuration event={event} />
        </div>
        {expanded && (
          <div className="event-details-expanded">
            <p className="event-details-description">{event.description}</p>
            <Attendees event={event} />
            <div className="event-details-qr">
              <QRCode
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                value={event.htmlLink}
                viewBox={"0px 0px 256px 256px"}
              />
            </div>
          </div>
        )}
      </div>
  );
};

EventDetails.propTypes = {
  event: PropTypes.object,
  isCurrent: PropTypes.bool,
  expanded: PropTypes.bool,
  handleExpandDetails: PropTypes.func.isRequired,
};

export default EventDetails;