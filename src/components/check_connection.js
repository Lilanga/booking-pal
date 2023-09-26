import React from 'react';

export default function CheckConnection() {
    return (
      <div className="no-connection">
        <strong>{ remote.getGlobal('calendarName') }</strong>
        <div className="icon"><i className="icon icon-no-connection"></i></div>
        <h3 className="text">Failed to connect to the Calendar Service</h3>
      </div>
    )
}
