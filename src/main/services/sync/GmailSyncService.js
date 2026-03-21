import { createGoogleOAuthService } from '../oauth/GoogleOAuthServiceV3.js'
import AccountModel from '../../database/models/AccountModel.js'
import FolderModel from '../../database/models/FolderModel.js'
import LabelModel from '../../database/models/LabelModel.js'
import MailModel from '../../database/models/MailModel.js'

export default class GmailSyncService {
  constructor(electron) {
    this.isSyncing = false
    this.syncProgress = {
      total: 0,
      completed: 0,
      stage: '',
      message: ''
    }
    this.electron = electron
    this.oauthService = null
  }

  async syncAccount(accountId) {
    if (this.isSyncing) {
      throw new Error('Another sync is already in progress')
    }

    this.isSyncing = true
    this.syncProgress = {
      total: 100,
      completed: 0,
      stage: 'starting',
      message: 'Starting sync...'
    }

    try {
      const account = await AccountModel.getById(accountId)
      if (!account) {
        throw new Error('Account not found')
      }

      // Update sync status
      this.updateProgress(10, 'authenticating', 'Authenticating with Gmail...')

      // Initialize OAuth service if not already done
      if (!this.oauthService) {
        this.oauthService = createGoogleOAuthService(this.electron)
      }

      // Get Gmail client
      const gmail = await this.oauthService.getGmailClient(accountId)

      // Step 1: Get user profile
      this.updateProgress(20, 'profile', 'Getting user profile...')
      const profile = await gmail.users.getProfile({ userId: 'me' })
      console.log('User profile:', profile.data)

      // Step 2: Sync labels
      this.updateProgress(30, 'labels', 'Syncing labels...')
      const labels = await this.syncLabels(accountId, gmail)

      // Step 3: Sync folders (Gmail labels as folders)
      this.updateProgress(40, 'folders', 'Syncing folders...')
      const folders = await this.syncFolders(accountId, labels)

      // Step 4: Sync messages
      this.updateProgress(50, 'messages', 'Syncing messages...')
      const messages = await this.syncMessages(accountId, gmail, folders)

      // Step 5: Update account sync status
      this.updateProgress(90, 'updating', 'Updating sync status...')
      await AccountModel.updateSyncStatus(accountId, new Date())

      this.updateProgress(100, 'complete', 'Sync completed successfully')

      return {
        success: true,
        profile: profile.data,
        labelsCount: labels.length,
        foldersCount: folders.length,
        messagesCount: messages.length,
        message: `Synced ${messages.length} messages from ${folders.length} folders`
      }
    } catch {
      console.error('Error extracting body')
      return 'No preview available'
    }
  }

  async syncLabels(accountId, gmail) {
    try {
      const response = await gmail.users.labels.list({ userId: 'me' })
      const gmailLabels = response.data.labels || []

      const labels = []
      for (const gmailLabel of gmailLabels) {
        try {
          // Check if label already exists
          let label = await LabelModel.getByName(accountId, gmailLabel.name)

          if (!label) {
            // Create new label
            label = await LabelModel.create({
              account_id: accountId,
              name: gmailLabel.name,
              color: gmailLabel.color?.backgroundColor || '#4285F4'
            })
          } else {
            // Update existing label
            label = await LabelModel.update(label.id, {
              color: gmailLabel.color?.backgroundColor || '#4285F4'
            })
          }

          labels.push(label)
        } catch {
          console.error(`Error syncing label ${gmailLabel.name}`)
        }
      }

      return labels
    } catch (err) {
      console.error('Error syncing labels:', err)
      throw err
    }
  }

