import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import EventDetails from './event_details';
import classNames from 'classnames';
import { CSSTransition } from 'react-transition-group';
import { quickReservation, finishReservation } from '../store/actions';
import Free from './free';
import Booked from './booked';
import { isEmpty } from 'lodash/lang';


const Status = ({ currentEvent, nextEvent, onQuickReservation, onFinishReservation }) => {

  const [detailsExpanded, setDetailsExpanded] = useState(false);

  function handleExpandDetails() {
    setDetailsExpanded(!detailsExpanded);
  }

  function isBooked() {
    const now = Date.now();

    return Object.keys(currentEvent || {}).length > 0
      && Date.parse(currentEvent.start.dateTime) <= now
      && Date.parse(currentEvent.end.dateTime) > now;
  }

  const rootClasses = classNames({
    'status-view': true,
    'expanded': detailsExpanded,
    'booked': isBooked(),
  });

  let statusComponent = isBooked() ?
    <Booked
      onClick={() => onFinishReservation(currentEvent.id)}
      currentEvent={currentEvent}
      key={1}
    /> :
    <Free
      onClick15={() => onQuickReservation(15)}
      onClick30={() => onQuickReservation(30)}
      nextEvent={nextEvent}
      key={1}
    />;

  let isCurrent = !isEmpty(currentEvent);

  return (
    <div className={rootClasses}>
      <CSSTransition
        classNames="fade"
        timeout={{ exit: 300, enter: 500, appear: 500 }}
        appear={true}>
        {statusComponent}
      </CSSTransition>
      <EventDetails
        event={isEmpty(currentEvent) ? nextEvent : currentEvent}
        isCurrent={isCurrent}
        expanded={detailsExpanded}
        handleExpandDetails={handleExpandDetails}
      />

    </div>
  );
};

Status.propTypes = {
  currentEvent: PropTypes.object,
  nextEvent: PropTypes.object,
  nextEventIdx: PropTypes.number,
  onQuickReservation: PropTypes.func,
  onFinishReservation: PropTypes.func,
};

Status.defaultProps = {
  events: [],
  currentEvent: {},
  nextEvent: {},
  nextEventIdx: -1,
  onQuickReservation: () => { },
  onFinishReservation: () => { },
};

const mapStateToProps = state => ({
  currentEvent: state.calendar.currentEvent,
  nextEvent: state.calendar.nextEvent,
  nextEventIdx: state.calendar.nextEventIdx,
});

export default connect(mapStateToProps, {onQuickReservation: quickReservation, onFinishReservation: finishReservation})(Status);