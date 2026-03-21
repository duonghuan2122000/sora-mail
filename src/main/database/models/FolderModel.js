import database from '../index.js'

class FolderModel {
  constructor() {
    this.tableName = 'folders'
  }

  async getAll(accountId) {
    const db = await database.getDb()
    return db(this.tableName)
      .where({ account_id: accountId })
      .orderBy('type', 'asc')
      .orderBy('display_name', 'asc')
  }

  async getById(id) {
    const db = await database.getDb()
    return db(this.tableName).where({ id }).first()
  }

  async getByName(accountId, name) {
    const db = await database.getDb()
    return db(this.tableName).where({ account_id: accountId, name }).first()
  }

  async getSystemFolders(accountId) {
    const db = await database.getDb()
    return db(this.tableName)
      .where({ account_id: accountId, type: 'system' })
      .orderBy('display_name', 'asc')
  }

  async getUserFolders(accountId) {
    const db = await database.getDb()
    return db(this.tableName)
      .where({ account_id: accountId, type: 'user' })
      .orderBy('display_name', 'asc')
  }

  async create(folderData) {
    const id = await database.insert(this.tableName, {
      ...folderData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    return this.getById(id)
  }

  async createMultiple(folders) {
    const now = new Date().toISOString()

    const foldersWithTimestamps = folders.map((folder) => ({
      ...folder,
      created_at: now,
      updated_at: now
    }))

    return database.insertMultiple(this.tableName, foldersWithTimestamps)
  }

  async update(id, folderData) {
    const db = await database.getDb()
    await db(this.tableName)
      .where({ id })
      .update({
        ...folderData,
        updated_at: new Date().toISOString()
      })
    return this.getById(id)
  }

  async updateCounts(id, unreadCount, totalCount) {
    const db = await database.getDb()
    await db(this.tableName).where({ id }).update({
      unread_count: unreadCount,
      total_count: totalCount,
      updated_at: new Date().toISOString()
    })
    return this.getById(id)
  }

  async incrementCounts(id, unreadDelta = 0, totalDelta = 0) {
    const db = await database.getDb()
    await db(this.tableName)
      .where({ id })
      .increment({
        unread_count: unreadDelta,
        total_count: totalDelta
      })
      .update({
        updated_at: new Date().toISOString()
      })
    return this.getById(id)
  }

  async updateSyncState(id, syncState) {
    const db = await database.getDb()
    await db(this.tableName).where({ id }).update({
      sync_state: syncState,
      updated_at: new Date().toISOString()
    })
    return this.getById(id)
  }

  async delete(id) {
    const db = await database.getDb()
    return db(this.tableName).where({ id }).delete()
  }

  async deleteByAccount(accountId) {
    const db = await database.getDb()
    return db(this.tableName).where({ account_id: accountId }).delete()
  }

  async getDefaultInbox(accountId) {
    return this.getByName(accountId, 'INBOX')
  }

  async initializeSystemFolders(accountId) {
    const systemFolders = [
      {
        account_id: accountId,
        name: 'INBOX',
        display_name: 'Inbox',
        type: 'system'
      },
      {
        account_id: accountId,
        name: 'SENT',
        display_name: 'Sent',
        type: 'system'
      },
      {
        account_id: accountId,
        name: 'DRAFTS',
        display_name: 'Drafts',
        type: 'system'
      },
      {
        account_id: accountId,
        name: 'TRASH',
        display_name: 'Trash',
        type: 'system'
      },
      {
        account_id: accountId,
        name: 'SPAM',
        display_name: 'Spam',
        type: 'system'
      },
      {
        account_id: accountId,
        name: 'STARRED',
        display_name: 'Starred',
        type: 'system'
      },
      {
        account_id: accountId,
        name: 'IMPORTANT',
        display_name: 'Important',
        type: 'system'
      }
    ]

    // Check which folders already exist
    const existingFolders = await this.getAll(accountId)
    const existingFolderNames = existingFolders.map((f) => f.name)

    const foldersToCreate = systemFolders.filter(
      (folder) => !existingFolderNames.includes(folder.name)
    )

    if (foldersToCreate.length > 0) {
      await this.createMultiple(foldersToCreate)
    }

    return this.getAll(accountId)
  }
}

export default new FolderModel()