  async syncFolders(accountId, labels) {
    try {
      // Map Gmail labels to folders
      const systemFolders = ['INBOX', 'SENT', 'DRAFT', 'SPAM', 'TRASH', 'IMPORTANT', 'STARRED']

      const folders = []

      // First, ensure system folders exist
      for (const folderName of systemFolders) {
        try {
          let folder = await FolderModel.getByName(accountId, folderName)

          if (!folder) {
            folder = await FolderModel.create({
              account_id: accountId,
              name: folderName,
              display_name: this.formatFolderName(folderName),
              type: 'system'
            })
          }

          folders.push(folder)
        } catch {
          console.error(`Error creating folder ${folderName}`)
        }
      }

      // Create folders from labels
      for (const label of labels) {
        try {
          // Skip system folders that are already created
          if (systemFolders.includes(label.name.toUpperCase())) {
            continue
          }

          let folder = await FolderModel.getByName(accountId, label.name)

          if (!folder) {
            folder = await FolderModel.create({
              account_id: accountId,
              name: label.name,
              display_name: label.name,
              type: 'label'
            })
          }

          folders.push(folder)
        } catch {
          console.error(`Error creating folder from label ${label.name}`)
        }
      }

      return folders
    } catch (err) {
      console.error('Error syncing folders:', err)
      throw err
    }
  }

  async syncMessages(accountId, gmail, folders) {
    try {
      // Get inbox folder
      const inboxFolder = folders.find((f) => f.name === 'INBOX')
      if (!inboxFolder) {
        throw new Error('INBOX folder not found')
      }

      // Get recent messages
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 50,
        labelIds: ['INBOX']
      })

      const messageIds = response.data.messages || []
      const messages = []

      for (let i = 0; i < messageIds.length; i++) {
        try {
          const messageId = messageIds[i].id

          // Update progress
          this.updateProgress(
            50 + Math.floor((i / messageIds.length) * 40),
            'messages',
            `Syncing message ${i + 1} of ${messageIds.length}...`
          )

          // Get full message
          const messageResponse = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full'
          })

          const gmailMessage = messageResponse.data

          // Parse message headers
          const headers = this.parseHeaders(gmailMessage.payload.headers)

          // Create mail record
          const mailData = {
            account_id: accountId,
            folder_id: inboxFolder.id,
            message_id: gmailMessage.id,
            thread_id: gmailMessage.threadId,
            sender_name: headers.from.name || headers.from.email,
            sender_email: headers.from.email,
            recipients: this.formatRecipients(headers),
            subject: headers.subject || '(No Subject)',
            preview: this.generatePreview(gmailMessage),
            body: this.extractBody(gmailMessage),
            has_attachments: this.hasAttachments(gmailMessage),
            is_unread: !gmailMessage.labelIds?.includes('UNREAD') ? 0 : 1,
            is_starred: gmailMessage.labelIds?.includes('STARRED') ? 1 : 0,
            is_important: gmailMessage.labelIds?.includes('IMPORTANT') ? 1 : 0,
            received_at: new Date(parseInt(gmailMessage.internalDate)).toISOString()
          }

          // Check if message already exists
          let mail = await MailModel.getByMessageId(gmailMessage.id)

          if (!mail) {
            mail = await MailModel.create(mailData)
          } else {
            // Update existing message
            mail = await MailModel.update(mail.id, mailData)
          }

          messages.push(mail)

