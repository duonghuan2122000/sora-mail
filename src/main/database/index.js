import { app } from 'electron'
import path from 'path'
import knex from 'knex'
import { v7 as uuidv7 } from 'uuid'

class Database {
  constructor() {
    this.db = null
    this.isInitialized = false
  }

  async initialize() {
    if (this.isInitialized) return this.db

    const userDataPath = app.getPath('userData')
    const dbPath = path.join(userDataPath, 'sora-mail.db')

    console.log(`Initializing database at: ${dbPath}`)

    this.db = knex({
      client: 'better-sqlite3',
      connection: {
        filename: dbPath
      },
      useNullAsDefault: true,
      pool: {
        min: 1,
        max: 1
      }
    })

    await this.runMigrations()
    await this.seedInitialData()

    this.isInitialized = true
    console.log('Database initialized successfully')
    return this.db
  }

  async runMigrations() {
    const migrations = [
      // Create providers table
      `CREATE TABLE IF NOT EXISTS providers (
        id CHAR(36) PRIMARY KEY,
        name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        auth_type TEXT NOT NULL,
        config TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Create accounts table
      `CREATE TABLE IF NOT EXISTS accounts (
        id CHAR(36) PRIMARY KEY,
        provider_id CHAR(36) NOT NULL,
        email TEXT NOT NULL UNIQUE,
        display_name TEXT,
        access_token TEXT,
        refresh_token TEXT,
        token_expiry TIMESTAMP,
        sync_enabled BOOLEAN DEFAULT 1,
        last_sync_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
      )`,

      // Create folders table
      `CREATE TABLE IF NOT EXISTS folders (
        id CHAR(36) PRIMARY KEY,
        account_id CHAR(36) NOT NULL,
        name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        type TEXT NOT NULL,
        unread_count INTEGER DEFAULT 0,
        total_count INTEGER DEFAULT 0,
        sync_state TEXT DEFAULT 'idle',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        UNIQUE(account_id, name)
      )`,

      // Create labels table
      `CREATE TABLE IF NOT EXISTS labels (
        id CHAR(36) PRIMARY KEY,
        account_id CHAR(36) NOT NULL,
        name TEXT NOT NULL,
        color TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        UNIQUE(account_id, name)
      )`,

      // Create mails table
      `CREATE TABLE IF NOT EXISTS mails (
        id CHAR(36) PRIMARY KEY,
        account_id CHAR(36) NOT NULL,
        folder_id CHAR(36) NOT NULL,
        message_id TEXT UNIQUE,
        thread_id TEXT,
        sender_name TEXT NOT NULL,
        sender_email TEXT NOT NULL,
        recipients TEXT,
        subject TEXT NOT NULL,
        preview TEXT,
        body TEXT,
        has_attachments BOOLEAN DEFAULT 0,
        is_unread BOOLEAN DEFAULT 1,
        is_starred BOOLEAN DEFAULT 0,
        is_important BOOLEAN DEFAULT 0,
        is_draft BOOLEAN DEFAULT 0,
        is_sent BOOLEAN DEFAULT 0,
        received_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
      )`,

      // Create mail_labels table
      `CREATE TABLE IF NOT EXISTS mail_labels (
        mail_id CHAR(36) NOT NULL,
        label_id CHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (mail_id, label_id),
        FOREIGN KEY (mail_id) REFERENCES mails(id) ON DELETE CASCADE,
        FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
      )`,

      // Create attachments table
      `CREATE TABLE IF NOT EXISTS attachments (
        id CHAR(36) PRIMARY KEY,
        mail_id CHAR(36) NOT NULL,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER,
        file_path TEXT,
        content_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mail_id) REFERENCES mails(id) ON DELETE CASCADE
      )`,

      // Create filters table
      `CREATE TABLE IF NOT EXISTS filters (
        id CHAR(36) PRIMARY KEY,
        account_id CHAR(36) NOT NULL,
        name TEXT NOT NULL,
        conditions TEXT NOT NULL,
        actions TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        priority INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      )`
    ]

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_mails_account ON mails(account_id)',
      'CREATE INDEX IF NOT EXISTS idx_mails_folder ON mails(folder_id)',
      'CREATE INDEX IF NOT EXISTS idx_mails_unread ON mails(is_unread)',
      'CREATE INDEX IF NOT EXISTS idx_mails_starred ON mails(is_starred)',
      'CREATE INDEX IF NOT EXISTS idx_mails_received ON mails(received_at)'
    ]

    try {
      for (const migration of migrations) {
        await this.db.raw(migration)
      }

      for (const index of indexes) {
        await this.db.raw(index)
      }

      console.log('Migrations completed successfully')
    } catch (error) {
      console.error('Migration error:', error)
      throw error
    }
  }

  async seedInitialData() {
    try {
      // Check if providers already exist
      const existingProviders = await this.db('providers').select('id').limit(1)

      if (existingProviders.length === 0) {
        // Insert Gmail provider
        await this.db('providers').insert({
          id: uuidv7(),
          name: 'gmail',
          display_name: 'Gmail',
          auth_type: 'oauth2',
          config: JSON.stringify({
            clientId: '',
            clientSecret: '',
            redirectUri: 'http://localhost',
            scopes: [
              'https://www.googleapis.com/auth/gmail.readonly',
              'https://www.googleapis.com/auth/gmail.modify',
              'https://www.googleapis.com/auth/gmail.labels'
            ]
          })
        })

        console.log('Initial provider data seeded')
      }

      // Check if we have mock data to migrate
      const existingMails = await this.db('mails').select('id').limit(1)

      if (existingMails.length === 0) {
        // We'll migrate mock data later when accounts are set up
        console.log('No existing mail data found')
      }
    } catch (error) {
      console.error('Error seeding initial data:', error)
    }
  }

  async getDb() {
    if (!this.isInitialized) {
      await this.initialize()
    }
    return this.db
  }

  async close() {
    if (this.db) {
      await this.db.destroy()
      this.db = null
      this.isInitialized = false
      console.log('Database connection closed')
    }
  }

  // Helper methods for common operations
  async executeQuery(query, params = []) {
    const db = await this.getDb()
    return db.raw(query, params)
  }

  async select(table, where = {}, options = {}) {
    const db = await this.getDb()
    let query = db(table).where(where)

    if (options.orderBy) {
      query = query.orderBy(options.orderBy.field, options.orderBy.direction || 'asc')
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.offset(options.offset)
    }

    return query
  }

  async insert(table, data) {
    const db = await this.getDb()

    // Generate UUID if not provided
    const dataWithId = {
      id: uuidv7(),
      ...data
    }

    await db(table).insert(dataWithId)
    return dataWithId.id
  }

  async insertMultiple(table, items) {
    const db = await this.getDb()

    // Generate UUIDs for all items
    const itemsWithIds = items.map((item) => ({
      id: uuidv7(),
      ...item
    }))

    await db(table).insert(itemsWithIds)
    return itemsWithIds.map((item) => item.id)
  }

  async update(table, where, data) {
    const db = await this.getDb()
    return db(table).where(where).update(data)
  }

  async delete(table, where) {
    const db = await this.getDb()
    return db(table).where(where).delete()
  }

  async transaction(callback) {
    const db = await this.getDb()
    return db.transaction(callback)
  }

  // UUID helper
  generateId() {
    return uuidv7()
  }
}

// Singleton instance
const database = new Database()

export default database
