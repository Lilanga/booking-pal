import React from 'react';

const CheckConnection = () => {

    return (
      <div className="no-connection">
        <strong>{ remote.getGlobal('calendarName') }</strong>
        <div className="icon"><i className="icon icon-no-connection" /></div>
        <h3 className="text">Failed to connect to the Calendar Service</h3>
      </div>);
};

export default CheckConnection;
