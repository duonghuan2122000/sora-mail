import { ipcMain } from 'electron'
import database from '../database/index.js'
import ProviderModel from '../database/models/ProviderModel.js'
import AccountModel from '../database/models/AccountModel.js'
import FolderModel from '../database/models/FolderModel.js'
import LabelModel from '../database/models/LabelModel.js'
import MailModel from '../database/models/MailModel.js'
import AttachmentModel from '../database/models/AttachmentModel.js'
import FilterModel from '../database/models/FilterModel.js'
import SettingsModel from '../database/models/SettingsModel.js'

class DatabaseService {
  constructor() {
    this.initializeIpcHandlers()
  }

  initializeIpcHandlers() {
    // Database initialization
    ipcMain.handle('database:initialize', async () => {
      try {
        await database.initialize()
        return { success: true }
      } catch (error) {
        console.error('Database initialization error:', error)
        return { success: false, error: error.message }
      }
    })

    // Provider handlers
    ipcMain.handle('providers:getAll', async () => {
      return ProviderModel.getAll()
    })

    ipcMain.handle('providers:getById', async (event, id) => {
      return ProviderModel.getById(id)
    })

    ipcMain.handle('providers:getGmailProvider', async () => {
      return ProviderModel.getGmailProvider()
    })

    // Account handlers
    ipcMain.handle('accounts:getAll', async () => {
      return AccountModel.getAll()
    })

    ipcMain.handle('accounts:getById', async (event, id) => {
      return AccountModel.getById(id)
    })

    ipcMain.handle('accounts:getByEmail', async (event, email) => {
      return AccountModel.getByEmail(email)
    })

    ipcMain.handle('accounts:getActiveAccount', async () => {
      return AccountModel.getActiveAccount()
    })

    ipcMain.handle('accounts:create', async (event, accountData) => {
      return AccountModel.create(accountData)
    })

    ipcMain.handle('accounts:updateTokens', async (event, { id, tokens }) => {
      return AccountModel.updateTokens(id, tokens)
    })

    ipcMain.handle('accounts:updateSyncStatus', async (event, { id, lastSyncAt }) => {
      return AccountModel.updateSyncStatus(id, lastSyncAt)
    })

    ipcMain.handle('accounts:toggleSync', async (event, { id, enabled }) => {
      return AccountModel.toggleSync(id, enabled)
    })

    // Folder handlers
    ipcMain.handle('folders:getAll', async (event, accountId) => {
      return FolderModel.getAll(accountId)
    })

    ipcMain.handle('folders:getSystemFolders', async (event, accountId) => {
      return FolderModel.getSystemFolders(accountId)
    })

    ipcMain.handle('folders:getUserFolders', async (event, accountId) => {
      return FolderModel.getUserFolders(accountId)
    })

    ipcMain.handle('folders:getDefaultInbox', async (event, accountId) => {
      return FolderModel.getDefaultInbox(accountId)
    })

    ipcMain.handle('folders:initializeSystemFolders', async (event, accountId) => {
      return FolderModel.initializeSystemFolders(accountId)
    })

    ipcMain.handle('folders:updateCounts', async (event, { id, unreadCount, totalCount }) => {
      return FolderModel.updateCounts(id, unreadCount, totalCount)
    })

    // Label handlers
    ipcMain.handle('labels:getAll', async (event, accountId) => {
      return LabelModel.getAll(accountId)
    })

    ipcMain.handle('labels:initializeDefaultLabels', async (event, accountId) => {
      return LabelModel.initializeDefaultLabels(accountId)
    })

    ipcMain.handle('labels:getLabelsForMail', async (event, mailId) => {
      return LabelModel.getLabelsForMail(mailId)
    })

    ipcMain.handle('labels:addLabelToMail', async (event, { mailId, labelId }) => {
      return LabelModel.addLabelToMail(mailId, labelId)
    })

    // Mail handlers
    ipcMain.handle('mails:getAll', async (event, { folderId, options = {} }) => {
      return MailModel.getAll(folderId, options)
    })

    ipcMain.handle('mails:getById', async (event, id) => {
      return MailModel.getById(id)
    })

    ipcMain.handle('mails:getFullMail', async (event, id) => {
      return MailModel.getFullMail(id)
    })

    ipcMain.handle('mails:search', async (event, { accountId, searchTerm, options = {} }) => {
      return MailModel.search(accountId, searchTerm, options)
    })

    ipcMain.handle('mails:create', async (event, mailData) => {
      return MailModel.create(mailData)
    })

    ipcMain.handle('mails:createMultiple', async (event, mails) => {
      return MailModel.createMultiple(mails)
    })

    ipcMain.handle('mails:toggleRead', async (event, id) => {
      return MailModel.toggleRead(id)
    })

    ipcMain.handle('mails:toggleStar', async (event, id) => {
      return MailModel.toggleStar(id)
    })

    ipcMain.handle('mails:toggleImportant', async (event, id) => {
      return MailModel.toggleImportant(id)
    })

    ipcMain.handle('mails:moveToFolder', async (event, { id, folderId }) => {
      return MailModel.moveToFolder(id, folderId)
    })

    ipcMain.handle('mails:delete', async (event, id) => {
      return MailModel.delete(id)
    })

    ipcMain.handle('mails:getUnreadCount', async (event, folderId) => {
      return MailModel.getUnreadCount(folderId)
    })

    ipcMain.handle('mails:getStarredCount', async (event, folderId) => {
      return MailModel.getStarredCount(folderId)
    })

    ipcMain.handle('mails:getTotalCount', async (event, folderId) => {
      return MailModel.getTotalCount(folderId)
    })

    ipcMain.handle('mails:getRecentMails', async (event, { accountId, limit = 20 }) => {
      return MailModel.getRecentMails(accountId, limit)
    })

    ipcMain.handle('mails:getUnreadMails', async (event, { accountId, limit = 50 }) => {
      return MailModel.getUnreadMails(accountId, limit)
    })

    ipcMain.handle('mails:getStarredMails', async (event, { accountId, limit = 50 }) => {
      return MailModel.getStarredMails(accountId, limit)
    })

    // Attachment handlers
    ipcMain.handle('attachments:getAll', async (event, mailId) => {
      return AttachmentModel.getAll(mailId)
    })

    ipcMain.handle('attachments:create', async (event, attachmentData) => {
      return AttachmentModel.create(attachmentData)
    })

    // Filter handlers
    ipcMain.handle('filters:getActiveFilters', async (event, accountId) => {
      return FilterModel.getActiveFilters(accountId)
    })

    // Settings handlers
    ipcMain.handle('settings:get', async (event, key) => {
      return SettingsModel.get(key)
    })

    ipcMain.handle('settings:set', async (event, key, value) => {
      return SettingsModel.set(key, value)
    })

    // Theme handlers (specific shortcuts)
    ipcMain.handle('get-theme', async () => {
      return SettingsModel.get('theme') || 'light'
    })

    ipcMain.handle('set-theme', async (event, theme) => {
      return SettingsModel.set('theme', theme)
    })

    // Migration handlers for mock data
    ipcMain.handle('migration:migrateMockData', async (event, { accountId, folderId }) => {
      return this.migrateMockData(accountId, folderId)
    })
  }

