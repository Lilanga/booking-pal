/**
 * Offline Manager Service
 * Handles offline detection, connection monitoring, and sync coordination
 */

// Ensure browser environment compatibility
const isBrowser = typeof window !== 'undefined' && typeof window.navigator !== 'undefined';
const isElectron = isBrowser && window.electron;

import offlineStorage from './offline-storage';
import { getCalendarAPIManager } from '../util/calendar_api_manager';

class OfflineManager {
  constructor() {
    // Safely check navigator.onLine
    this.isOnline = isBrowser ? navigator.onLine : true;
    this.listeners = new Map();
    this.syncInProgress = false;
    this.connectionCheckInterval = null;
    this.heartbeatInterval = 30000; // Check connection every 30 seconds
    
    // Only initialize in browser environment
    if (isBrowser) {
      this.init();
    }
  }

  /**
   * Initialize offline manager
   */
  init() {
    this.setupEventListeners();
    this.startHeartbeat();
    this.loadConnectionState();
    
    console.log('OfflineManager initialized, online status:', this.isOnline);
  }

  /**
   * Setup connection event listeners
   */
  setupEventListeners() {
    if (!isBrowser) return;
    
    // Browser online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Electron-specific events if available
    if (isElectron) {
      // Listen for network connectivity changes via main process
      window.electron.onNetworkChange?.(this.handleNetworkChange.bind(this));
    }

    // Page visibility changes (for mobile/background detection)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
  }

  /**
   * Start connection heartbeat monitoring
   */
  startHeartbeat() {
    this.connectionCheckInterval = setInterval(() => {
      this.checkConnection();
    }, this.heartbeatInterval);
  }

