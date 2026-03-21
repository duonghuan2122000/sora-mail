import ProviderModel from '../../database/models/ProviderModel.js'

class OAuthConfigService {
  constructor() {
    this.isConfigured = false
  }

  async loadConfigFromEnv() {
    try {
      const gmailProvider = await ProviderModel.getGmailProvider()
      if (!gmailProvider) {
        console.error('Gmail provider not found in database')
        return false
      }

      const existingConfig = JSON.parse(gmailProvider.config)

      // Check if environment variables are set
      const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
      const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
      const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost'
      const scopes = process.env.GOOGLE_OAUTH_SCOPES
        ? process.env.GOOGLE_OAUTH_SCOPES.split(',')
        : [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/gmail.labels'
          ]

      // Only update if environment variables are provided
      if (clientId && clientSecret) {
        const updatedConfig = {
          ...existingConfig,
          clientId,
          clientSecret,
          redirectUri,
          scopes
        }

        // Update only if different
        if (JSON.stringify(existingConfig) !== JSON.stringify(updatedConfig)) {
          await ProviderModel.updateConfig(gmailProvider.id, updatedConfig)
          console.log('✅ OAuth configuration updated from environment variables')
          this.isConfigured = true
          return true
        }
      }

      // Check if config already has credentials
      if (existingConfig.clientId && existingConfig.clientSecret) {
        this.isConfigured = true
        console.log('✅ OAuth configuration already set')
        return true
      }

      console.warn(
        '⚠️  OAuth credentials not configured. Please set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET environment variables.'
      )
      return false
    } catch (error) {
      console.error('Error loading OAuth config from env:', error)
      return false
    }
  }

  async getConfigStatus() {
    try {
      const gmailProvider = await ProviderModel.getGmailProvider()
      if (!gmailProvider) {
        return {
          isConfigured: false,
          message: 'Gmail provider not found'
        }
      }

      const config = JSON.parse(gmailProvider.config)
      const hasCredentials = !!(config.clientId && config.clientSecret)

      return {
        isConfigured: hasCredentials,
        hasCredentials,
        config: {
          ...config,
          clientId: config.clientId ? '***' + config.clientId.slice(-4) : '',
          clientSecret: config.clientSecret ? '***' + config.clientSecret.slice(-4) : ''
        }
      }
    } catch (error) {
      console.error('Error getting config status:', error)
      return {
        isConfigured: false,
        message: error.message
      }
    }
  }

  async updateConfig(config) {
    try {
      const gmailProvider = await ProviderModel.getGmailProvider()
      if (!gmailProvider) {
        throw new Error('Gmail provider not found')
      }

      const existingConfig = JSON.parse(gmailProvider.config)
      const updatedConfig = {
        ...existingConfig,
        ...config
      }

      await ProviderModel.updateConfig(gmailProvider.id, updatedConfig)

      // Update internal state
      this.isConfigured = !!(updatedConfig.clientId && updatedConfig.clientSecret)

      return {
        success: true,
        message: 'Configuration updated successfully'
      }
    } catch (error) {
      console.error('Error updating config:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async resetConfig() {
    try {
      const gmailProvider = await ProviderModel.getGmailProvider()
      if (!gmailProvider) {
        throw new Error('Gmail provider not found')
      }

      const defaultConfig = {
        clientId: '',
        clientSecret: '',
        redirectUri: 'http://localhost',
        scopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/gmail.labels'
        ]
      }

      await ProviderModel.updateConfig(gmailProvider.id, defaultConfig)
      this.isConfigured = false

      return {
        success: true,
        message: 'Configuration reset to defaults'
      }
    } catch (error) {
      console.error('Error resetting config:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  getIsConfigured() {
    return this.isConfigured
  }
}

export default new OAuthConfigService()
