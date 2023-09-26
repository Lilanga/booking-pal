import React, { Component } from 'react';
import PropTypes from 'prop-types';
import QRCode from "react-qr-code";
import Button from './button';
import Empty from './empty';
import Attendees from './attendees';
import classNames from 'classnames';
import { isEmpty } from 'lodash/lang';
import EventDuration from './event_duration';

function EventDetails(props) {
  const { event, isCurrent, expanded, handleExpandDetails } = props;

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
        <p className="event-details-description">{event.description}</p>
        <EventDuration event={event} />
        <Attendees event={event} />
        <div className="event-details-qr">
          <QRCode
            size={256}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            value={event.htmlLink}
            viewBox={`0px 0px 256px 256px`}
          />
        </div>
      </div>
  )
}

EventDetails.propTypes = {
  event: PropTypes.object,
  isCurrent: PropTypes.bool,
  expanded: PropTypes.bool,
  handleShowSchedule: PropTypes.func.isRequired,
  handleExpandDetails: PropTypes.func.isRequired,
}

EventDetails.defaultProps = {
  expanded: false,
};

export default EventDetails;