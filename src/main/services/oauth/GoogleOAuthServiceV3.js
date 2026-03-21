import { URL } from 'url'
import { OAuth2Client } from 'google-auth-library'
import crypto from 'crypto'
import ProviderModel from '../../database/models/ProviderModel.js'
import AccountModel from '../../database/models/AccountModel.js'

class GoogleOAuthService {
  constructor(electron) {
    this.electron = electron
    this.BrowserWindow = electron.BrowserWindow
    this.shell = electron.shell
    this.oauth2Client = null
    this.authWindow = null
    this.authState = null
    this.mainWindow = null
  }

  async initialize() {
    const gmailProvider = await ProviderModel.getGmailProvider()
    if (!gmailProvider) {
      throw new Error('Gmail provider not found in database')
    }

    const config = JSON.parse(gmailProvider.config)

    if (!config.clientId || !config.clientSecret) {
      throw new Error(
        'Google OAuth credentials not configured. Please add clientId and clientSecret to provider config.'
      )
    }

    this.oauth2Client = new OAuth2Client(
      config.clientId,
      config.clientSecret,
      config.redirectUri || 'http://localhost'
    )
  }

  setMainWindow(mainWindow) {
    this.mainWindow = mainWindow
  }

  async startOAuthFlow() {
    try {
      await this.initialize()

      // Generate state for CSRF protection
      this.authState = crypto.randomBytes(16).toString('hex')

      // Generate authorization URL
      const authUrl = this.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/gmail.labels',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile'
        ],
        state: this.authState,
        prompt: 'consent'
      })

      // Create auth window
      this.authWindow = new this.BrowserWindow({
        width: 800,
        height: 600,
        show: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      })

      // Load auth URL
      await this.authWindow.loadURL(authUrl)

      // Handle navigation events
      this.authWindow.webContents.on('will-navigate', (event, url) => {
        this.handleNavigation(url)
      })

      this.authWindow.webContents.on('did-redirect-navigation', (event, url) => {
        this.handleNavigation(url)
      })

      // Handle window close
      this.authWindow.on('closed', () => {
        this.authWindow = null
        // Notify main window that auth was cancelled
        if (this.mainWindow) {
          this.mainWindow.webContents.send('oauth:cancelled')
        }
      })

      return {
        success: true,
        message: 'OAuth window opened'
      }
    } catch (error) {
      console.error('Error starting OAuth flow:', error)
      throw error
    }
  }

  async handleNavigation(url) {
    try {
      const parsedUrl = new URL(url)

      // Check if this is the redirect URI
      if (
        parsedUrl.origin === 'http://localhost' ||
        parsedUrl.href.startsWith('http://localhost/')
      ) {
        const code = parsedUrl.searchParams.get('code')
        const state = parsedUrl.searchParams.get('state')
        const error = parsedUrl.searchParams.get('error')

        if (error) {
          throw new Error(`OAuth error: ${error}`)
        }

        if (!code || !state) {
          throw new Error('Invalid OAuth callback: missing code or state')
        }

        // Verify state
        if (state !== this.authState) {
          throw new Error('Invalid OAuth state: possible CSRF attack')
        }

        // Close auth window
        if (this.authWindow) {
          this.authWindow.close()
          this.authWindow = null
        }

        // Exchange code for tokens
        const { tokens } = await this.oauth2Client.getToken(code)
        this.oauth2Client.setCredentials(tokens)

        // Get user info
        const userInfoResponse = await this.oauth2Client.request({
          url: 'https://www.googleapis.com/oauth2/v2/userinfo'
        })

        const userInfo = userInfoResponse.data

        // Find or create account
        const gmailProvider = await ProviderModel.getGmailProvider()
        let account = await AccountModel.getByEmail(userInfo.email)

        if (!account) {
          account = await AccountModel.create({
            provider_id: gmailProvider.id,
            email: userInfo.email,
            display_name: userInfo.name || userInfo.email,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null
          })
        } else {
          // Update tokens for existing account
          account = await AccountModel.updateTokens(account.id, {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date
          })
        }

        // Notify main window of success
        if (this.mainWindow) {
          this.mainWindow.webContents.send('oauth:success', {
            account,
            userInfo
          })
        }

        return {
          success: true,
          account,
          userInfo
        }
      }
    } catch (error) {
      console.error('Error handling OAuth navigation:', error)

      // Close auth window if open
      if (this.authWindow) {
        this.authWindow.close()
        this.authWindow = null
      }

      // Notify main window of error
      if (this.mainWindow) {
        this.mainWindow.webContents.send('oauth:error', {
          error: error.message,
          details: error.toString()
        })
      }

      throw error
    }
  }

  async refreshToken(accountId) {
    try {
      await this.initialize()

      const account = await AccountModel.getById(accountId)
      if (!account) {
        throw new Error('Account not found')
      }

      if (!account.refresh_token) {
        throw new Error('No refresh token available')
      }

      this.oauth2Client.setCredentials({
        refresh_token: account.refresh_token
      })

      const { credentials } = await this.oauth2Client.refreshAccessToken()

      // Update tokens in database
      await AccountModel.updateTokens(accountId, {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || account.refresh_token,
        expiry_date: credentials.expiry_date
      })

      return credentials
    } catch (error) {
      console.error('Error refreshing token:', error)
      throw error
    }
  }

  async getGmailClient(accountId) {
    try {
      const account = await AccountModel.getAccountWithProvider(accountId)
      if (!account) {
        throw new Error('Account not found')
      }

      // Check if token needs refresh
      if (account.token_expiry && new Date(account.token_expiry) < new Date()) {
        await this.refreshToken(accountId)
      }

      await this.initialize()

      this.oauth2Client.setCredentials({
        access_token: account.access_token,
        refresh_token: account.refresh_token
      })

      return this.oauth2Client
    } catch (error) {
      console.error('Error getting Gmail client:', error)
      throw error
    }
  }

  async disconnectAccount(accountId) {
    try {
      // Clear tokens in database
      await AccountModel.updateTokens(accountId, {
        access_token: null,
        refresh_token: null,
        token_expiry: null
      })

      return { success: true }
    } catch (error) {
      console.error('Error disconnecting account:', error)
      throw error
    }
  }

  async getUserProfile(accountId) {
    try {
      const client = await this.getGmailClient(accountId)
      const response = await client.request({
        url: 'https://www.googleapis.com/gmail/v1/users/me/profile'
      })
      return response.data
    } catch (error) {
      console.error('Error getting user profile:', error)
      throw error
    }
  }

  async getLabels(accountId) {
    try {
      const client = await this.getGmailClient(accountId)
      const response = await client.request({
        url: 'https://www.googleapis.com/gmail/v1/users/me/labels'
      })
      return response.data.labels || []
    } catch (error) {
      console.error('Error getting labels:', error)
      throw error
    }
  }

  async getMessages(accountId, maxResults = 50) {
    try {
      const client = await this.getGmailClient(accountId)
      const response = await client.request({
        url: `https://www.googleapis.com/gmail/v1/users/me/messages`,
        params: {
          maxResults,
          labelIds: ['INBOX']
        }
      })
      return response.data.messages || []
    } catch (error) {
      console.error('Error getting messages:', error)
      throw error
    }
  }

  async getMessage(accountId, messageId) {
    try {
      const client = await this.getGmailClient(accountId)
      const response = await client.request({
        url: `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
        params: {
          format: 'full'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error getting message:', error)
      throw error
    }
  }

  async isAuthenticated(accountId) {
    try {
      const account = await AccountModel.getById(accountId)
      if (!account || !account.access_token) {
        return false
      }

      // Check if token is expired
      if (account.token_expiry && new Date(account.token_expiry) < new Date()) {
        if (account.refresh_token) {
          // Try to refresh
          try {
            await this.refreshToken(accountId)
            return true
          } catch {
            return false
          }
        } else {
          return false
        }
      } else {
        return true
      }
    } catch (error) {
      console.error('Error checking authentication:', error)
      return false
    }
  }
}

// Factory function to create service instance
export function createGoogleOAuthService(electron) {
  return new GoogleOAuthService(electron)
}

// Default export for singleton pattern
let serviceInstance = null
export default function getGoogleOAuthService(electron) {
  if (!serviceInstance && electron) {
    serviceInstance = new GoogleOAuthService(electron)
  }
  return serviceInstance
}
