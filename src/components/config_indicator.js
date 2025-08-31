import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const ConfigIndicator = ({ position = 'top-left' }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);

  const handleConfigClick = async () => {
    try {
      setIsConfiguring(true);
      // Start the reconfiguration flow
      await window.electron.reconfigure();
    } catch (error) {
      console.error('Failed to start reconfiguration:', error);
    } finally {
      setIsConfiguring(false);
      setShowDetails(false);
    }
  };

  const handleDetailsClick = () => {
    setShowDetails(!showDetails);
  };

  const getCalendarName = async () => {
    try {
      return await window.appAPI.getCalendarName();
    } catch (error) {
      return 'Unknown Room';
    }
  };

  const [calendarName, setCalendarName] = useState('Loading...');

  React.useEffect(() => {
    getCalendarName().then(setCalendarName);
  }, []);

  const indicatorClasses = classNames('config-indicator', {
    'config-indicator--configuring': isConfiguring,
    [`config-indicator--${position}`]: position,
    'config-indicator--expanded': showDetails
  });

  return (
    <div className={indicatorClasses}>
      <button 
        className="config-indicator__status"
        onClick={handleDetailsClick}
        title="Room configuration settings"
      >
        <span className="config-indicator__icon">
          {isConfiguring ? '🔄' : '⚙️'}
        </span>
      </button>
      
      {showDetails && (
        <div className="config-indicator__details">
          <div className="config-indicator__detail-item">
            <strong>Room:</strong> {calendarName}
          </div>
          
          <div className="config-indicator__detail-item">
            <strong>Calendar:</strong> Connected
          </div>
          
          <div className="config-indicator__detail-item config-indicator__info">
            💡 You can reconfigure the room name, calendar, or service account
          </div>
          
          <button 
            className="config-indicator__reconfig-btn"
            onClick={handleConfigClick}
            disabled={isConfiguring}
            title="Start reconfiguration process"
          >
            {isConfiguring ? 'Starting...' : 'Reconfigure'}
          </button>
        </div>
      )}
    </div>
  );
};

ConfigIndicator.propTypes = {
  position: PropTypes.oneOf(['top-left', 'top-right', 'bottom-left', 'bottom-right'])
};

export default ConfigIndicator;