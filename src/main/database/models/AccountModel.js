import database from '../index.js'

class AccountModel {
  constructor() {
    this.tableName = 'accounts'
  }

  async getAll() {
    const db = await database.getDb()
    return db(this.tableName)
      .select('accounts.*', 'providers.display_name as provider_name')
      .leftJoin('providers', 'accounts.provider_id', 'providers.id')
      .orderBy('accounts.email', 'asc')
  }

  async getById(id) {
    const db = await database.getDb()
    return db(this.tableName)
      .select('accounts.*', 'providers.display_name as provider_name')
      .leftJoin('providers', 'accounts.provider_id', 'providers.id')
      .where('accounts.id', id)
      .first()
  }

  async getByEmail(email) {
    const db = await database.getDb()
    return db(this.tableName)
      .select('accounts.*', 'providers.display_name as provider_name')
      .leftJoin('providers', 'accounts.provider_id', 'providers.id')
      .where('accounts.email', email)
      .first()
  }

  async getActiveAccount() {
    const db = await database.getDb()
    let account = await db(this.tableName)
      .select('accounts.*', 'providers.display_name as provider_name')
      .leftJoin('providers', 'accounts.provider_id', 'providers.id')
      .where('accounts.sync_enabled', 1)
      .orderBy('accounts.last_sync_at', 'desc')
      .first()
    return account
  }

  async create(accountData) {
    const id = await database.insert(this.tableName, {
      ...accountData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    return this.getById(id)
  }

  async update(id, accountData) {
    const db = await database.getDb()
    await db(this.tableName)
      .where({ id })
      .update({
        ...accountData,
        updated_at: new Date().toISOString()
      })
    return this.getById(id)
  }

  async updateTokens(id, tokens) {
    const db = await database.getDb()
    await db(this.tableName)
      .where({ id })
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        updated_at: new Date().toISOString()
      })
    return this.getById(id)
  }

  async updateSyncStatus(id, lastSyncAt = null) {
    const db = await database.getDb()
    const updateData = {
      updated_at: new Date().toISOString()
    }

    if (lastSyncAt) {
      updateData.last_sync_at = new Date(lastSyncAt).toISOString()
    }

    await db(this.tableName).where({ id }).update(updateData)
    return this.getById(id)
  }

  async toggleSync(id, enabled) {
    const db = await database.getDb()
    await db(this.tableName)
      .where({ id })
      .update({
        sync_enabled: enabled ? 1 : 0,
        updated_at: new Date().toISOString()
      })
    return this.getById(id)
  }

  async delete(id) {
    const db = await database.getDb()
    return db(this.tableName).where({ id }).delete()
  }

  async getAccountsByProvider(providerId) {
    const db = await database.getDb()
    return db(this.tableName)
      .select('accounts.*', 'providers.display_name as provider_name')
      .leftJoin('providers', 'accounts.provider_id', 'providers.id')
      .where('accounts.provider_id', providerId)
      .orderBy('accounts.email', 'asc')
  }

  async getAccountWithProvider(accountId) {
    const db = await database.getDb()
    return db(this.tableName)
      .select(
        'accounts.*',
        'providers.name as provider_type',
        'providers.config as provider_config'
      )
      .leftJoin('providers', 'accounts.provider_id', 'providers.id')
      .where('accounts.id', accountId)
      .first()
  }
}

export default new AccountModel()
