/**
 * Offline Testing Utilities
 * Helper functions for testing offline functionality
 * These are available in development mode only
 */

import offlineManager from '../services/offline-manager';
import offlineStorage from '../services/offline-storage';

class OfflineTestUtils {
  /**
   * Simulate going offline
   */
  static simulateOffline() {
    console.log('🔌 Simulating offline mode...');
    
    // Dispatch offline event
    window.dispatchEvent(new Event('offline'));
    
    // Override navigator.onLine for testing
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });
    
    console.log('📱 Application is now in offline mode');
  }

  /**
   * Simulate going online
   */
  static simulateOnline() {
    console.log('🔌 Simulating online mode...');
    
    // Restore navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
    
    // Dispatch online event
    window.dispatchEvent(new Event('online'));
    
    console.log('📱 Application is now online');
  }

  /**
   * Add test events to local storage
   */
  static addTestEvents() {
    const testEvents = [
      {
        id: 'test_event_1',
        summary: 'Test Meeting 1',
        description: 'This is a test meeting stored locally',
        start: {
          dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
        },
        end: {
          dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
        },
        status: 'confirmed'
      },
      {
        id: 'test_event_2',
        summary: 'Test Meeting 2',
        description: 'Another test meeting',
        start: {
          dateTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString() // 3 hours from now
        },
        end: {
          dateTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours from now
        },
        status: 'confirmed'
      }
    ];

    offlineStorage.setEvents(testEvents);
    console.log('📅 Test events added to local storage:', testEvents.length);
    return testEvents;
  }

  /**
   * Clear all offline data
   */
  static clearOfflineData() {
    offlineStorage.clearAll();
    console.log('🗑️ All offline data cleared');
  }

  /**
   * Show current offline status
   */
  static showStatus() {
    const status = offlineManager.getStatus();
    console.log('📊 Current Offline Status:', {
      isOnline: status.isOnline,
      syncInProgress: status.syncInProgress,
      queueLength: status.queueLength,
      lastSync: status.lastSync ? new Date(status.lastSync).toLocaleString() : 'Never',
      hasLocalEvents: status.storageInfo?.eventsSize > 0,
      isDataStale: status.storageInfo?.isDataStale
    });
    return status;
  }

  /**
   * Add test action to offline queue
   */
  static addTestAction() {
    const queueId = offlineManager.queueAction('QUICK_RESERVATION', { duration: 30 });
    console.log('⏳ Test action queued:', queueId);
    return queueId;
  }

  /**
   * Force sync (if online)
   */
  static forceSync() {
    const status = offlineManager.getStatus();
    if (!status.isOnline) {
      console.warn('⚠️ Cannot sync while offline');
      return false;
    }
    
    offlineManager.forceSync();
    console.log('🔄 Manual sync triggered');
    return true;
  }

  /**
   * Test offline workflow
   */
  static async testOfflineWorkflow() {
    console.log('🧪 Starting offline workflow test...');
    
    // 1. Go offline
    this.simulateOffline();
    
    // 2. Add test events
    this.addTestEvents();
    
    // 3. Add test action to queue
    this.addTestAction();
    
    // 4. Show status
    this.showStatus();
    
    console.log('✅ Offline workflow test complete. App should show offline indicator.');
    console.log('💡 Use OfflineTestUtils.simulateOnline() to restore connection and trigger sync');
    
    return true;
  }

  /**
   * Test online workflow
   */
  static testOnlineWorkflow() {
    console.log('🧪 Testing online workflow...');
    
    // 1. Go online
    this.simulateOnline();
    
    // 2. Show status
    setTimeout(() => {
      this.showStatus();
      console.log('✅ Online workflow test complete. Sync should start automatically.');
    }, 1000);
    
    return true;
  }

  /**
   * Monitor offline events
   */
  static startMonitoring() {
    console.log('👀 Starting offline event monitoring...');
    
    const events = ['offline', 'online', 'syncStart', 'syncSuccess', 'syncError', 'actionQueued'];
    
    events.forEach(event => {
      offlineManager.addListener(event, (data) => {
        console.log(`📡 Offline Event [${event}]:`, data);
      });
    });
    
    console.log('✅ Monitoring started. Check console for offline events.');
  }

  /**
   * Get storage information
   */
  static getStorageInfo() {
    const info = offlineStorage.getStorageInfo();
    console.log('💾 Storage Information:', info);
    return info;
  }

  /**
   * Test connection check
   */
  static async testConnectionCheck() {
    console.log('🌐 Testing connection check...');
    
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      
      console.log('✅ Connection test passed - online');
      return true;
    } catch (error) {
      console.log('❌ Connection test failed - offline');
      return false;
    }
  }
}

// Expose to window in development mode
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.OfflineTestUtils = OfflineTestUtils;
  
  // Log instructions
  console.log(`
🧪 Offline Testing Utilities Available!

Available commands:
• OfflineTestUtils.testOfflineWorkflow() - Full offline test
• OfflineTestUtils.simulateOffline() - Go offline
• OfflineTestUtils.simulateOnline() - Go online  
• OfflineTestUtils.addTestEvents() - Add sample events
• OfflineTestUtils.showStatus() - Show current status
• OfflineTestUtils.forceSync() - Force sync
• OfflineTestUtils.clearOfflineData() - Clear all data
• OfflineTestUtils.startMonitoring() - Monitor events
• OfflineTestUtils.getStorageInfo() - Storage details

Example workflow:
1. OfflineTestUtils.testOfflineWorkflow()
2. Try booking a room (will queue offline)
3. OfflineTestUtils.simulateOnline()
4. Watch sync happen automatically
  `);
}

export default OfflineTestUtils;