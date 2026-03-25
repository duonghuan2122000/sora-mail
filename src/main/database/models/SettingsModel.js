import database from '../index.js'

class SettingsModel {
  async get(key) {
    try {
      const db = await database.getDb()
      const result = await db('settings').where({ key }).first()
      return result ? result.value : null
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error)
      return null
    }
  }

  async set(key, value) {
    try {
      const db = await database.getDb()
      await db('settings').where({ key }).del()
      await db('settings').insert({ key, value })
      return { success: true }
    } catch (error) {
      console.error(`Error setting ${key}:`, error)
      return { success: false, error: error.message }
    }
  }
}

export default new SettingsModel()
