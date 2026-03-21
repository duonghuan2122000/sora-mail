import database from '../index.js'

class MailModel {
  constructor() {
    this.tableName = 'mails'
  }

  async getAll(folderId, options = {}) {
    const db = await database.getDb()
    let query = db(this.tableName).where({ folder_id: folderId })

    if (options.is_unread !== undefined) {
      query = query.where({ is_unread: options.is_unread ? 1 : 0 })
    }

    if (options.is_starred !== undefined) {
      query = query.where({ is_starred: options.is_starred ? 1 : 0 })
    }

    if (options.is_important !== undefined) {
      query = query.where({ is_important: options.is_important ? 1 : 0 })
    }

    // Default ordering by received date (newest first)
    query = query.orderBy('received_at', 'desc')

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.offset(options.offset)
    }

    return query
  }

  async getById(id) {
    const db = await database.getDb()
    return db(this.tableName).where({ id }).first()
  }

  async getByMessageId(accountId, messageId) {
    const db = await database.getDb()
    return db(this.tableName).where({ account_id: accountId, message_id: messageId }).first()
  }

  async getByThreadId(accountId, threadId) {
    const db = await database.getDb()
    return db(this.tableName)
      .where({ account_id: accountId, thread_id: threadId })
      .orderBy('received_at', 'asc')
  }

  async getUnreadCount(folderId) {
    const db = await database.getDb()
    const result = await db(this.tableName)
      .where({ folder_id: folderId, is_unread: 1 })
      .count('id as count')
      .first()
    return result?.count || 0
  }

  async getStarredCount(folderId) {
    const db = await database.getDb()
    const result = await db(this.tableName)
      .where({ folder_id: folderId, is_starred: 1 })
      .count('id as count')
      .first()
    return result?.count || 0
  }

  async getTotalCount(folderId) {
    const db = await database.getDb()
    const result = await db(this.tableName)
      .where({ folder_id: folderId })
      .count('id as count')
      .first()
    return result?.count || 0
  }

  async search(accountId, searchTerm, options = {}) {
    const db = await database.getDb()
    let query = db(this.tableName).where({ account_id: accountId })

    // Search in multiple fields
    query = query.where(function () {
      this.where('sender_name', 'like', `%${searchTerm}%`)
        .orWhere('sender_email', 'like', `%${searchTerm}%`)
        .orWhere('subject', 'like', `%${searchTerm}%`)
        .orWhere('preview', 'like', `%${searchTerm}%`)
        .orWhere('body', 'like', `%${searchTerm}%`)
    })

    if (options.folder_id) {
      query = query.where({ folder_id: options.folder_id })
    }

    if (options.is_unread !== undefined) {
      query = query.where({ is_unread: options.is_unread ? 1 : 0 })
    }

    if (options.is_starred !== undefined) {
      query = query.where({ is_starred: options.is_starred ? 1 : 0 })
    }

    query = query.orderBy('received_at', 'desc')

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.offset(options.offset)
    }

    return query
  }

  async create(mailData) {
    const id = await database.insert(this.tableName, {
      ...mailData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    return this.getById(id)
  }

  async createMultiple(mails) {
    const now = new Date().toISOString()

    const mailsWithTimestamps = mails.map((mail) => ({
      ...mail,
      created_at: now,
      updated_at: now
    }))

    return database.insertMultiple(this.tableName, mailsWithTimestamps)
  }

  async update(id, mailData) {
    const db = await database.getDb()
    await db(this.tableName)
      .where({ id })
      .update({
        ...mailData,
        updated_at: new Date().toISOString()
      })
    return this.getById(id)
  }

  async toggleRead(id) {
    const db = await database.getDb()
    await db(this.tableName)
      .where({ id })
      .update({
        is_unread: db.raw('CASE WHEN is_unread = 1 THEN 0 ELSE 1 END'),
        updated_at: new Date().toISOString()
      })
    return this.getById(id)
  }

  async toggleStar(id) {
    const db = await database.getDb()
    await db(this.tableName)
      .where({ id })
      .update({
        is_starred: db.raw('CASE WHEN is_starred = 1 THEN 0 ELSE 1 END'),
        updated_at: new Date().toISOString()
      })
    return this.getById(id)
  }

  async toggleImportant(id) {
    const db = await database.getDb()
    await db(this.tableName)
      .where({ id })
      .update({
        is_important: db.raw('CASE WHEN is_important = 1 THEN 0 ELSE 1 END'),
        updated_at: new Date().toISOString()
      })
    return this.getById(id)
  }

  async moveToFolder(id, folderId) {
    const db = await database.getDb()
    await db(this.tableName).where({ id }).update({
      folder_id: folderId,
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

  async deleteByFolder(folderId) {
    const db = await database.getDb()
    return db(this.tableName).where({ folder_id: folderId }).delete()
  }

  async getRecentMails(accountId, limit = 20) {
    const db = await database.getDb()
    return db(this.tableName)
      .where({ account_id: accountId })
      .orderBy('received_at', 'desc')
      .limit(limit)
  }

  async getUnreadMails(accountId, limit = 50) {
    const db = await database.getDb()
    return db(this.tableName)
      .where({ account_id: accountId, is_unread: 1 })
      .orderBy('received_at', 'desc')
      .limit(limit)
  }

  async getStarredMails(accountId, limit = 50) {
    const db = await database.getDb()
    return db(this.tableName)
      .where({ account_id: accountId, is_starred: 1 })
      .orderBy('received_at', 'desc')
      .limit(limit)
  }

  async getImportantMails(accountId, limit = 50) {
    const db = await database.getDb()
    return db(this.tableName)
      .where({ account_id: accountId, is_important: 1 })
      .orderBy('received_at', 'desc')
      .limit(limit)
  }

  async getMailWithLabels(mailId) {
    const db = await database.getDb()
    const mail = await this.getById(mailId)

    if (!mail) return null

    const labels = await db('mail_labels')
      .select('labels.*')
      .leftJoin('labels', 'mail_labels.label_id', 'labels.id')
      .where('mail_labels.mail_id', mailId)

    return {
      ...mail,
      labels
    }
  }

  async getMailWithAttachments(mailId) {
    const db = await database.getDb()
    const mail = await this.getById(mailId)

    if (!mail) return null

    const attachments = await db('attachments')
      .where({ mail_id: mailId })
      .orderBy('filename', 'asc')

    return {
      ...mail,
      attachments
    }
  }

  async getFullMail(mailId) {
    const db = await database.getDb()
    const mail = await this.getById(mailId)

    if (!mail) return null

    const [labels, attachments] = await Promise.all([
      db('mail_labels')
        .select('labels.*')
        .leftJoin('labels', 'mail_labels.label_id', 'labels.id')
        .where('mail_labels.mail_id', mailId),
      db('attachments').where({ mail_id: mailId }).orderBy('filename', 'asc')
    ])

    return {
      ...mail,
      labels,
      attachments
    }
  }
}

export default new MailModel()
