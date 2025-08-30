/**
 * Offline Storage Service
 * Handles local storage of calendar events and application state
 * for offline functionality
 */

import { generateSecureId } from '../util/secure-random.mjs';

// Check if localStorage is available
const hasLocalStorage = (() => {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch (e) {
    return false;
  }
})();

class OfflineStorageService {
  constructor() {
    this.STORAGE_KEYS = {
      EVENTS: 'booking_pal_events',
      LAST_SYNC: 'booking_pal_last_sync',
      OFFLINE_QUEUE: 'booking_pal_offline_queue',
      APP_STATE: 'booking_pal_app_state',
      CONNECTION_STATE: 'booking_pal_connection_state'
    };
    
    // Initialize storage if it doesn't exist
    this.initializeStorage();
  }

  /**
   * Initialize storage with default values
   */
  initializeStorage() {
    if (!hasLocalStorage) {
      console.warn('localStorage not available - offline functionality will be limited');
      return;
    }
    
    if (!this.getEvents()) {
      this.setEvents([]);
    }
    
    if (!this.getOfflineQueue()) {
      this.setOfflineQueue([]);
    }
    
    if (!this.getConnectionState()) {
      // Safely check navigator.onLine
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      this.setConnectionState({
        isOnline: isOnline,
        lastOnlineAt: Date.now(),
        syncInProgress: false
      });
    }
  }

  /**
   * Store events locally
   * @param {Array} events - Array of calendar events
   */
  setEvents(events) {
    if (!hasLocalStorage) {
      console.warn('localStorage not available');
      return false;
    }
    
    try {
      const eventsWithTimestamp = {
        data: events,
        timestamp: Date.now(),
        version: '1.0'
      };
      localStorage.setItem(this.STORAGE_KEYS.EVENTS, JSON.stringify(eventsWithTimestamp));
      return true;
    } catch (error) {
      console.error('Failed to store events locally:', error);
      return false;
    }
  }

  /**
   * Retrieve stored events
   * @returns {Array} Array of calendar events
   */
  getEvents() {
    if (!hasLocalStorage) {
      return [];
    }
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.EVENTS);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      return parsed.data || [];
    } catch (error) {
      console.error('Failed to retrieve events from storage:', error);
      return [];
    }
  }

  /**
   * Get events with metadata
   * @returns {Object} Events with timestamp and version info
   */
  getEventsWithMetadata() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.EVENTS);
      if (!stored) return null;
      
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to retrieve events metadata:', error);
      return null;
    }
  }

  /**
   * Store last sync timestamp
   * @param {number} timestamp - Timestamp of last successful sync
   */
  setLastSync(timestamp = Date.now()) {
    localStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, timestamp.toString());
  }

  /**
   * Get last sync timestamp
   * @returns {number} Last sync timestamp
   */
  getLastSync() {
    const stored = localStorage.getItem(this.STORAGE_KEYS.LAST_SYNC);
    return stored ? parseInt(stored, 10) : 0;
  }

  /**
   * Add action to offline queue
   * @param {Object} action - Action to be performed when online
   */
  addToOfflineQueue(action) {
    try {
      const queue = this.getOfflineQueue();
      const queueItem = {
        id: `offline_${Date.now()}_${generateSecureId(9)}`,
        action: action,
        timestamp: Date.now(),
        attempts: 0
      };
      
      queue.push(queueItem);
      this.setOfflineQueue(queue);
      
      console.log('Added to offline queue:', queueItem);
      return queueItem.id;
    } catch (error) {
      console.error('Failed to add to offline queue:', error);
      return null;
    }
  }

  /**
   * Get offline queue
   * @returns {Array} Array of queued offline actions
   */
  getOfflineQueue() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.OFFLINE_QUEUE);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve offline queue:', error);
      return [];
    }
  }

  /**
   * Set offline queue
   * @param {Array} queue - Array of offline actions
   */
  setOfflineQueue(queue) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
      return true;
    } catch (error) {
      console.error('Failed to store offline queue:', error);
      return false;
    }
  }

  /**
   * Remove item from offline queue
   * @param {string} itemId - ID of item to remove
   */
  removeFromOfflineQueue(itemId) {
    try {
      const queue = this.getOfflineQueue();
      const updatedQueue = queue.filter(item => item.id !== itemId);
      this.setOfflineQueue(updatedQueue);
      return true;
    } catch (error) {
      console.error('Failed to remove from offline queue:', error);
      return false;
    }
  }

  /**
   * Clear offline queue
   */
  clearOfflineQueue() {
    this.setOfflineQueue([]);
  }

  /**
   * Store connection state
   * @param {Object} connectionState - Connection state object
   */
  setConnectionState(connectionState) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.CONNECTION_STATE, JSON.stringify(connectionState));
      return true;
    } catch (error) {
      console.error('Failed to store connection state:', error);
      return false;
    }
  }

  /**
   * Get connection state
   * @returns {Object} Connection state
   */
  getConnectionState() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.CONNECTION_STATE);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to retrieve connection state:', error);
      return null;
    }
  }

  /**
   * Store application state
   * @param {Object} appState - Application state
   */
  setAppState(appState) {
    try {
      const stateWithTimestamp = {
        ...appState,
        timestamp: Date.now()
      };
      localStorage.setItem(this.STORAGE_KEYS.APP_STATE, JSON.stringify(stateWithTimestamp));
      return true;
    } catch (error) {
      console.error('Failed to store app state:', error);
      return false;
    }
  }

  /**
   * Get application state
   * @returns {Object} Application state
   */
  getAppState() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.APP_STATE);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to retrieve app state:', error);
      return null;
    }
  }

  /**
   * Check if data is stale (older than specified age)
   * @param {number} maxAge - Maximum age in milliseconds (default: 5 minutes)
   * @returns {boolean} Whether the data is stale
   */
  isDataStale(maxAge = 5 * 60 * 1000) {
    const metadata = this.getEventsWithMetadata();
    if (!metadata || !metadata.timestamp) return true;
    
    return Date.now() - metadata.timestamp > maxAge;
  }

  /**
   * Get storage usage information
   * @returns {Object} Storage usage stats
   */
  getStorageInfo() {
    try {
      const events = localStorage.getItem(this.STORAGE_KEYS.EVENTS);
      const queue = localStorage.getItem(this.STORAGE_KEYS.OFFLINE_QUEUE);
      const appState = localStorage.getItem(this.STORAGE_KEYS.APP_STATE);
      
      return {
        eventsSize: events ? events.length : 0,
        queueSize: queue ? JSON.parse(queue).length : 0,
        appStateSize: appState ? appState.length : 0,
        totalSize: (events?.length || 0) + (queue?.length || 0) + (appState?.length || 0),
        lastSync: this.getLastSync(),
        isDataStale: this.isDataStale()
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return null;
    }
  }

  /**
   * Clear all stored data (useful for debugging/reset)
   */
  clearAll() {
    if (!hasLocalStorage) {
      console.warn('localStorage not available');
      return false;
    }
    
    try {
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      this.initializeStorage();
      console.log('Offline storage cleared and reinitialized');
      return true;
    } catch (error) {
      console.error('Failed to clear offline storage:', error);
      return false;
    }
  }
}

// Create singleton instance
const offlineStorage = new OfflineStorageService();

export default offlineStorage;
export { OfflineStorageService };