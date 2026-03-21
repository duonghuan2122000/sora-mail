// Database client for renderer process
// This provides a clean API to interact with the database via IPC

class DatabaseClient {
  constructor() {
    if (!window.database) {
      throw new Error(
        'Database API not available. Make sure the preload script is loaded correctly.'
      )
    }
    this.api = window.database
  }

  // Database initialization
  async initialize() {
    return this.api.initialize()
  }

  // Providers
  async getProviders() {
    return this.api.providers.getAll()
  }

  async getProviderById(id) {
    return this.api.providers.getById(id)
  }

  async getGmailProvider() {
    return this.api.providers.getGmailProvider()
  }

  // Accounts
  async getAccounts() {
    return this.api.accounts.getAll()
  }

  async getAccountById(id) {
    return this.api.accounts.getById(id)
  }

  async getAccountByEmail(email) {
    return this.api.accounts.getByEmail(email)
  }

  async getActiveAccount() {
    console.log(this.api)
    return this.api.accounts.getActiveAccount()
  }

  async createAccount(accountData) {
    return this.api.accounts.create(accountData)
  }

  async updateAccountTokens(id, tokens) {
    return this.api.accounts.updateTokens(id, tokens)
  }

  async updateAccountSyncStatus(id, lastSyncAt = null) {
    return this.api.accounts.updateSyncStatus(id, lastSyncAt)
  }

  async toggleAccountSync(id, enabled) {
    return this.api.accounts.toggleSync(id, enabled)
  }

  // Folders
  async getFolders(accountId) {
    return this.api.folders.getAll(accountId)
  }

  async getSystemFolders(accountId) {
    return this.api.folders.getSystemFolders(accountId)
  }

  async getUserFolders(accountId) {
    return this.api.folders.getUserFolders(accountId)
  }

  async getDefaultInbox(accountId) {
    return this.api.folders.getDefaultInbox(accountId)
  }

  async initializeSystemFolders(accountId) {
    return this.api.folders.initializeSystemFolders(accountId)
  }

  async updateFolderCounts(id, unreadCount, totalCount) {
    return this.api.folders.updateCounts(id, unreadCount, totalCount)
  }

  // Labels
  async getLabels(accountId) {
    return this.api.labels.getAll(accountId)
  }

  async initializeDefaultLabels(accountId) {
    return this.api.labels.initializeDefaultLabels(accountId)
  }

  async getLabelsForMail(mailId) {
    return this.api.labels.getLabelsForMail(mailId)
  }

  async addLabelToMail(mailId, labelId) {
    return this.api.labels.addLabelToMail(mailId, labelId)
  }

  // Mails
  async getMails(folderId, options = {}) {
    return this.api.mails.getAll(folderId, options)
  }

  async getMailById(id) {
    return this.api.mails.getById(id)
  }

  async getFullMail(id) {
    return this.api.mails.getFullMail(id)
  }

  async searchMails(accountId, searchTerm, options = {}) {
    return this.api.mails.search(accountId, searchTerm, options)
  }

  async createMail(mailData) {
    return this.api.mails.create(mailData)
  }

  async createMultipleMails(mails) {
    return this.api.mails.createMultiple(mails)
  }

  async toggleMailRead(id) {
    return this.api.mails.toggleRead(id)
  }

  async toggleMailStar(id) {
    return this.api.mails.toggleStar(id)
  }

  async toggleMailImportant(id) {
    return this.api.mails.toggleImportant(id)
  }

  async moveMailToFolder(id, folderId) {
    return this.api.mails.moveToFolder(id, folderId)
  }

  async deleteMail(id) {
    return this.api.mails.delete(id)
  }

  async getMailCounts(folderId) {
    const [unreadCount, starredCount, totalCount] = await Promise.all([
      this.api.mails.getUnreadCount(folderId),
      this.api.mails.getStarredCount(folderId),
      this.api.mails.getTotalCount(folderId)
    ])
    return { unreadCount, starredCount, totalCount }
  }

  async getRecentMails(accountId, limit = 20) {
    return this.api.mails.getRecentMails(accountId, limit)
  }

  async getUnreadMails(accountId, limit = 50) {
    return this.api.mails.getUnreadMails(accountId, limit)
  }

  async getStarredMails(accountId, limit = 50) {
    return this.api.mails.getStarredMails(accountId, limit)
  }

  // Attachments
  async getAttachments(mailId) {
    return this.api.attachments.getAll(mailId)
  }

  async createAttachment(attachmentData) {
    return this.api.attachments.create(attachmentData)
  }

  // Filters
  async getActiveFilters(accountId) {
    return this.api.filters.getActiveFilters(accountId)
  }

  // Migration
  async migrateMockData(accountId, folderId) {
    return this.api.migration.migrateMockData(accountId, folderId)
  }

  // Helper methods for common operations
  async initializeAccountData(accountId) {
    // Initialize system folders
    const folders = await this.initializeSystemFolders(accountId)

    // Initialize default labels
    const labels = await this.initializeDefaultLabels(accountId)

    // Get default inbox folder
    const inboxFolder = folders.find((f) => f.name === 'INBOX')

    return {
      folders,
      labels,
      inboxFolder
    }
  }

  async getMailListData(folderId) {
    const [mails, counts] = await Promise.all([
      this.getMails(folderId, { limit: 50 }),
      this.getMailCounts(folderId)
    ])

    return {
      mails,
      counts
    }
  }

  async getMailDetailData(mailId) {
    const mail = await this.getFullMail(mailId)
    if (!mail) return null

    // Format mail data for UI
    return {
      ...mail,
      // Parse recipients if stored as JSON
      // recipients: mail.recipients ? JSON.parse(mail.recipients) : [],
      // Ensure boolean values
      is_unread: Boolean(mail.is_unread),
      is_starred: Boolean(mail.is_starred),
      is_important: Boolean(mail.is_important),
      has_attachments: Boolean(mail.has_attachments)
    }
  }
}

// Create singleton instance
const databaseClient = new DatabaseClient()

export default databaseClient
