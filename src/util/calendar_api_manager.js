/**
 * Calendar API Manager - Manages calendar API listeners to prevent memory leaks
 */

class CalendarAPIManager {
  constructor() {
    this.listeners = new Map();
    this.isDestroyed = false;
  }

  /**
   * Add a listener with automatic cleanup tracking
   * @param {string} eventType - Type of event (e.g., 'list-events-success')
   * @param {Function} callback - Callback function
   * @param {string} [id] - Optional unique identifier for the listener
   * @returns {string} Listener ID for manual removal
   */
  addListener(eventType, callback, id) {
    if (this.isDestroyed) {
      console.warn('Attempting to add listener to destroyed CalendarAPIManager');
      return null;
    }

    if (!window.calendarAPI) {
      console.warn('Calendar API not available');
      return null;
    }

    const listenerId = id || `${eventType}_${Date.now()}_${Math.random()}`;
    const methodName = this.getMethodName(eventType);

    if (!methodName || typeof window.calendarAPI[methodName] !== 'function') {
      console.warn(`Calendar API method ${methodName} not available`);
      return null;
    }

    try {
      // Add the listener
      window.calendarAPI[methodName](callback);
      
      // Track it for cleanup
      this.listeners.set(listenerId, {
        eventType,
        callback,
        methodName,
        timestamp: Date.now()
      });

      return listenerId;
    } catch (error) {
      console.error(`Error adding calendar API listener ${eventType}:`, error);
      return null;
    }
  }

  /**
   * Remove a specific listener
   * @param {string} listenerId - ID of listener to remove
   */
  removeListener(listenerId) {
    if (!listenerId || !this.listeners.has(listenerId)) {
      return;
    }

    const listener = this.listeners.get(listenerId);
    this.listeners.delete(listenerId);

    // Note: Current calendar API doesn't have individual listener removal,
    // so we'll rely on removeAllListeners for cleanup
    console.debug(`Marked listener ${listenerId} for removal`);
  }

  /**
   * Remove all listeners and cleanup
   */
  removeAllListeners() {
    if (this.isDestroyed) {
      return;
    }

    try {
      if (window.calendarAPI && typeof window.calendarAPI.removeAllListeners === 'function') {
        window.calendarAPI.removeAllListeners();
      }
    } catch (error) {
      console.error('Error removing calendar API listeners:', error);
    }

    this.listeners.clear();
  }

  /**
   * Destroy the manager and cleanup all resources
   */
  destroy() {
    if (this.isDestroyed) {
      return;
    }

    this.removeAllListeners();
    this.isDestroyed = true;
  }

  /**
   * Get the appropriate method name for an event type
   * @param {string} eventType - Event type
   * @returns {string} Method name
   */
  getMethodName(eventType) {
    const eventMap = {
      'list-events-success': 'onListEventsSuccess',
      'list-events-failure': 'onListEventsFailure',
      'status-event-success': 'onStatusEventSuccess',
      'status-event-failure': 'onStatusEventFailure',
      'quick-reservation-success': 'onQuickReservationSuccess',
      'quick-reservation-failure': 'onQuickReservationFailure',
      'finish-reservation-success': 'onFinishReservationSuccess',
      'finish-reservation-failure': 'onFinishReservationFailure'
    };

    return eventMap[eventType];
  }

  /**
   * Get statistics about current listeners
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      listenerCount: this.listeners.size,
      isDestroyed: this.isDestroyed,
      oldestListener: this.listeners.size > 0 ? 
        Math.min(...Array.from(this.listeners.values()).map(l => l.timestamp)) : 
        null
    };
  }
}

// Create a global instance
let globalManager = null;

/**
 * Get the global calendar API manager instance
 * @returns {CalendarAPIManager} Manager instance
 */
export const getCalendarAPIManager = () => {
  if (!globalManager || globalManager.isDestroyed) {
    globalManager = new CalendarAPIManager();
  }
  return globalManager;
};

/**
 * Destroy the global manager (useful for testing)
 */
export const destroyGlobalManager = () => {
  if (globalManager) {
    globalManager.destroy();
    globalManager = null;
  }
};

export default CalendarAPIManager;