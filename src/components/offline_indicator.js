import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import offlineManager from '../services/offline-manager';

const OfflineIndicator = ({ position = 'top-right', showOnlineStatus = false }) => {
  const [status, setStatus] = useState(offlineManager.getStatus());
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      setStatus(offlineManager.getStatus());
    };

    // Listen to offline manager events
    const handleOffline = () => updateStatus();
    const handleOnline = () => updateStatus();
    const handleSyncStart = () => updateStatus();
    const handleSyncSuccess = () => updateStatus();
    const handleSyncError = () => updateStatus();
    const handleActionQueued = () => updateStatus();

    offlineManager.addListener('offline', handleOffline);
    offlineManager.addListener('online', handleOnline);
    offlineManager.addListener('syncStart', handleSyncStart);
    offlineManager.addListener('syncSuccess', handleSyncSuccess);
    offlineManager.addListener('syncError', handleSyncError);
    offlineManager.addListener('actionQueued', handleActionQueued);

    // Update status periodically
    const interval = setInterval(updateStatus, 10000); // Every 10 seconds

    return () => {
      offlineManager.removeListener('offline', handleOffline);
      offlineManager.removeListener('online', handleOnline);
      offlineManager.removeListener('syncStart', handleSyncStart);
      offlineManager.removeListener('syncSuccess', handleSyncSuccess);
      offlineManager.removeListener('syncError', handleSyncError);
      offlineManager.removeListener('actionQueued', handleActionQueued);
      clearInterval(interval);
    };
  }, []);

  // Don't show if online and showOnlineStatus is false
  if (status.isOnline && !showOnlineStatus && status.queueLength === 0 && !status.syncInProgress) {
    return null;
  }

  const getStatusText = () => {
    if (!status.isOnline) {
      return 'Offline';
    }
    
    if (status.syncInProgress) {
      return 'Syncing...';
    }
    
    if (status.queueLength > 0) {
      return `${status.queueLength} pending action${status.queueLength > 1 ? 's' : ''}`;
    }
    
    return 'Online';
  };

  const getStatusIcon = () => {
    if (!status.isOnline) {
      return '🔴'; // Red circle for offline
    }
    
    if (status.syncInProgress) {
      return '🔄'; // Sync icon
    }
    
    if (status.queueLength > 0) {
      return '⏳'; // Queue icon
    }
    
    return '🟢'; // Green circle for online
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getTimeSince = (timestamp) => {
    if (!timestamp) return 'Never';
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const indicatorClasses = classNames('offline-indicator', {
    'offline-indicator--offline': !status.isOnline,
    'offline-indicator--syncing': status.syncInProgress,
    'offline-indicator--queue': status.queueLength > 0,
    'offline-indicator--online': status.isOnline && status.queueLength === 0 && !status.syncInProgress,
    [`offline-indicator--${position}`]: position,
    'offline-indicator--expanded': showDetails
  });

  return (
    <div className={indicatorClasses}>
      <div 
        className="offline-indicator__status"
        onClick={() => setShowDetails(!showDetails)}
        title={`Click for details. Last sync: ${getTimeSince(status.lastSync)}`}
      >
        <span className="offline-indicator__icon">{getStatusIcon()}</span>
        <span className="offline-indicator__text">{getStatusText()}</span>
      </div>
      
      {showDetails && (
        <div className="offline-indicator__details">
          <div className="offline-indicator__detail-item">
            <strong>Status:</strong> {status.isOnline ? 'Online' : 'Offline'}
          </div>
          
          {status.syncInProgress && (
            <div className="offline-indicator__detail-item">
              <strong>Sync:</strong> In Progress
            </div>
          )}
          
          {status.queueLength > 0 && (
            <div className="offline-indicator__detail-item">
              <strong>Queue:</strong> {status.queueLength} action{status.queueLength > 1 ? 's' : ''} pending
            </div>
          )}
          
          <div className="offline-indicator__detail-item">
            <strong>Last Sync:</strong> {getTimeSince(status.lastSync)}
          </div>
          
          {status.storageInfo && (
            <div className="offline-indicator__detail-item">
              <strong>Local Events:</strong> {status.storageInfo.eventsSize > 0 ? 'Available' : 'None'}
              {status.storageInfo.isDataStale && ' (Stale)'}
            </div>
          )}
          
          {!status.isOnline && (
            <div className="offline-indicator__detail-item offline-indicator__warning">
              ⚠️ Working offline - changes will sync when connection is restored
            </div>
          )}
          
          {status.isOnline && !status.syncInProgress && (
            <button 
              className="offline-indicator__sync-btn"
              onClick={() => offlineManager.forceSync()}
              title="Force sync now"
            >
              Sync Now
            </button>
          )}
        </div>
      )}
    </div>
  );
};

OfflineIndicator.propTypes = {
  position: PropTypes.oneOf(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
  showOnlineStatus: PropTypes.bool
};

export default OfflineIndicator;