import { URL } from 'url'
import { google } from 'googleapis'
import crypto from 'crypto'
import ProviderModel from '../../database/models/ProviderModel.js'
import AccountModel from '../../database/models/AccountModel.js'

// We'll use shell from electron which will be passed from main process
// or we can use a different approach

class GoogleOAuthService {
  constructor() {
    this.oauth2Client = null
    this.authWindow = null
    this.authState = null
    this.callbacks = new Map()
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

    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    )

    google.options({ auth: this.oauth2Client })
  }

  async startOAuthFlow(callback) {
    try {
      await this.initialize()

      // Generate state for CSRF protection
      this.authState = crypto.randomBytes(16).toString('hex')
      const callbackId = Date.now().toString()

      // Store callback
      this.callbacks.set(callbackId, callback)

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
        state: `${this.authState}:${callbackId}`,
        prompt: 'consent'
      })

      // Open in external browser for better UX
      await open(authUrl)

      // Return callback ID for tracking
      return { callbackId, authUrl }
    } catch (error) {
      console.error('Error starting OAuth flow:', error)
      throw error
    }
  }

  async handleOAuthCallback(url) {
    try {
      const parsedUrl = new URL(url)
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
      const [authState, callbackId] = state.split(':')
      if (authState !== this.authState) {
        throw new Error('Invalid OAuth state: possible CSRF attack')
      }

      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code)
      this.oauth2Client.setCredentials(tokens)

      // Get user info
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client })
      const userInfo = await oauth2.userinfo.get()

      // Find or create account
      const gmailProvider = await ProviderModel.getGmailProvider()
      let account = await AccountModel.getByEmail(userInfo.data.email)

      if (!account) {
        account = await AccountModel.create({
          provider_id: gmailProvider.id,
          email: userInfo.data.email,
          display_name: userInfo.data.name || userInfo.data.email,
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

      // Execute callback if exists
      const callback = this.callbacks.get(callbackId)
      if (callback) {
        callback(null, {
          account,
          tokens,
          userInfo: userInfo.data
        })
        this.callbacks.delete(callbackId)
      }

      // Clear auth state
      this.authState = null

      return {
        success: true,
        account,
        userInfo: userInfo.data
      }
    } catch (err) {
      console.error('Error handling OAuth callback:', err)

      // Execute callback with error
      const callbackId = this.extractCallbackIdFromState(url)
      if (callbackId) {
        const callback = this.callbacks.get(callbackId)
        if (callback) {
          callback(err, null)
          this.callbacks.delete(callbackId)
        }
      }

      throw err
    }
  }

  extractCallbackIdFromState(url) {
    try {
      const parsedUrl = new URL(url)
      const state = parsedUrl.searchParams.get('state')
      if (state) {
        const [, callbackId] = state.split(':')
        return callbackId
      }
    } catch {
      // Ignore parsing errors
    }
    return null
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
    } catch {
      console.warn('Could not revoke token')
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

      return google.gmail({ version: 'v1', auth: this.oauth2Client })
    } catch (error) {
      console.error('Error getting Gmail client:', error)
      throw error
    }
  }

  async getUserProfile(accountId) {
    try {
      const gmail = await this.getGmailClient(accountId)
      const response = await gmail.users.getProfile({ userId: 'me' })
      return response.data
    } catch (error) {
      console.error('Error getting user profile:', error)
      throw error
    }
  }

  async getLabels(accountId) {
    try {
      const gmail = await this.getGmailClient(accountId)
      const response = await gmail.users.labels.list({ userId: 'me' })
      return response.data.labels || []
    } catch (error) {
      console.error('Error getting labels:', error)
      throw error
    }
  }

  async getMessages(accountId, maxResults = 50) {
    try {
      const gmail = await this.getGmailClient(accountId)
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        labelIds: ['INBOX']
      })

      return response.data.messages || []
    } catch (error) {
      console.error('Error getting messages:', error)
      throw error
    }
  }

  async getMessage(accountId, messageId) {
    try {
      const gmail = await this.getGmailClient(accountId)
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      })
      return response.data
    } catch (error) {
      console.error('Error getting message:', error)
      throw error
    }
  }

  async disconnectAccount(accountId) {
    try {
      // Revoke token if possible
      const account = await AccountModel.getById(accountId)
      if (account && account.access_token) {
        try {
          await this.initialize()
          await this.oauth2Client.revokeToken(account.access_token)
        } catch (revokeError) {
          console.warn('Could not revoke token:', revokeError)
        }
      }

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

export default new GoogleOAuthService()
