import database from '../index.js'

class ProviderModel {
  constructor() {
    this.tableName = 'providers'
  }

  async getAll() {
    const db = await database.getDb()
    return db(this.tableName).select('*').orderBy('display_name', 'asc')
  }

  async getById(id) {
    const db = await database.getDb()
    return db(this.tableName).where({ id }).first()
  }

  async getByName(name) {
    const db = await database.getDb()
    return db(this.tableName).where({ name }).first()
  }

  async create(providerData) {
    const id = await database.insert(this.tableName, {
      ...providerData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    return this.getById(id)
  }

  async update(id, providerData) {
    const db = await database.getDb()
    await db(this.tableName)
      .where({ id })
      .update({
        ...providerData,
        updated_at: new Date().toISOString()
      })
    return this.getById(id)
  }

  async delete(id) {
    const db = await database.getDb()
    return db(this.tableName).where({ id }).delete()
  }

  async getGmailProvider() {
    return this.getByName('gmail')
  }

  async getConfig(id) {
    const provider = await this.getById(id)
    if (provider && provider.config) {
      return JSON.parse(provider.config)
    }
    return null
  }

  async updateConfig(id, config) {
    const db = await database.getDb()
    await db(this.tableName)
      .where({ id })
      .update({
        config: JSON.stringify(config),
        updated_at: new Date().toISOString()
      })
    return this.getById(id)
  }
}

export default new ProviderModel()
