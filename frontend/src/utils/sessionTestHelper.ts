// Session timeout test utilities
// Use these functions in the browser console to test session functionality

export const sessionTestHelper = {
  // View current session info
  getCurrentSession() {
    const session = localStorage.getItem('authSession');
    if (!session) {
      console.log('❌ No session found');
      return null;
    }
    
    const parsed = JSON.parse(session);
    const now = Date.now() / 1000;
    const expiresAt = parsed.expires_at;
    const timeLeft = expiresAt ? Math.round((expiresAt - now) / 60) : 'Unknown';
    
    console.log('📋 Current Session Info:');
    console.log('├─ Expires at:', new Date(expiresAt * 1000).toLocaleString());
    console.log('├─ Time left:', timeLeft, 'minutes');
    console.log('├─ Has refresh token:', !!parsed.refresh_token);
    console.log('└─ Token preview:', parsed.access_token?.substring(0, 20) + '...');
    
    return parsed;
  },

  // Simulate an expired token (for testing logout)
  expireToken() {
    const session = localStorage.getItem('authSession');
    if (!session) {
      console.log('❌ No session to expire');
      return;
    }
    
    const parsed = JSON.parse(session);
    parsed.expires_at = Math.floor(Date.now() / 1000) - 60; // Expired 1 minute ago
    localStorage.setItem('authSession', JSON.stringify(parsed));
    
    console.log('⏰ Token expired artificially. Refresh page or wait for next check.');
  },

  // Simulate a token that expires soon (for testing refresh)
  expireSoon(minutes = 4) {
    const session = localStorage.getItem('authSession');
    if (!session) {
      console.log('❌ No session to modify');
      return;
    }
    
    const parsed = JSON.parse(session);
    parsed.expires_at = Math.floor(Date.now() / 1000) + (minutes * 60);
    localStorage.setItem('authSession', JSON.stringify(parsed));
    
    console.log(`⏳ Token set to expire in ${minutes} minutes. Should trigger refresh soon.`);
  },

  // Clear all session data
  clearSession() {
    localStorage.removeItem('authSession');
    console.log('🗑️ Session cleared');
  },

  // Monitor session changes
  startMonitoring() {
    console.log('👁️ Starting session monitoring...');
    
    const checkSession = () => {
      const session = this.getCurrentSession();
      if (session && session.expires_at) {
        const now = Date.now() / 1000;
        const timeLeft = Math.round((session.expires_at - now) / 60);
        console.log(`⏱️ [${new Date().toLocaleTimeString()}] Token expires in ${timeLeft} minutes`);
      }
    };
    
    checkSession();
    const interval = setInterval(checkSession, 30000); // Every 30 seconds
    
    console.log('✅ Monitoring started. Run sessionTestHelper.stopMonitoring() to stop.');
    (window as any).__sessionMonitor = interval;
  },

  stopMonitoring() {
    if ((window as any).__sessionMonitor) {
      clearInterval((window as any).__sessionMonitor);
      delete (window as any).__sessionMonitor;
      console.log('⏹️ Session monitoring stopped');
    }
  }
};

// sessionTestHelper is already exported above