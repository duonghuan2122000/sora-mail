import { createGoogleOAuthService } from './GoogleOAuthServiceV3.js'
import GmailSyncService from '../sync/GmailSyncService.js'
import AccountModel from '../../database/models/AccountModel.js'
import ProviderModel from '../../database/models/ProviderModel.js'

class OAuthIpcHandlers {
  constructor(electron, ipcMain) {
    console.log('🔧 Initializing OAuthIpcHandlers...')
    console.log('📋 Electron modules received:', Object.keys(electron))
    console.log('📋 ipcMain received:', ipcMain ? 'yes' : 'no')

    this.mainWindow = null
    this.rendererWindow = null
    this.electron = electron
    this.ipcMain = ipcMain
    this.oauthService = null
    this.syncService = new GmailSyncService(electron)

    console.log('📋 Before initializeIpcHandlers')
    this.initializeIpcHandlers()
    console.log('✅ OAuthIpcHandlers initialized successfully')
  }

  setMainWindow(window) {
    this.mainWindow = window
  }

  initializeIpcHandlers() {
    try {
      console.log('🔧 Registering OAuth IPC handlers...')
      console.log('📋 Available IPC handlers will be registered')

      // Create OAuth service instance
      this.oauthService = createGoogleOAuthService(this.electron)

      // OAuth Flow Handlers
      console.log('📋 Registering handler: oauth:startGmail')
      this.ipcMain.handle('oauth:startGmail', async (event) => {
        try {
          // Set main window for OAuth service
          this.oauthService.setMainWindow(event.sender)

          // Start OAuth flow
          await this.oauthService.startOAuthFlow()

          return {
            success: true,
            message: 'OAuth window opened. Please complete authentication in the popup window.'
          }
        } catch (error) {
          console.error('Error starting OAuth flow:', error)
          return {
            success: false,
            error: error.message,
            details: error.toString()
          }
        }
      })

      this.ipcMain.handle('oauth:handleCallback', async (event, url) => {
        try {
          const result = await this.oauthService.handleNavigation(url)

          // Notify renderer of success
          if (this.mainWindow) {
            this.mainWindow.webContents.send('oauth:callbackSuccess', {
              account: result.account,
              userInfo: result.userInfo
            })
          }

          return {
            success: true,
            account: result.account,
            userInfo: result.userInfo
          }
        } catch (error) {
          console.error('Error handling OAuth callback:', error)

          // Notify renderer of error
          if (this.mainWindow) {
            this.mainWindow.webContents.send('oauth:callbackError', {
              error: error.message,
              details: error.toString()
            })
          }

          return {
            success: false,
            error: error.message,
            details: error.toString()
          }
        }
      })

      // Account Management Handlers
      console.log('📋 Registering handler: oauth:getAccounts')
      this.ipcMain.handle('oauth:getAccounts', async () => {
        try {
          const accounts = await AccountModel.getAll()
          return {
            success: true,
            accounts
          }
        } catch (error) {
          console.error('Error getting accounts:', error)
          return {
            success: false,
            error: error.message
          }
        }
      })

      this.ipcMain.handle('oauth:getAccount', async (event, accountId) => {
        try {
          const account = await AccountModel.getById(accountId)
          if (!account) {
            return {
              success: false,
              error: 'Account not found'
            }
          }

          return {
            success: true,
            account
          }
        } catch (error) {
          console.error('Error getting account:', error)
          return {
            success: false,
            error: error.message
          }
        }
      })

      this.ipcMain.handle('oauth:disconnectAccount', async (event, accountId) => {
        try {
          await this.oauthService.disconnectAccount(accountId)
          return {
            success: true,
            message: 'Account disconnected successfully'
          }
        } catch (error) {
          console.error('Error disconnecting account:', error)
          return {
            success: false,
            error: error.message
          }
        }
      })

      this.ipcMain.handle('oauth:checkAuth', async (event, accountId) => {
        try {
          const isAuthenticated = await this.oauthService.isAuthenticated(accountId)
          return {
            success: true,
            isAuthenticated
          }
        } catch (error) {
          console.error('Error checking authentication:', error)
          return {
            success: false,
            error: error.message,
            isAuthenticated: false
          }
        }
      })

      this.ipcMain.handle('oauth:refreshToken', async (event, accountId) => {
        try {
          const tokens = await this.oauthService.refreshToken(accountId)
          return {
            success: true,
            tokens
          }
        } catch (error) {
          console.error('Error refreshing token:', error)
          return {
            success: false,
            error: error.message
          }
        }
      })

      // Gmail API Handlers
      this.ipcMain.handle('oauth:getGmailProfile', async (event, accountId) => {
        try {
          const profile = await this.oauthService.getUserProfile(accountId)
          return {
            success: true,
            profile
          }
        } catch (error) {
          console.error('Error getting Gmail profile:', error)
          return {
            success: false,
            error: error.message
          }
        }
      })

      this.ipcMain.handle('oauth:getGmailLabels', async (event, accountId) => {
        try {
          const labels = await this.oauthService.getLabels(accountId)
          return {
            success: true,
            labels
          }
        } catch (error) {
          console.error('Error getting Gmail labels:', error)
          return {
            success: false,
            error: error.message
          }
        }
      })

      this.ipcMain.handle(
        'oauth:getGmailMessages',
        async (event, { accountId, maxResults = 50 }) => {
          try {
            const messages = await this.oauthService.getMessages(accountId, maxResults)
            return {
              success: true,
              messages
            }
          } catch (error) {
            console.error('Error getting Gmail messages:', error)
            return {
              success: false,
              error: error.message
            }
          }
        }
      )

      this.ipcMain.handle('oauth:getGmailMessage', async (event, { accountId, messageId }) => {
        try {
          const message = await this.oauthService.getMessage(accountId, messageId)
          return {
            success: true,
            message
          }
        } catch (error) {
          console.error('Error getting Gmail message:', error)
          return {
            success: false,
            error: error.message
          }
        }
      })

      // Provider Configuration Handlers
      console.log('📋 Registering handler: oauth:getGmailProviderConfig')
      this.ipcMain.handle('oauth:getGmailProviderConfig', async () => {
        try {
          const provider = await ProviderModel.getGmailProvider()
          if (!provider) {
            return {
              success: false,
              error: 'Gmail provider not found'
            }
          }

          const config = JSON.parse(provider.config)
          return {
            success: true,
            config: {
              ...config,
              clientId: config.clientId ? '***' + config.clientId.slice(-4) : '',
              clientSecret: config.clientSecret ? '***' + config.clientSecret.slice(-4) : ''
            }
          }
        } catch (error) {
          console.error('Error getting provider config:', error)
          return {
            success: false,
            error: error.message
          }
        }
      })

      this.ipcMain.handle('oauth:updateGmailProviderConfig', async (event, config) => {
        try {
          const provider = await ProviderModel.getGmailProvider()
          if (!provider) {
            return {
              success: false,
              error: 'Gmail provider not found'
            }
          }

          // Merge with existing config
          const existingConfig = JSON.parse(provider.config)
          const updatedConfig = {
            ...existingConfig,
            ...config
          }

          await ProviderModel.updateConfig(provider.id, updatedConfig)

          // Reinitialize OAuth service with new config
          await this.oauthService.initialize()

          return {
            success: true,
            message: 'Provider configuration updated successfully'
          }
        } catch (error) {
          console.error('Error updating provider config:', error)
          return {
            success: false,
            error: error.message
          }
        }
      })

      // Sync Handlers
      this.ipcMain.handle('oauth:syncAccount', async (event, accountId) => {
        try {
          // Get account info
          const account = await AccountModel.getById(accountId)
          if (!account) {
            return {
              success: false,
              error: 'Account not found'
            }
          }

          // Start sync process
          if (this.mainWindow) {
            this.mainWindow.webContents.send('sync:started', { accountId })
          }

          // Use GmailSyncService for comprehensive sync
          const syncResult = await this.syncService.syncAccount(accountId)

          // Update sync status
          await AccountModel.updateSyncStatus(accountId, new Date())

          if (this.mainWindow) {
            this.mainWindow.webContents.send('sync:completed', {
              accountId,
              profile: syncResult.profile,
              labelsCount: syncResult.labelsCount,
              messagesCount: syncResult.messagesCount
            })
          }

          return {
            success: true,
            ...syncResult
          }
        } catch (error) {
          console.error('Error syncing account:', error)

          if (this.mainWindow) {
            this.mainWindow.webContents.send('sync:error', {
              accountId,
              error: error.message
            })
          }

          return {
            success: false,
            error: error.message
          }
        }
      })

      // Sync Progress Handlers
      this.ipcMain.handle('oauth:getSyncProgress', async () => {
        try {
          const progress = this.syncService.getProgress()
          return {
            success: true,
            progress
          }
        } catch (error) {
          console.error('Error getting sync progress:', error)
          return {
            success: false,
            error: error.message
          }
        }
      })

      this.ipcMain.handle('oauth:isSyncing', async () => {
        try {
          const isSyncing = this.syncService.isSyncingNow()
          return {
            success: true,
            isSyncing
          }
        } catch (error) {
          console.error('Error checking sync status:', error)
          return {
            success: false,
            error: error.message
          }
        }
      })

      // Event Listeners for renderer
      this.ipcMain.on('oauth:listen', (event) => {
        // Store reference to renderer for sending events
        this.rendererWindow = event.sender
      })

      console.log('✅ OAuth IPC handlers registered successfully')
      // Note: this.ipcMain._events may not be accessible in newer Electron versions
      console.log('📋 OAuth handlers should be registered now')
    } catch (error) {
      console.error('❌ Error registering OAuth IPC handlers:', error)
      throw error
    }
  }

  sendToRenderer(channel, data) {
    if (this.rendererWindow) {
      this.rendererWindow.send(channel, data)
    }
  }
}

// Export class for creating instances
export class OAuthIpcHandlersClass {
  constructor(electron) {
    return new OAuthIpcHandlers(electron)
  }
}

// Default export for backward compatibility
export default function createOAuthIpcHandlers(electron, ipcMain) {
  return new OAuthIpcHandlers(electron, ipcMain)
}
