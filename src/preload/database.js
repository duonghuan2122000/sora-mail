import { contextBridge, ipcRenderer } from 'electron'

const databaseApi = {
  // Database initialization
  initialize: () => ipcRenderer.invoke('database:initialize'),

  // Providers
  providers: {
    getAll: () => ipcRenderer.invoke('providers:getAll'),
    getById: (id) => ipcRenderer.invoke('providers:getById', id),
    getGmailProvider: () => ipcRenderer.invoke('providers:getGmailProvider')
  },

  // Accounts
  accounts: {
    getAll: () => ipcRenderer.invoke('accounts:getAll'),
    getById: (id) => ipcRenderer.invoke('accounts:getById', id),
    getByEmail: (email) => ipcRenderer.invoke('accounts:getByEmail', email),
    getActiveAccount: () => ipcRenderer.invoke('accounts:getActiveAccount'),
    create: (accountData) => ipcRenderer.invoke('accounts:create', accountData),
    updateTokens: (id, tokens) => ipcRenderer.invoke('accounts:updateTokens', { id, tokens }),
    updateSyncStatus: (id, lastSyncAt) =>
      ipcRenderer.invoke('accounts:updateSyncStatus', { id, lastSyncAt }),
    toggleSync: (id, enabled) => ipcRenderer.invoke('accounts:toggleSync', { id, enabled })
  },

  // Folders
  folders: {
    getAll: (accountId) => ipcRenderer.invoke('folders:getAll', accountId),
    getSystemFolders: (accountId) => ipcRenderer.invoke('folders:getSystemFolders', accountId),
    getUserFolders: (accountId) => ipcRenderer.invoke('folders:getUserFolders', accountId),
    getDefaultInbox: (accountId) => ipcRenderer.invoke('folders:getDefaultInbox', accountId),
    initializeSystemFolders: (accountId) =>
      ipcRenderer.invoke('folders:initializeSystemFolders', accountId),
    updateCounts: (id, unreadCount, totalCount) =>
      ipcRenderer.invoke('folders:updateCounts', { id, unreadCount, totalCount })
  },

  // Labels
  labels: {
    getAll: (accountId) => ipcRenderer.invoke('labels:getAll', accountId),
    initializeDefaultLabels: (accountId) =>
      ipcRenderer.invoke('labels:initializeDefaultLabels', accountId),
    getLabelsForMail: (mailId) => ipcRenderer.invoke('labels:getLabelsForMail', mailId),
    addLabelToMail: (mailId, labelId) =>
      ipcRenderer.invoke('labels:addLabelToMail', { mailId, labelId })
  },

  // Mails
  mails: {
    getAll: (folderId, options = {}) => ipcRenderer.invoke('mails:getAll', { folderId, options }),
    getById: (id) => ipcRenderer.invoke('mails:getById', id),
    getFullMail: (id) => ipcRenderer.invoke('mails:getFullMail', id),
    search: (accountId, searchTerm, options = {}) =>
      ipcRenderer.invoke('mails:search', { accountId, searchTerm, options }),
    create: (mailData) => ipcRenderer.invoke('mails:create', mailData),
    createMultiple: (mails) => ipcRenderer.invoke('mails:createMultiple', mails),
    toggleRead: (id) => ipcRenderer.invoke('mails:toggleRead', id),
    toggleStar: (id) => ipcRenderer.invoke('mails:toggleStar', id),
    toggleImportant: (id) => ipcRenderer.invoke('mails:toggleImportant', id),
    moveToFolder: (id, folderId) => ipcRenderer.invoke('mails:moveToFolder', { id, folderId }),
    delete: (id) => ipcRenderer.invoke('mails:delete', id),
    getUnreadCount: (folderId) => ipcRenderer.invoke('mails:getUnreadCount', folderId),
    getStarredCount: (folderId) => ipcRenderer.invoke('mails:getStarredCount', folderId),
    getTotalCount: (folderId) => ipcRenderer.invoke('mails:getTotalCount', folderId),
    getRecentMails: (accountId, limit = 20) =>
      ipcRenderer.invoke('mails:getRecentMails', { accountId, limit }),
    getUnreadMails: (accountId, limit = 50) =>
      ipcRenderer.invoke('mails:getUnreadMails', { accountId, limit }),
    getStarredMails: (accountId, limit = 50) =>
      ipcRenderer.invoke('mails:getStarredMails', { accountId, limit })
  },

  // Attachments
  attachments: {
    getAll: (mailId) => ipcRenderer.invoke('attachments:getAll', mailId),
    create: (attachmentData) => ipcRenderer.invoke('attachments:create', attachmentData)
  },

  // Filters
  filters: {
    getActiveFilters: (accountId) => ipcRenderer.invoke('filters:getActiveFilters', accountId)
  },

  // Settings
  settings: {
    get: (key) => ipcRenderer.invoke('settings:get', key),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value)
  },

  // Theme
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),

  // Migration
  migration: {
    migrateMockData: (accountId, folderId) =>
      ipcRenderer.invoke('migration:migrateMockData', { accountId, folderId })
  },

  // OAuth
  oauth: {
    // OAuth Flow
    startGmail: () => ipcRenderer.invoke('oauth:startGmail'),
    handleCallback: (url) => ipcRenderer.invoke('oauth:handleCallback', url),

    // Account Management
    getAccounts: () => ipcRenderer.invoke('oauth:getAccounts'),
    getAccount: (accountId) => ipcRenderer.invoke('oauth:getAccount', accountId),
    disconnectAccount: (accountId) => ipcRenderer.invoke('oauth:disconnectAccount', accountId),
    checkAuth: (accountId) => ipcRenderer.invoke('oauth:checkAuth', accountId),
    refreshToken: (accountId) => ipcRenderer.invoke('oauth:refreshToken', accountId),

    // Gmail API
    getGmailProfile: (accountId) => ipcRenderer.invoke('oauth:getGmailProfile', accountId),
    getGmailLabels: (accountId) => ipcRenderer.invoke('oauth:getGmailLabels', accountId),
    getGmailMessages: (accountId, maxResults) =>
      ipcRenderer.invoke('oauth:getGmailMessages', { accountId, maxResults }),
    getGmailMessage: (accountId, messageId) =>
      ipcRenderer.invoke('oauth:getGmailMessage', { accountId, messageId }),

    // Provider Configuration
    getGmailProviderConfig: () => ipcRenderer.invoke('oauth:getGmailProviderConfig'),
    updateGmailProviderConfig: (config) =>
      ipcRenderer.invoke('oauth:updateGmailProviderConfig', config),

    // Sync
    syncAccount: (accountId) => ipcRenderer.invoke('oauth:syncAccount', accountId),
    getSyncProgress: () => ipcRenderer.invoke('oauth:getSyncProgress'),
    isSyncing: () => ipcRenderer.invoke('oauth:isSyncing'),

    // Event Listeners
    onOAuthSuccess: (callback) => ipcRenderer.on('oauth:success', (event, data) => callback(data)),
    onOAuthError: (callback) => ipcRenderer.on('oauth:error', (event, data) => callback(data)),
    onOAuthCancelled: (callback) =>
      ipcRenderer.on('oauth:cancelled', (event, data) => callback(data)),
    onCallbackSuccess: (callback) =>
      ipcRenderer.on('oauth:callbackSuccess', (event, data) => callback(data)),
    onCallbackError: (callback) =>
      ipcRenderer.on('oauth:callbackError', (event, data) => callback(data)),
    onSyncStarted: (callback) => ipcRenderer.on('sync:started', (event, data) => callback(data)),
    onSyncCompleted: (callback) =>
      ipcRenderer.on('sync:completed', (event, data) => callback(data)),
    onSyncError: (callback) => ipcRenderer.on('sync:error', (event, data) => callback(data)),

    // Remove Event Listeners
    removeOAuthSuccess: () => ipcRenderer.removeAllListeners('oauth:success'),
    removeOAuthError: () => ipcRenderer.removeAllListeners('oauth:error'),
    removeOAuthCancelled: () => ipcRenderer.removeAllListeners('oauth:cancelled'),
    removeCallbackSuccess: () => ipcRenderer.removeAllListeners('oauth:callbackSuccess'),
    removeCallbackError: () => ipcRenderer.removeAllListeners('oauth:callbackError'),
    removeSyncStarted: () => ipcRenderer.removeAllListeners('sync:started'),
    removeSyncCompleted: () => ipcRenderer.removeAllListeners('sync:completed'),
    removeSyncError: () => ipcRenderer.removeAllListeners('sync:error')
  }
}

// Expose the API to the renderer process
try {
  contextBridge.exposeInMainWorld('database', databaseApi)
} catch (error) {
  console.error('Failed to expose database API:', error)
}
