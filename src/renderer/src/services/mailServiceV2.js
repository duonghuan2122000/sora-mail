import databaseClient from './databaseClient.js'
import { Folder, Star, Message, Calendar, Delete } from '@element-plus/icons-vue'

// Legacy mock data for backward compatibility during transition
export const mockMails = [
  {
    id: '1',
    sender: 'Google',
    senderEmail: 'no-reply@accounts.google.com',
    subject: 'Security alert for your Google Account',
    preview: 'New sign-in from Windows on Chrome',
    time: '10:30 AM',
    date: 'Today',
    unread: true,
    starred: false,
    important: true
  },
  {
    id: '2',
    sender: 'GitHub',
    senderEmail: 'notifications@github.com',
    subject: '[GitHub] A repository you starred has a new release',
    preview: 'vuejs/core released v3.4.0',
    time: 'Yesterday',
    date: 'Mar 20',
    unread: false,
    starred: true,
    important: false
  },
  {
    id: '3',
    sender: 'Amazon',
    senderEmail: 'order-update@amazon.com',
    subject: 'Your Amazon order #123-456789-101112 has shipped',
    preview: 'Your package is on the way',
    time: 'Mar 19',
    date: 'Mar 19',
    unread: false,
    starred: false,
    important: false
  },
  {
    id: 4,
    sender: 'LinkedIn',
    senderEmail: 'network@linkedin.com',
    subject: 'You have 3 new connection requests',
    preview: 'Expand your professional network',
    time: 'Mar 18',
    date: 'Mar 18',
    unread: true,
    starred: false,
    important: false
  },
  {
    id: 5,
    sender: 'Netflix',
    senderEmail: 'info@netflix.com',
    subject: 'Your monthly subscription receipt',
    preview: 'Your Netflix membership has been renewed',
    time: 'Mar 17',
    date: 'Mar 17',
    unread: false,
    starred: true,
    important: false
  }
]

export const mockFolders = [
  { name: 'Inbox', count: 12, icon: Folder },
  { name: 'Starred', count: 5, icon: Star },
  { name: 'Important', count: 8, icon: Star },
  { name: 'Sent', count: 24, icon: Message },
  { name: 'Drafts', count: 3, icon: Calendar },
  { name: 'Spam', count: 0, icon: Delete },
  { name: 'Trash', count: 7, icon: Delete }
]

export const mockLabels = [
  { name: 'Personal', color: '#4285F4' },
  { name: 'Work', color: '#34A853' },
  { name: 'Travel', color: '#FBBC05' },
  { name: 'Finance', color: '#EA4335' }
]

// Database-based functions
export async function initializeDatabase() {
  try {
    await databaseClient.initialize()
    return true
  } catch (error) {
    console.error('Failed to initialize database:', error)
    return false
  }
}

export async function getMails(folderId, options = {}) {
  try {
    const mails = await databaseClient.getMails(folderId, options)
    return mails.map(formatMailForUI)
  } catch (error) {
    console.error('Failed to get mails from database:', error)
    // Fallback to mock data during transition
    return mockMails
  }
}

export async function getMailById(id) {
  try {
    const mail = await databaseClient.getMailById(id)
    return mail ? formatMailForUI(mail) : null
  } catch (error) {
    console.error('Failed to get mail from database:', error)
    // Fallback to mock data during transition
    return mockMails.find((mail) => mail.id === id)
  }
}

export async function getFullMail(id) {
  try {
    const mail = await databaseClient.getMailDetailData(id)
    return mail ? formatMailForUI(mail) : null
  } catch (error) {
    console.error('Failed to get full mail from database:', error)
    // Fallback to mock data during transition
    const mail = mockMails.find((mail) => mail.id === id)
    return mail ? { ...mail, labels: [], attachments: [] } : null
  }
}

export async function getFolders(accountId) {
  try {
    const folders = await databaseClient.getFolders(accountId)
    return folders.map(formatFolderForUI)
  } catch (error) {
    console.error('Failed to get folders from database:', error)
    // Fallback to mock data during transition
    return mockFolders
  }
}

export async function getLabels(accountId) {
  try {
    const labels = await databaseClient.getLabels(accountId)
    return labels.map(formatLabelForUI)
  } catch (error) {
    console.error('Failed to get labels from database:', error)
    // Fallback to mock data during transition
    return mockLabels
  }
}

