import React, { Component } from 'react';
import PropTypes from 'prop-types';
import QRCode from "react-qr-code";
import Button from './button';
import classNames from 'classnames';
import { isEmpty } from 'lodash/lang';
import EventDuration from './event_duration';

export default class EventDetails extends Component {
  static props = {
    event: PropTypes.object,
    isCurrent: PropTypes.bool,
    expanded: PropTypes.bool,
    handleShowSchedule: PropTypes.func.isRequired,
    handleExpandDetails: PropTypes.func.isRequired,
  }

  static defaultProps = {
    expanded: false,
  };

  constructor(props) {
    super(props);
  }

  handleExpandDetails() {
    this.props.handleExpandDetails();
  }

  attendees() {
    const { event } = this.props;
    if (!event.attendees) {
      return null;
    } else {
      return event.attendees.map((attendee, index) => {
        if (attendee.resource) {
          return null;
        }
        return (
          <li key={index}>{attendee.displayName || attendee.email}</li>
        );
      })
    }
  }

  render() {
    const { event, isCurrent, expanded } = this.props;

    if (isEmpty(event)) {
      return (
        <div className='event-details flex-container'>
          <h3 className="event-details-status">
            {'NO UPCOMING EVENTS'}
          </h3>
        </div>
      );
    }

    const btnClasses = classNames({
      small: true,
      'expand-btn': true,
      expanded: expanded,
    });

    return (
      <div className='event-details flex-container'>
        <Button icon="arrow-up" className={btnClasses} handleClick={this.handleExpandDetails.bind(this)} />
        <h3 className="event-details-status">
          {isCurrent ? 'CURRENT MEETING' : 'COMING UP'}
        </h3>
        <h3 className="event-details-name">{event.summary}</h3>
        <p className="event-details-description">{event.description}</p>
        <EventDuration event={event} />
        <p className="event-details-creator">{event.creator.displayName || event.creator.email}</p>
        <ul className="event-details-attendees">{this.attendees()}</ul>
        <div className="event-details-qr">
          <QRCode
            size={256}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            value={event.htmlLink}
            viewBox={`0px 0px 256px 256px`}
          />
        </div>
      </div>
    );
  }
}
