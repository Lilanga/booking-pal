import React from "react";
import propTypes from "prop-types";

const Attendees = ({ event }) => {
  const attendees = () => {
    if (!event.attendees) {
      return null;
    } else {
      return event.attendees.map((attendee, index) => {
        if (attendee.resource) {
          return null;
        }
        return <li key={index}>{attendee.displayName || attendee.email}</li>;
      });
    }
  };

  return (
    <>{
      attendees() && <><p className="event-details-creator">
        Attendees - {event.attendees.length}
      </p><ul className="event-details-attendees">{attendees()}</ul></>
    }</>
  );
};

Attendees.propTypes = {
  event: propTypes.object,
};

export default Attendees;