export async function toggleStar(mail) {
  try {
    if (mail.id && mail.id.startsWith('mock-')) {
      // Handle mock data
      mail.starred = !mail.starred
      return mail
    }

    const updatedMail = await databaseClient.toggleMailStar(mail.id)
    return formatMailForUI(updatedMail)
  } catch (error) {
    console.error('Failed to toggle star:', error)
    // Fallback for mock data
    mail.starred = !mail.starred
    return mail
  }
}

export async function toggleRead(mail) {
  try {
    if (mail.id && mail.id.startsWith('mock-')) {
      // Handle mock data
      mail.unread = !mail.unread
      return mail
    }

    const updatedMail = await databaseClient.toggleMailRead(mail.id)
    return formatMailForUI(updatedMail)
  } catch (error) {
    console.error('Failed to toggle read:', error)
    // Fallback for mock data
    mail.unread = !mail.unread
    return mail
  }
}

export async function deleteMail(mail) {
  try {
    if (mail.id && mail.id.startsWith('mock-')) {
      // Handle mock data
      const index = mockMails.findIndex((m) => m.id === mail.id)
      if (index !== -1) {
        mockMails.splice(index, 1)
      }
      return true
    }

    await databaseClient.deleteMail(mail.id)
    return true
  } catch (error) {
    console.error('Failed to delete mail:', error)
    return false
  }
}

export async function searchMails(accountId, searchTerm, options = {}) {
  try {
    const mails = await databaseClient.searchMails(accountId, searchTerm, options)
    return mails.map(formatMailForUI)
  } catch (error) {
    console.error('Failed to search mails:', error)
    // Fallback to filtering mock data
    return mockMails.filter(
      (mail) =>
        mail.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mail.senderEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mail.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mail.preview.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }
}

export async function getActiveAccount() {
  try {
    return await databaseClient.getActiveAccount()
  } catch (error) {
    console.error('Failed to get active account:', error)
    return null
  }
}

export async function initializeAccountData(accountId) {
  try {
    return await databaseClient.initializeAccountData(accountId)
  } catch (error) {
    console.error('Failed to initialize account data:', error)
    return {
      folders: mockFolders,
      labels: mockLabels,
      inboxFolder: mockFolders[0]
    }
  }
}

export async function migrateMockData(accountId, folderId) {
  try {
    return await databaseClient.migrateMockData(accountId, folderId)
  } catch (error) {
    console.error('Failed to migrate mock data:', error)
    return { success: false, error: error.message }
  }
}

// Helper functions for formatting data
function formatMailForUI(dbMail) {
  if (!dbMail) return null

  // Convert database field names to UI field names
  return {
    id: dbMail.id,
    sender: dbMail.sender_name,
    senderEmail: dbMail.sender_email,
    subject: dbMail.subject,
    preview: dbMail.preview || '',
    time: formatTime(dbMail.received_at),
    date: formatDate(dbMail.received_at),
    unread: Boolean(dbMail.is_unread),
    starred: Boolean(dbMail.is_starred),
    important: Boolean(dbMail.is_important),
    hasAttachments: Boolean(dbMail.has_attachments),
    // Include database fields for compatibility
    ...dbMail
  }
}

function formatFolderForUI(dbFolder) {
  if (!dbFolder) return null

  // Map database folder type to icon
  const iconMap = {
    INBOX: Folder,
    STARRED: Star,
    IMPORTANT: Star,
    SENT: Message,
    DRAFTS: Calendar,
    TRASH: Delete,
    SPAM: Delete
  }

  return {
    id: dbFolder.id,
    name: dbFolder.name,
    displayName: dbFolder.display_name,
    icon: iconMap[dbFolder.name] || Folder,
    count: dbFolder.total_count || 0,
    unreadCount: dbFolder.unread_count || 0,
    type: dbFolder.type
  }
}

function formatLabelForUI(dbLabel) {
  if (!dbLabel) return null

  return {
    id: dbLabel.id,
    name: dbLabel.name,
    color: dbLabel.color
  }
}

function formatTime(dateString) {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' })

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

// Legacy exports for backward compatibility
export const mails = mockMails
export const folders = mockFolders
export const labels = mockLabels
