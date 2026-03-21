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

  // Migration
  migration: {
    migrateMockData: (accountId, folderId) =>
      ipcRenderer.invoke('migration:migrateMockData', { accountId, folderId })
  }
}

// Expose the API to the renderer process
try {
  contextBridge.exposeInMainWorld('database', databaseApi)
} catch (error) {
  console.error('Failed to expose database API:', error)
}