  async migrateMockData(accountId, folderId) {
    try {
      const mockMails = [
        {
          account_id: accountId,
          folder_id: folderId,
          sender_name: 'Google',
          sender_email: 'no-reply@accounts.google.com',
          subject: 'Security alert for your Google Account',
          preview: 'New sign-in from Windows on Chrome',
          is_unread: 1,
          is_important: 1,
          received_at: new Date().toISOString()
        },
        {
          account_id: accountId,
          folder_id: folderId,
          sender_name: 'GitHub',
          sender_email: 'notifications@github.com',
          subject: '[GitHub] A repository you starred has a new release',
          preview: 'vuejs/core released v3.4.0',
          is_unread: 0,
          is_starred: 1,
          received_at: new Date(Date.now() - 86400000).toISOString() // Yesterday
        },
        {
          account_id: accountId,
          folder_id: folderId,
          sender_name: 'Amazon',
          sender_email: 'order-update@amazon.com',
          subject: 'Your Amazon order #123-456789-101112 has shipped',
          preview: 'Your package is on the way',
          is_unread: 0,
          received_at: new Date(Date.now() - 2 * 86400000).toISOString() // 2 days ago
        },
        {
          account_id: accountId,
          folder_id: folderId,
          sender_name: 'LinkedIn',
          sender_email: 'network@linkedin.com',
          subject: 'You have 3 new connection requests',
          preview: 'Expand your professional network',
          is_unread: 1,
          received_at: new Date(Date.now() - 3 * 86400000).toISOString() // 3 days ago
        },
        {
          account_id: accountId,
          folder_id: folderId,
          sender_name: 'Netflix',
          sender_email: 'info@netflix.com',
          subject: 'Your monthly subscription receipt',
          preview: 'Your Netflix membership has been renewed',
          is_unread: 0,
          is_starred: 1,
          received_at: new Date(Date.now() - 4 * 86400000).toISOString() // 4 days ago
        }
      ]

      const mailIds = await MailModel.createMultiple(mockMails)

      // Update folder counts
      const unreadCount = mockMails.filter((mail) => mail.is_unread).length
      const totalCount = mockMails.length
      await FolderModel.updateCounts(folderId, unreadCount, totalCount)

      return {
        success: true,
        count: mailIds.length,
        mailIds
      }
    } catch (error) {
      console.error('Migration error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default new DatabaseService()
