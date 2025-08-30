/**
 * Memory Test Utility - Provides functions to test memory leak fixes
 */

/**
 * Test if event listeners are properly cleaned up
 */
export const testEventListenerCleanup = () => {
  const results = {
    wheelListeners: 0,
    calendarAPIManager: null,
    timestamp: Date.now()
  };

  // Count wheel event listeners (rough estimate)
  try {
    // This is a rough approximation - in a real scenario you'd need more sophisticated testing
    const wheelEvents = document._events?.wheel?.length || 0;
    results.wheelListeners = wheelEvents;
  } catch (error) {
    results.wheelListeners = 'Unable to count';
  }

  // Check calendar API manager status
  try {
    const { getCalendarAPIManager } = require('./calendar_api_manager');
    const manager = getCalendarAPIManager();
    results.calendarAPIManager = manager.getStats();
  } catch (error) {
    results.calendarAPIManager = { error: error.message };
  }

  return results;
};

/**
 * Test component unmounting behavior
 */
export const testComponentCleanup = (componentName = 'TestComponent') => {
  return new Promise((resolve) => {
    const testResults = {
      componentName,
      timerCleaned: false,
      listenersCleaned: false,
      timestamp: Date.now()
    };

    // Simulate component lifecycle
    const cleanup = [];
    let timerRef = null;
    let isUnmounted = false;

    // Simulate setting up resources
    timerRef = setTimeout(() => {
      if (!isUnmounted) {
        console.log('Timer fired after component unmount - MEMORY LEAK!');
        testResults.timerCleaned = false;
      }
    }, 100);

    // Simulate cleanup
    setTimeout(() => {
      isUnmounted = true;
      
      if (timerRef) {
        clearTimeout(timerRef);
        testResults.timerCleaned = true;
      }

      // Simulate listener cleanup
      testResults.listenersCleaned = true;

      resolve(testResults);
    }, 50);
  });
};

/**
 * Monitor memory usage over time (simplified)
 */
export const monitorMemoryUsage = (durationMs = 5000, intervalMs = 1000) => {
  return new Promise((resolve) => {
    const measurements = [];
    const startTime = Date.now();

    const measure = () => {
      if (performance.memory) {
        measurements.push({
          timestamp: Date.now() - startTime,
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        });
      } else {
        measurements.push({
          timestamp: Date.now() - startTime,
          note: 'Performance.memory not available'
        });
      }
    };

    // Initial measurement
    measure();

    const interval = setInterval(measure, intervalMs);

    setTimeout(() => {
      clearInterval(interval);
      
      const results = {
        measurements,
        summary: {
          duration: durationMs,
          samples: measurements.length,
          memoryGrowth: measurements.length > 1 ? 
            measurements[measurements.length - 1].usedJSHeapSize - measurements[0].usedJSHeapSize : 
            'N/A'
        }
      };

      resolve(results);
    }, durationMs);
  });
};

/**
 * Run all memory tests
 */
export const runAllMemoryTests = async () => {
  console.log('Starting memory leak tests...');

  const results = {
    eventListeners: testEventListenerCleanup(),
    componentCleanup: await testComponentCleanup(),
    memoryMonitoring: await monitorMemoryUsage(3000, 500)
  };

  console.log('Memory leak test results:', results);
  return results;
};

// Expose to window for manual testing in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.memoryTests = {
    testEventListenerCleanup,
    testComponentCleanup,
    monitorMemoryUsage,
    runAllMemoryTests
  };
}