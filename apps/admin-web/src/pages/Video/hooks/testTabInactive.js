/**
 * Test script for tab inactivity scenarios
 * Run these commands in the browser console to test different scenarios
 */

// Test 1: Simulate tab becoming inactive
function simulateTabInactive() {
  console.log('🧪 Testing tab inactive scenario...');
  
  // Simulate visibility change to hidden
  Object.defineProperty(document, 'visibilityState', { 
    value: 'hidden', 
    writable: true 
  });
  document.dispatchEvent(new Event('visibilitychange'));
  
  console.log('✅ Tab is now inactive. Check console for logs.');
}

// Test 2: Simulate tab becoming active again
function simulateTabActive() {
  console.log('🧪 Testing tab active scenario...');
  
  // Simulate visibility change to visible
  Object.defineProperty(document, 'visibilityState', { 
    value: 'visible', 
    writable: true 
  });
  document.dispatchEvent(new Event('visibilitychange'));
  
  console.log('✅ Tab is now active. Check console for logs.');
}

// Test 3: Simulate network disconnection
function simulateNetworkOffline() {
  console.log('🧪 Testing network offline scenario...');
  
  // Simulate offline event
  window.dispatchEvent(new Event('offline'));
  
  console.log('✅ Network is now offline. Check console for logs.');
}

// Test 4: Simulate network reconnection
function simulateNetworkOnline() {
  console.log('🧪 Testing network online scenario...');
  
  // Simulate online event
  window.dispatchEvent(new Event('online'));
  
  console.log('✅ Network is now online. Check console for logs.');
}

// Test 5: Simulate video going black
function simulateVideoBlack() {
  console.log('🧪 Testing video black scenario...');
  
  // Find video element and simulate black video
  const video = document.querySelector('video');
  if (video) {
    // Simulate video dimensions becoming 0
    Object.defineProperty(video, 'videoWidth', { value: 0, writable: true });
    Object.defineProperty(video, 'videoHeight', { value: 0, writable: true });
    Object.defineProperty(video, 'readyState', { value: 0, writable: true });
    
    console.log('✅ Video is now black. Watchdog should detect and recover.');
  } else {
    console.log('❌ No video element found');
  }
}

// Test 6: Simulate sleep detection (timer drift)
function simulateSleepDetection() {
  console.log('🧪 Testing sleep detection scenario...');
  
  // This would normally be detected by the sleep detector in useBootstrap
  // when the interval takes longer than 60 seconds to fire
  console.log('✅ Sleep detection would trigger if tab was inactive for >60s');
}

// Test 7: Simulate WebSocket disconnection and reconnection
function simulateWebSocketDisconnect() {
  console.log('🧪 Testing WebSocket disconnection scenario...');
  
  // Simulate WebSocket disconnection
  window.dispatchEvent(new Event('offline'));
  
  console.log('✅ Network is now offline. WebSocket should disconnect.');
  console.log('💡 Wait a few seconds, then run testNetworkOnline() to test reconnection');
}

// Test 8: Simulate WebSocket reconnection with auto-resume
function simulateWebSocketReconnect() {
  console.log('🧪 Testing WebSocket reconnection with auto-resume...');
  
  // Simulate network coming back online
  window.dispatchEvent(new Event('online'));
  
  console.log('✅ Network is now online. WebSocket should reconnect and auto-resume streaming if applicable.');
}

// Export functions to global scope for easy testing
window.testTabInactive = simulateTabInactive;
window.testTabActive = simulateTabActive;
window.testNetworkOffline = simulateNetworkOffline;
window.testNetworkOnline = simulateNetworkOnline;
window.testVideoBlack = simulateVideoBlack;
window.testSleepDetection = simulateSleepDetection;
window.testWebSocketDisconnect = simulateWebSocketDisconnect;
window.testWebSocketReconnect = simulateWebSocketReconnect;

console.log(`
🧪 Tab Inactivity Test Suite Loaded!

Available test functions:
- testTabInactive()         - Simulate tab becoming inactive
- testTabActive()           - Simulate tab becoming active
- testNetworkOffline()      - Simulate network disconnection
- testNetworkOnline()       - Simulate network reconnection
- testVideoBlack()          - Simulate video going black
- testSleepDetection()      - Info about sleep detection
- testWebSocketDisconnect() - Simulate WebSocket disconnection
- testWebSocketReconnect()  - Simulate WebSocket reconnection with auto-resume

Usage: Run any function in the console to test that scenario.
Example: testTabInactive()
`);
