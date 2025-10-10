// Development tools - automatically loaded in dev mode
import { sessionTestHelper } from './sessionTestHelper';

// Make development tools available globally
declare global {
  interface Window {
    sessionTestHelper: typeof sessionTestHelper;
    // Add other dev tools here in the future
  }
}

// Initialize dev tools
if (import.meta.env.DEV) {
  window.sessionTestHelper = sessionTestHelper;
  
  console.log('🛠️ Development tools loaded:');
  console.log('├─ sessionTestHelper - Test session timeout functionality');
  console.log('└─ Use these tools in the browser console');
}