          // Process labels for this message
          await this.processMessageLabels(accountId, mail.id, gmailMessage.labelIds || [], folders)
        } catch {
          console.error(`Error syncing message ${messageIds[i]?.id}`)
        }
      }

      // Update folder counts
      await FolderModel.updateCounts(inboxFolder.id, messages.length, messages.length)

      return messages
    } catch (err) {
      console.error('Error syncing messages:', err)
      throw err
    }
  }

  async processMessageLabels(accountId, mailId, labelIds, folders) {
    try {
      for (const labelId of labelIds) {
        // Find corresponding folder
        const folder = folders.find((f) => f.name === labelId)
        if (folder && folder.id) {
          // Add label to mail (this creates a mail_label record)
          await LabelModel.addLabelToMail(mailId, folder.id)
        }
      }
    } catch (err) {
      console.error('Error processing message labels:', err)
    }
  }

  parseHeaders(headers) {
    const result = {
      from: { name: '', email: '' },
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      date: ''
    }

    for (const header of headers) {
      switch (header.name.toLowerCase()) {
        case 'from': {
          const fromMatch = header.value.match(/(.*)<(.*)>/) || [null, header.value, header.value]
          result.from = {
            name: fromMatch[1]?.trim() || fromMatch[2],
            email: fromMatch[2]
          }
          break
        }
        case 'to':
          result.to = header.value
          break
        case 'cc':
          result.cc = header.value
          break
        case 'bcc':
          result.bcc = header.value
          break
        case 'subject':
          result.subject = header.value
          break
        case 'date':
          result.date = header.value
          break
      }
    }

    return result
  }

  formatRecipients(headers) {
    const recipients = []
    if (headers.to) recipients.push(`To: ${headers.to}`)
    if (headers.cc) recipients.push(`Cc: ${headers.cc}`)
    if (headers.bcc) recipients.push(`Bcc: ${headers.bcc}`)
    return recipients.join('; ')
  }

  generatePreview(gmailMessage) {
    try {
      // Try to extract snippet
      if (gmailMessage.snippet) {
        return (
          gmailMessage.snippet.substring(0, 200) + (gmailMessage.snippet.length > 200 ? '...' : '')
        )
      }

      // Fallback to body extraction
      const body = this.extractBody(gmailMessage)
      return body.substring(0, 200) + (body.length > 200 ? '...' : '')
    } catch (err) {
      console.error('Sync error:', err)
      this.updateProgress(0, 'error', `Sync failed: ${err.message}`)
      throw err
    }
  }

  extractBody(gmailMessage) {
    try {
      const parts = []

      const extractPart = (part) => {
        if (part.body && part.body.data) {
          const bodyData = part.body.data
          if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
            const decoded = Buffer.from(bodyData, 'base64').toString('utf-8')
            parts.push(decoded)
          }
        }

        if (part.parts) {
          for (const subPart of part.parts) {
            extractPart(subPart)
          }
        }
      }

      extractPart(gmailMessage.payload)

      // Return plain text if available, otherwise HTML
      const plainText = parts.find((p) => !p.includes('<'))
      return plainText || parts[0] || 'No body content'
    } catch {
      console.error('Error extracting body')
      return 'Error extracting message body'
    }
  }

  hasAttachments(gmailMessage) {
    try {
      const checkPart = (part) => {
        if (part.filename && part.filename.trim() !== '') {
          return true
        }

        if (part.parts) {
          for (const subPart of part.parts) {
            if (checkPart(subPart)) {
              return true
            }
          }
        }

        return false
      }

      return checkPart(gmailMessage.payload)
    } catch {
      return false
    }
  }

  formatFolderName(folderName) {
    const names = {
      INBOX: 'Inbox',
      SENT: 'Sent',
      DRAFT: 'Drafts',
      SPAM: 'Spam',
      TRASH: 'Trash',
      IMPORTANT: 'Important',
      STARRED: 'Starred'
    }

    return (
      names[folderName] || folderName.charAt(0).toUpperCase() + folderName.slice(1).toLowerCase()
    )
  }

  updateProgress(completed, stage, message) {
    this.syncProgress = {
      ...this.syncProgress,
      completed,
      stage,
      message
    }

    // Emit progress event (could be used for IPC updates)
    if (this.onProgress) {
      this.onProgress(this.syncProgress)
    }
  }

  getProgress() {
    return this.syncProgress
  }

  isSyncingNow() {
    return this.isSyncing
  }

  // Incremental sync (for future implementation)
  async incrementalSync() {
    // This would use Gmail's history API for incremental sync
    console.log('Incremental sync not yet implemented')
    return { success: false, message: 'Not implemented' }
  }
}
