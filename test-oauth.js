// Test script to check OAuthIpcHandlers initialization
import { createOAuthIpcHandlers } from './src/main/services/oauth/OAuthIpcHandlers.js'

// Mock Electron modules
const mockElectron = {
  BrowserWindow: class MockBrowserWindow {
    constructor() {
      console.log('MockBrowserWindow created')
    }
  },
  shell: {
    openExternal: () => console.log('openExternal called')
  }
}

// Mock ipcMain
const mockIpcMain = {
  handle: (channel) => {
    console.log(`Handler registered for channel: ${channel}`)
  },
  on: (channel) => {
    console.log(`Listener registered for channel: ${channel}`)
  }
}

try {
  console.log('Testing OAuthIpcHandlers initialization...')
  const handlers = createOAuthIpcHandlers(mockElectron, mockIpcMain)
  console.log('✅ OAuthIpcHandlers created successfully')
  console.log('Handlers instance:', handlers)
} catch (error) {
  console.error('❌ Error creating OAuthIpcHandlers:', error)
  console.error('Stack:', error.stack)
}
