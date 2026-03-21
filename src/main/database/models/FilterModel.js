import database from '../index.js'

class FilterModel {
  constructor() {
    this.tableName = 'filters'
  }

  async getAll(accountId) {
    const db = await database.getDb()
    return db(this.tableName)
      .where({ account_id: accountId })
      .orderBy('priority', 'asc')
      .orderBy('name', 'asc')
  }

  async getActiveFilters(accountId) {
    const db = await database.getDb()
    return db(this.tableName)
      .where({ account_id: accountId, is_active: 1 })
      .orderBy('priority', 'asc')
      .orderBy('name', 'asc')
  }

  async getById(id) {
    const db = await database.getDb()
    return db(this.tableName).where({ id }).first()
  }

  async getByName(accountId, name) {
    const db = await database.getDb()
    return db(this.tableName).where({ account_id: accountId, name }).first()
  }

  async create(filterData) {
    const id = await database.insert(this.tableName, {
      ...filterData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    return this.getById(id)
  }

  async update(id, filterData) {
    const db = await database.getDb()
    await db(this.tableName)
      .where({ id })
      .update({
        ...filterData,
        updated_at: new Date().toISOString()
      })
    return this.getById(id)
  }

  async toggleActive(id, isActive) {
    const db = await database.getDb()
    await db(this.tableName)
      .where({ id })
      .update({
        is_active: isActive ? 1 : 0,
        updated_at: new Date().toISOString()
      })
    return this.getById(id)
  }

  async updatePriority(id, priority) {
    const db = await database.getDb()
    await db(this.tableName).where({ id }).update({
      priority,
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

  async getConditions(id) {
    const filter = await this.getById(id)
    if (filter && filter.conditions) {
      return JSON.parse(filter.conditions)
    }
    return null
  }

  async getActions(id) {
    const filter = await this.getById(id)
    if (filter && filter.actions) {
      return JSON.parse(filter.actions)
    }
    return null
  }

  async updateConditions(id, conditions) {
    const db = await database.getDb()
    await db(this.tableName)
      .where({ id })
      .update({
        conditions: JSON.stringify(conditions),
        updated_at: new Date().toISOString()
      })
    return this.getById(id)
  }

  async updateActions(id, actions) {
    const db = await database.getDb()
    await db(this.tableName)
      .where({ id })
      .update({
        actions: JSON.stringify(actions),
        updated_at: new Date().toISOString()
      })
    return this.getById(id)
  }

  async reorderFilters(accountId, filterIds) {
    const db = await database.getDb()

    return db.transaction(async (trx) => {
      for (let i = 0; i < filterIds.length; i++) {
        await trx(this.tableName).where({ id: filterIds[i], account_id: accountId }).update({
          priority: i,
          updated_at: new Date().toISOString()
        })
      }
    })
  }

  async evaluateMailAgainstFilters(mail, accountId) {
    const activeFilters = await this.getActiveFilters(accountId)
    const matchedFilters = []

    for (const filter of activeFilters) {
      try {
        const conditions = JSON.parse(filter.conditions)
        const actions = JSON.parse(filter.actions)

        if (this.evaluateConditions(mail, conditions)) {
          matchedFilters.push({
            filter,
            actions
          })
        }
      } catch (error) {
        console.error(`Error evaluating filter ${filter.id}:`, error)
      }
    }

    return matchedFilters
  }

  evaluateConditions(mail, conditions) {
    // Simple condition evaluation
    // In a real implementation, this would be more sophisticated
    for (const condition of conditions) {
      const { field, operator, value } = condition

      let mailValue
      switch (field) {
        case 'sender':
          mailValue = mail.sender_email
          break
        case 'subject':
          mailValue = mail.subject
          break
        case 'body':
          mailValue = mail.body || ''
          break
        case 'has_attachments':
          mailValue = mail.has_attachments
          break
        default:
          return false
      }

      const matches = this.compareValues(mailValue, operator, value)
      if (!matches) {
        return false
      }
    }

    return true
  }

  compareValues(mailValue, operator, conditionValue) {
    switch (operator) {
      case 'contains':
        return mailValue.toString().toLowerCase().includes(conditionValue.toLowerCase())
      case 'not_contains':
        return !mailValue.toString().toLowerCase().includes(conditionValue.toLowerCase())
      case 'equals':
        return mailValue.toString().toLowerCase() === conditionValue.toLowerCase()
      case 'not_equals':
        return mailValue.toString().toLowerCase() !== conditionValue.toLowerCase()
      case 'starts_with':
        return mailValue.toString().toLowerCase().startsWith(conditionValue.toLowerCase())
      case 'ends_with':
        return mailValue.toString().toLowerCase().endsWith(conditionValue.toLowerCase())
      case 'is_true':
        return !!mailValue
      case 'is_false':
        return !mailValue
      default:
        return false
    }
  }
}

export default new FilterModel()
