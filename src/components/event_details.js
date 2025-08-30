import React from 'react';
import PropTypes from 'prop-types';
import QRCode from "react-qr-code";
import { connect } from 'react-redux';
import Button from './button';
import Empty from './empty';
import Attendees from './attendees';
import classNames from 'classnames';
import { isEmpty } from 'lodash';
import EventDuration from './event_duration';

 const EventDetails = (props) => {
  const { currentEvent, isCurrent, expanded = false, handleExpandDetails } = props;

  const btnClasses = classNames({
    small: true,
    'expand-btn': true,
    expanded: expanded,
  });

  return (
    isEmpty(currentEvent) ?
      <Empty />
      :
      <div className='event-details flex-container'>
        <Button icon="arrow-up" className={btnClasses} handleClick={handleExpandDetails} />
        <h3 className="event-details-status">
          {isCurrent ? 'CURRENT MEETING' : 'COMING UP'}
        </h3>
        <h3 className="event-details-name">{currentEvent.summary}</h3>
        <p className="event-details-description">{currentEvent.description}</p>
        <EventDuration event={currentEvent} />
        <Attendees event={currentEvent} />
        <div className="event-details-qr">
          <QRCode
            size={256}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            value={currentEvent.htmlLink}
            viewBox={"0px 0px 256px 256px"}
          />
        </div>
      </div>
  );
};

EventDetails.propTypes = {
  currentEvent: PropTypes.object,
  event: PropTypes.object,
  isCurrent: PropTypes.bool,
  expanded: PropTypes.bool,
  handleExpandDetails: PropTypes.func.isRequired,
};


const mapStateToProps = state => ({
  currentEvent: state.calendar.currentEvent,
});

export default connect(mapStateToProps)(EventDetails);