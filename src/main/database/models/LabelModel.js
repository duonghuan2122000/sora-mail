import database from '../index.js'

class LabelModel {
  constructor() {
    this.tableName = 'labels'
  }

  async getAll(accountId) {
    const db = await database.getDb()
    return db(this.tableName).where({ account_id: accountId }).orderBy('name', 'asc')
  }

  async getById(id) {
    const db = await database.getDb()
    return db(this.tableName).where({ id }).first()
  }

  async getByName(accountId, name) {
    const db = await database.getDb()
    return db(this.tableName).where({ account_id: accountId, name }).first()
  }

  async create(labelData) {
    const id = await database.insert(this.tableName, {
      ...labelData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    return this.getById(id)
  }

  async createMultiple(labels) {
    const now = new Date().toISOString()

    const labelsWithTimestamps = labels.map((label) => ({
      ...label,
      created_at: now,
      updated_at: now
    }))

    return database.insertMultiple(this.tableName, labelsWithTimestamps)
  }

  async update(id, labelData) {
    const db = await database.getDb()
    await db(this.tableName)
      .where({ id })
      .update({
        ...labelData,
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

  async getLabelsForMail(mailId) {
    const db = await database.getDb()
    return db('mail_labels')
      .select('labels.*')
      .leftJoin('labels', 'mail_labels.label_id', 'labels.id')
      .where('mail_labels.mail_id', mailId)
      .orderBy('labels.name', 'asc')
  }

  async addLabelToMail(mailId, labelId) {
    const db = await database.getDb()
    try {
      await db('mail_labels').insert({
        mail_id: mailId,
        label_id: labelId,
        created_at: new Date().toISOString()
      })
      return true
    } catch (error) {
      // Ignore duplicate entry errors
      if (error.code === 'SQLITE_CONSTRAINT') {
        return true
      }
      throw error
    }
  }

  async removeLabelFromMail(mailId, labelId) {
    const db = await database.getDb()
    return db('mail_labels').where({ mail_id: mailId, label_id: labelId }).delete()
  }

  async removeAllLabelsFromMail(mailId) {
    const db = await database.getDb()
    return db('mail_labels').where({ mail_id: mailId }).delete()
  }

  async getMailsWithLabel(labelId, options = {}) {
    const db = await database.getDb()
    let query = db('mail_labels')
      .select('mails.*')
      .leftJoin('mails', 'mail_labels.mail_id', 'mails.id')
      .where('mail_labels.label_id', labelId)

    query = query.orderBy('mails.received_at', 'desc')

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.offset(options.offset)
    }

    return query
  }

  async initializeDefaultLabels(accountId) {
    const defaultLabels = [
      {
        account_id: accountId,
        name: 'Personal',
        color: '#4285F4'
      },
      {
        account_id: accountId,
        name: 'Work',
        color: '#34A853'
      },
      {
        account_id: accountId,
        name: 'Travel',
        color: '#FBBC05'
      },
      {
        account_id: accountId,
        name: 'Finance',
        color: '#EA4335'
      }
    ]

    // Check which labels already exist
    const existingLabels = await this.getAll(accountId)
    const existingLabelNames = existingLabels.map((l) => l.name)

    const labelsToCreate = defaultLabels.filter((label) => !existingLabelNames.includes(label.name))

    if (labelsToCreate.length > 0) {
      await this.createMultiple(labelsToCreate)
    }

    return this.getAll(accountId)
  }
}

export default new LabelModel()
