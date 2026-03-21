import database from '../index.js'

class AttachmentModel {
  constructor() {
    this.tableName = 'attachments'
  }

  async getAll(mailId) {
    const db = await database.getDb()
    return db(this.tableName).where({ mail_id: mailId }).orderBy('filename', 'asc')
  }

  async getById(id) {
    const db = await database.getDb()
    return db(this.tableName).where({ id }).first()
  }

  async getByMailAndFilename(mailId, filename) {
    const db = await database.getDb()
    return db(this.tableName).where({ mail_id: mailId, filename }).first()
  }

  async create(attachmentData) {
    const id = await database.insert(this.tableName, {
      ...attachmentData,
      created_at: new Date().toISOString()
    })
    return this.getById(id)
  }

  async createMultiple(attachments) {
    const now = new Date().toISOString()

    const attachmentsWithTimestamps = attachments.map((attachment) => ({
      ...attachment,
      created_at: now
    }))

    return database.insertMultiple(this.tableName, attachmentsWithTimestamps)
  }

  async update(id, attachmentData) {
    const db = await database.getDb()
    await db(this.tableName).where({ id }).update(attachmentData)
    return this.getById(id)
  }

  async updateFilePath(id, filePath) {
    const db = await database.getDb()
    await db(this.tableName).where({ id }).update({ file_path: filePath })
    return this.getById(id)
  }

  async delete(id) {
    const db = await database.getDb()
    return db(this.tableName).where({ id }).delete()
  }

  async deleteByMail(mailId) {
    const db = await database.getDb()
    return db(this.tableName).where({ mail_id: mailId }).delete()
  }

  async getTotalSize(mailId) {
    const db = await database.getDb()
    const result = await db(this.tableName)
      .where({ mail_id: mailId })
      .sum('size as total_size')
      .first()
    return result?.total_size || 0
  }

  async getCount(mailId) {
    const db = await database.getDb()
    const result = await db(this.tableName).where({ mail_id: mailId }).count('id as count').first()
    return result?.count || 0
  }

  async getByContentId(contentId) {
    const db = await database.getDb()
    return db(this.tableName).where({ content_id: contentId }).first()
  }

  async getInlineAttachments(mailId) {
    const db = await database.getDb()
    return db(this.tableName)
      .where({ mail_id: mailId })
      .whereNotNull('content_id')
      .orderBy('filename', 'asc')
  }

  async getRegularAttachments(mailId) {
    const db = await database.getDb()
    return db(this.tableName)
      .where({ mail_id: mailId })
      .whereNull('content_id')
      .orderBy('filename', 'asc')
  }

  async markAsDownloaded(id, filePath) {
    const db = await database.getDb()
    await db(this.tableName).where({ id }).update({ file_path: filePath })
    return this.getById(id)
  }

  async getUndownloadedAttachments(mailId) {
    const db = await database.getDb()
    return db(this.tableName)
      .where({ mail_id: mailId })
      .whereNull('file_path')
      .orderBy('filename', 'asc')
  }
}

export default new AttachmentModel()