  /**
   * Stop connection heartbeat monitoring
   */
  stopHeartbeat() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  /**
   * Check actual network connectivity (not just navigator.onLine)
   */
  async checkConnection() {
    if (!isBrowser || typeof fetch === 'undefined') {
      return this.isOnline;
    }
    
    try {
      // Try to reach a reliable endpoint that responds to HEAD requests
      const response = await fetch('https://www.google.com/', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        timeout: 5000
      });
      
      // If we get here, we have connectivity
      if (!this.isOnline) {
        this.handleOnline();
      }
      
      return true;
    } catch (error) {
      // No connectivity
      if (this.isOnline) {
        this.handleOffline();
      }
      
      return false;
    }
  }

  /**
   * Handle going online
   */
  async handleOnline() {
    const wasOffline = !this.isOnline;
    this.isOnline = true;
    
    const connectionState = {
      isOnline: true,
      lastOnlineAt: Date.now(),
      syncInProgress: false
    };
    
    offlineStorage.setConnectionState(connectionState);
    
    console.log('Connection restored');
    this.notifyListeners('online', { wasOffline });
    
    // Start sync process if we were offline
    if (wasOffline) {
      this.startSync();
    }
  }

  /**
   * Handle going offline
   */
  handleOffline() {
    this.isOnline = false;
    
    const connectionState = offlineStorage.getConnectionState() || {};
    connectionState.isOnline = false;
    connectionState.lastOfflineAt = Date.now();
    
    offlineStorage.setConnectionState(connectionState);
    
    console.log('Connection lost - entering offline mode');
    this.notifyListeners('offline', { timestamp: Date.now() });
  }

  /**
   * Handle network change (Electron-specific)
   */
  handleNetworkChange(networkState) {
    console.log('Network change detected:', networkState);
    
    if (networkState.isOnline && !this.isOnline) {
      this.handleOnline();
    } else if (!networkState.isOnline && this.isOnline) {
      this.handleOffline();
    }
  }

  /**
   * Handle page visibility changes
   */
  handleVisibilityChange() {
    if (!isBrowser || typeof document === 'undefined') return;
    
    if (!document.hidden && this.isOnline) {
      // Page became visible and we're online - check if we need to sync
      this.checkForStaleData();
    }
  }

  /**
   * Check if local data is stale and trigger sync if needed
   */
  async checkForStaleData() {
    if (offlineStorage.isDataStale(2 * 60 * 1000)) { // 2 minutes staleness
      console.log('Data is stale, triggering sync');
      this.startSync();
    }
  }

  /**
   * Start synchronization process
   */
  async startSync() {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;
    this.notifyListeners('syncStart');
    
    try {
      // Update connection state
      const connectionState = offlineStorage.getConnectionState() || {};
      connectionState.syncInProgress = true;
      offlineStorage.setConnectionState(connectionState);

      console.log('Starting offline sync...');
      
      // First, process offline queue
      await this.processOfflineQueue();
      
      // Then fetch fresh data
      await this.fetchFreshData();
      
      // Update last sync timestamp
      offlineStorage.setLastSync();
      
      console.log('Offline sync completed successfully');
      this.notifyListeners('syncSuccess');
      
    } catch (error) {
      console.error('Sync failed:', error);
      this.notifyListeners('syncError', { error });
    } finally {
      this.syncInProgress = false;
      
      const connectionState = offlineStorage.getConnectionState() || {};
      connectionState.syncInProgress = false;
      offlineStorage.setConnectionState(connectionState);
    }
  }

  /**
   * Process queued offline actions
   */
  async processOfflineQueue() {
    const queue = offlineStorage.getOfflineQueue();
    
    if (queue.length === 0) {
      return;
    }

    console.log(`Processing ${queue.length} offline actions...`);
    
    for (const queueItem of queue) {
      try {
        await this.processQueueItem(queueItem);
        offlineStorage.removeFromOfflineQueue(queueItem.id);
      } catch (error) {
        console.error(`Failed to process queue item ${queueItem.id}:`, error);
        
        // Increment attempt count
        queueItem.attempts = (queueItem.attempts || 0) + 1;
        
        // Remove from queue if too many attempts
        if (queueItem.attempts >= 3) {
          console.warn(`Removing queue item ${queueItem.id} after ${queueItem.attempts} attempts`);
          offlineStorage.removeFromOfflineQueue(queueItem.id);
          this.notifyListeners('queueItemFailed', { queueItem, error });
        }
      }
    }
  }

  /**
   * Process individual queue item
   */
  async processQueueItem(queueItem) {
    const { action } = queueItem;
    
    if (!window.calendarAPI) {
      throw new Error('Calendar API not available');
    }

    switch (action.type) {
      case 'QUICK_RESERVATION':
        return new Promise((resolve, reject) => {
          const apiManager = getCalendarAPIManager();
          
          window.calendarAPI.quickReservation(action.duration, action.startTime);
          
          const successHandler = () => {
            apiManager.removeListener('quick-reservation-success', successHandler);
            apiManager.removeListener('quick-reservation-failure', failureHandler);
            resolve();
          };
          
          const failureHandler = (error) => {
            apiManager.removeListener('quick-reservation-success', successHandler);
            apiManager.removeListener('quick-reservation-failure', failureHandler);
            reject(error);
          };
          
          apiManager.addListener('quick-reservation-success', successHandler);
          apiManager.addListener('quick-reservation-failure', failureHandler);
        });

      case 'FINISH_RESERVATION':
        return new Promise((resolve, reject) => {
          const apiManager = getCalendarAPIManager();
          
          window.calendarAPI.finishReservation(action.eventId);
          
          const successHandler = () => {
            apiManager.removeListener('finish-reservation-success', successHandler);
            apiManager.removeListener('finish-reservation-failure', failureHandler);
            resolve();
          };
          
          const failureHandler = (error) => {
            apiManager.removeListener('finish-reservation-success', successHandler);
            apiManager.removeListener('finish-reservation-failure', failureHandler);
            reject(error);
          };
          
          apiManager.addListener('finish-reservation-success', successHandler);
          apiManager.addListener('finish-reservation-failure', failureHandler);
        });

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Fetch fresh data from server
   */
  async fetchFreshData() {
    if (!window.calendarAPI) {
      throw new Error('Calendar API not available');
    }

    return new Promise((resolve, reject) => {
      const apiManager = getCalendarAPIManager();
      
      window.calendarAPI.listEvents();
      
      const successHandler = (events) => {
        apiManager.removeListener('list-events-success', successHandler);
        apiManager.removeListener('list-events-failure', failureHandler);
        
        // Store events locally
        offlineStorage.setEvents(events);
        resolve(events);
      };
      
      const failureHandler = (error) => {
        apiManager.removeListener('list-events-success', successHandler);
        apiManager.removeListener('list-events-failure', failureHandler);
        reject(error);
      };
      
      apiManager.addListener('list-events-success', successHandler);
      apiManager.addListener('list-events-failure', failureHandler);
    });
  }

  /**
   * Queue action for offline processing
   */
  queueAction(actionType, actionData) {
    const action = {
      type: actionType,
      ...actionData,
      queuedAt: Date.now()
    };
    
    const queueId = offlineStorage.addToOfflineQueue(action);
    
    if (queueId) {
      this.notifyListeners('actionQueued', { queueId, action });
      console.log(`Action queued for offline processing: ${actionType}`);
    }
    
    return queueId;
  }

  /**
   * Load connection state from storage
   */
  loadConnectionState() {
    const stored = offlineStorage.getConnectionState();
    if (stored) {
      this.isOnline = stored.isOnline && navigator.onLine;
    }
  }

  /**
   * Add event listener
   */
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Notify all listeners of an event
   */
  notifyListeners(event, data = {}) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in offline manager listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      queueLength: offlineStorage.getOfflineQueue().length,
      lastSync: offlineStorage.getLastSync(),
      connectionState: offlineStorage.getConnectionState(),
      storageInfo: offlineStorage.getStorageInfo()
    };
  }

  /**
   * Force sync (for manual trigger)
   */
  forceSync() {
    if (this.isOnline) {
      this.startSync();
    } else {
      console.warn('Cannot sync while offline');
    }
  }

  /**
   * Cleanup - remove listeners and intervals
   */
  destroy() {
    this.stopHeartbeat();
    
    if (isBrowser) {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
      
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      }
    }
    
    this.listeners.clear();
    
    console.log('OfflineManager destroyed');
  }
}

// Create singleton instance
const offlineManager = new OfflineManager();

export default offlineManager;
export { OfflineManager };