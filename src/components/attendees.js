import React from "react";

export default function Attendees(props) {

    const { event } = props;
    function attendees() {
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

    return <>
        <p className="event-details-creator">{event.creator.displayName || event.creator.email}</p>
        <ul className="event-details-attendees">{attendees()}</ul>
    </>;
}