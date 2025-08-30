import React from "react";
import propTypes from "prop-types";

const Attendees = ({ event }) => {
  const attendees = () => {
    if (!event.attendees) {
      return null;
    }
    return event.attendees.map((attendee) => {
      if (attendee.resource) {
        return null;
      }
      return <li key={attendee.displayName || attendee.email}>{attendee.displayName || attendee.email}</li>;
    });
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
