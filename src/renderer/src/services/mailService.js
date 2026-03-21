import { Folder, Star, Message, Calendar, Delete } from '@element-plus/icons-vue'

export const mails = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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

export const folders = [
  { name: 'Inbox', count: 12, icon: Folder },
  { name: 'Starred', count: 5, icon: Star },
  { name: 'Important', count: 8, icon: Star },
  { name: 'Sent', count: 24, icon: Message },
  { name: 'Drafts', count: 3, icon: Calendar },
  { name: 'Spam', count: 0, icon: Delete },
  { name: 'Trash', count: 7, icon: Delete }
]

export const labels = [
  { name: 'Personal', color: '#4285F4' },
  { name: 'Work', color: '#34A853' },
  { name: 'Travel', color: '#FBBC05' },
  { name: 'Finance', color: '#EA4335' }
]

export function getMailById(id) {
  return mails.find((mail) => mail.id === id)
}

export function toggleStar(mail) {
  mail.starred = !mail.starred
}

export function toggleRead(mail) {
  mail.unread = !mail.unread
}

export function deleteMail(mailId) {
  const index = mails.findIndex((mail) => mail.id === mailId)
  if (index !== -1) {
    mails.splice(index, 1)
  }
}
