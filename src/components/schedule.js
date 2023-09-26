import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import EventDuration from './event_duration';
import { CSSTransition } from 'react-transition-group';
import { isCurrent, timeLeft, isBeforeNow, isAfterNow } from '../util';

export default function Schedule({ events, nextEvent, nextEventIdx, onQuickReservation, onFinishReservation, onShowSchedule }) {
  const timeLinePositionRef = useRef(null);

  const scrollTimeLineIntoView = () => {
    if (timeLinePositionRef.current) {
      timeLinePositionRef.current.scrollIntoView({ behavior: 'instant' });
    }
  };

  useEffect(() => {
    scrollTimeLineIntoView();
  }, [events]);

  useEffect(() => {
    scrollTimeLineIntoView();
  }, []);

  const timeLine = () => (
    <span className="time-line"></span>
  );

  const renderedEvents = events.map((event, index) => {
    const eventBefore = index > 0 ? events[index - 1] : null;
    const isBefore = eventBefore ? isBeforeNow(eventBefore) && isAfterNow(event) : isAfterNow(event);

    return (
      <div className="flex-container schedule-event" key={index}>
        {isBefore ? <span ref={timeLinePositionRef}></span> : null}
        {isBefore ? timeLine() : null}
        <EventDuration event={event} />
        {isCurrent(event) ? timeLine() : null}
        <h3 className="schedule-event-name">{event.summary}</h3>
      </div>
    );
  });

  // Special case where the time line is located after all events
  if (events.length > 0 && timeLeft(events[events.length - 1]) < 0) {
    renderedEvents.push((
      <div className="flex-container schedule-event" key={events.length}>
        <span ref={timeLinePositionRef}></span>
        <h3 className="schedule-event-name"></h3>
        {timeLine()}
      </div>
    ));
  }

  return (
    <CSSTransition
      classNames="fade"
      appear={true}
      timeout={{ exit: 300, enter: 500, appear: 500 }}>
      <div className="flex-container schedule">
        <h3 className="schedule-header">{(moment().format("dddd, DD.MM.YYYY")).toUpperCase()}</h3>
        <div className="schedule-event-list">
          <div className="flex-container">
            {renderedEvents}
          </div>
        </div>
      </div>
    </CSSTransition>
  );
}

Schedule.propTypes = {
  events: PropTypes.array,
  nextEvent: PropTypes.object,
  nextEventIdx: PropTypes.number,
  onQuickReservation: PropTypes.func,
  onFinishReservation: PropTypes.func,
  onShowSchedule: PropTypes.func
}
