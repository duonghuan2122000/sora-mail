<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Menu as IconMenu,
  Message,
  Search,
  Refresh,
  More,
  Star,
  Delete,
  User,
  Setting
} from '@element-plus/icons-vue'
import {
  mails as mockMailData,
  folders as mockFolders,
  labels as mockLabels,
  getMails,
  toggleStar,
  deleteMail,
  initializeDatabase,
  getActiveAccount,
  initializeAccountData,
  migrateMockData
} from '@renderer/services/mailServiceV2'

const router = useRouter()

const mailList = ref([])
const folderList = ref([])
const labelList = ref([])
const selectedFolder = ref('Inbox')
const searchQuery = ref('')
const isLoading = ref(true)
const activeAccount = ref(null)
const currentFolder = ref(null)

const goBack = () => {
  router.push('/')
}

const openMail = (mail) => {
  router.push(`/mail/${mail.id}`)
}

const handleToggleStar = async (mail) => {
  const updatedMail = await toggleStar(mail)
  if (updatedMail) {
    const index = mailList.value.findIndex((m) => m.id === mail.id)
    if (index !== -1) {
      mailList.value[index] = updatedMail
    }
  }
}

const handleDeleteMail = async (mail) => {
  const success = await deleteMail(mail)
  if (success) {
    const index = mailList.value.findIndex((m) => m.id === mail.id)
    if (index !== -1) {
      mailList.value.splice(index, 1)
    }
  }
}

const loadData = async () => {
  try {
    isLoading.value = true

    // Initialize database
    await initializeDatabase()

    // Get active account
    activeAccount.value = await getActiveAccount()

    if (activeAccount.value) {
      // Initialize account data (folders, labels)
      const accountData = await initializeAccountData(activeAccount.value.id)
      folderList.value = accountData.folders
      labelList.value = accountData.labels

      // Get default inbox folder
      const inboxFolder = folderList.value.find((f) => f.name === 'INBOX')
      if (inboxFolder) {
        currentFolder.value = inboxFolder
        selectedFolder.value = inboxFolder.displayName

        // Load mails for inbox
        const mails = await getMails(inboxFolder.id, { limit: 50 })
        mailList.value = mails

        // If no mails in database, migrate mock data
        if (mails.length === 0) {
          const migrationResult = await migrateMockData(activeAccount.value.id, inboxFolder.id)
          if (migrationResult.success) {
            // Reload mails after migration
            const migratedMails = await getMails(inboxFolder.id, { limit: 50 })
            mailList.value = migratedMails
          }
        }
      }
    } else {
      // No active account, use mock data
      console.log('No active account found, using mock data')
      folderList.value = mockFolders
      labelList.value = mockLabels
      mailList.value = mockMailData
    }
  } catch (error) {
    console.error('Error loading data:', error)
    // Fallback to mock data
    folderList.value = mockFolders
    labelList.value = mockLabels
    mailList.value = mockMailData
  } finally {
    isLoading.value = false
  }
}

const handleFolderClick = async (folderName) => {
  selectedFolder.value = folderName
  const folder = folderList.value.find((f) => f.displayName === folderName)

  if (folder && folder.id) {
    currentFolder.value = folder
    const mails = await getMails(folder.id, { limit: 50 })
    mailList.value = mails
  }
}

onMounted(() => {
  console.log('MailList mounted')
  loadData()
})
</script>

<template>
  <div class="sora-mail">
    <!-- Header -->
    <header class="sora-mail__header">
      <div class="sora-mail__header-left">
        <el-button class="sora-mail__menu-button" :icon="IconMenu" text @click="goBack" />
        <div class="sora-mail__logo">
          <img src="@renderer/assets/logo.svg" alt="Sora Mail" class="sora-mail__logo-image" />
          <span class="sora-mail__logo-text">Sora Mail</span>
        </div>
      </div>
      <div class="sora-mail__header-center">
        <el-input
          v-model="searchQuery"
          class="sora-mail__search"
          placeholder="Search in emails"
          :prefix-icon="Search"
          size="large"
        />
      </div>
      <div class="sora-mail__header-right">
        <el-button :icon="Refresh" text />
        <el-button :icon="More" text />
        <el-avatar :icon="User" size="small" />
      </div>
    </header>

    <div class="sora-mail__container">
      <!-- Sidebar -->
      <aside class="sora-mail__sidebar">
        <el-button class="sora-mail__compose-button" type="primary" :icon="Message" size="large">
          Compose
        </el-button>

        <div class="sora-mail__folders">
          <div
            v-for="folder in folderList"
            :key="folder.id || folder.name"
            class="sora-mail__folder"
            :class="{ 'sora-mail__folder--active': selectedFolder === folder.displayName }"
            @click="handleFolderClick(folder.displayName)"
          >
            <component :is="folder.icon" class="sora-mail__folder-icon" />
            <span class="sora-mail__folder-name">{{ folder.displayName }}</span>
            <span v-if="folder.count > 0" class="sora-mail__folder-count">
              {{ folder.count }}
            </span>
          </div>
        </div>

        <div class="sora-mail__labels">
          <h3 class="sora-mail__labels-title">Labels</h3>
          <div v-for="label in labelList" :key="label.name" class="sora-mail__label">
            <span class="sora-mail__label-color" :style="{ backgroundColor: label.color }" />
            <span class="sora-mail__label-name">{{ label.name }}</span>
          </div>
        </div>

        <div class="sora-mail__sidebar-footer">
          <el-button :icon="Setting" text>Settings</el-button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="sora-mail__main">
        <!-- Toolbar -->
        <div class="sora-mail__toolbar">
          <div class="sora-mail__toolbar-left">
            <el-checkbox />
            <el-dropdown>
              <el-button text>
                <span>Select</span>
              </el-button>
            </el-dropdown>
            <el-button :icon="Refresh" text />
            <el-button :icon="More" text />
          </div>
          <div class="sora-mail__toolbar-right">
            <span class="sora-mail__toolbar-info">
              1-{{ mailList.length }} of {{ mailList.length }}
            </span>
            <el-button :icon="More" text />
          </div>
        </div>

        <!-- Mail List -->
        <div class="sora-mail__mail-list">
          <div
            v-for="mail in mailList"
            :key="mail.id"
            class="sora-mail__mail-item"
            :class="{ 'sora-mail__mail-item--unread': mail.unread }"
            @click="openMail(mail)"
          >
            <div class="sora-mail__mail-checkbox">
              <el-checkbox />
            </div>
            <div class="sora-mail__mail-star" @click.stop="handleToggleStar(mail)">
              <el-icon :color="mail.starred ? '#FBBC05' : '#ccc'">
                <Star />
              </el-icon>
            </div>
            <div class="sora-mail__mail-sender">
              <span class="sora-mail__mail-sender-name">{{ mail.sender }}</span>
              <span class="sora-mail__mail-sender-email">{{ mail.senderEmail }}</span>
            </div>
            <div class="sora-mail__mail-content">
              <div class="sora-mail__mail-subject">
                {{ mail.subject }}
                <span v-if="mail.important" class="sora-mail__mail-important">Important</span>
              </div>
              <div class="sora-mail__mail-preview">{{ mail.preview }}</div>
            </div>
            <div class="sora-mail__mail-time">
              <div class="sora-mail__mail-time-text">{{ mail.time }}</div>
              <div class="sora-mail__mail-actions">
                <el-button :icon="Delete" text @click.stop="handleDeleteMail(mail)" />
                <el-button :icon="More" text />
              </div>
            </div>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="sora-mail__empty">
          <el-empty description="Loading emails..." />
        </div>

        <!-- Empty state -->
        <div v-else-if="mailList.length === 0" class="sora-mail__empty">
          <el-empty description="No emails in this folder" />
        </div>
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sora-mail {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #fff;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
    height: 64px;
    border-bottom: 1px solid #e0e0e0;
    background-color: #fff;
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 240px;
  }

  &__menu-button {
    font-size: 1.2rem;
  }

  &__logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__logo-image {
    width: 24px;
    height: 24px;
  }

  &__logo-text {
    font-size: 1.2rem;
    font-weight: 600;
    color: #000000;
  }

  &__header-center {
    flex: 1;
    max-width: 720px;
    margin: 0 2rem;
  }

  &__search {
    :deep(.el-input__wrapper) {
      border-radius: 24px;
      background-color: #f1f3f4;
      border: none;
      box-shadow: none;
    }
  }

  &__header-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 240px;
    justify-content: flex-end;
  }

  &__container {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  &__sidebar {
    width: 256px;
    border-right: 1px solid #e0e0e0;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    background-color: #fff;
    overflow-y: auto;
  }

  &__compose-button {
    margin-bottom: 2rem;
    border-radius: 24px;
    padding: 0.75rem 1.5rem;
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  &__folders {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 2rem;
  }

  &__folder {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 0 24px 24px 0;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f1f3f4;
    }

    &--active {
      background-color: #e8f0fe;
      color: #1967d2;
      font-weight: 600;

      .sora-mail__folder-icon {
        color: #1967d2;
      }
    }
  }

  &__folder-icon {
    width: 20px;
    height: 20px;
  }

  &__folder-name {
    flex: 1;
  }

  &__folder-count {
    background-color: #e8f0fe;
    color: #1967d2;
    font-size: 0.875rem;
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
    font-weight: 600;
  }

  &__labels {
    margin-bottom: 2rem;
  }

  &__labels-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #333333;
    margin: 0 0 0.75rem 1rem;
  }

  &__label {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
    border-radius: 0 24px 24px 0;

    &:hover {
      background-color: #f1f3f4;
    }
  }

  &__label-color {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  &__label-name {
    flex: 1;
    font-size: 0.875rem;
  }

  &__sidebar-footer {
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid #e0e0e0;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid #e0e0e0;
    background-color: #fff;
  }

  &__toolbar-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__toolbar-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__toolbar-info {
    font-size: 0.875rem;
    color: #333333;
  }

  &__mail-list {
    flex: 1;
    overflow-y: auto;
  }

  &__mail-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e0e0e0;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f5f7f8;
      box-shadow: inset 1px 0 0 #4285f4;
    }

    &--unread {
      background-color: #f8f9fa;
      font-weight: 600;

      .sora-mail__mail-subject {
        color: #202124;
      }
    }
  }

  &__mail-checkbox {
    flex-shrink: 0;
  }

  &__mail-star {
    flex-shrink: 0;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 50%;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f1f3f4;
    }
  }

  &__mail-sender {
    flex-shrink: 0;
    width: 200px;
    display: flex;
    flex-direction: column;
  }

  &__mail-sender-name {
    font-weight: 600;
    font-size: 0.875rem;
    color: #202124;
    margin-bottom: 0.125rem;
  }

  &__mail-sender-email {
    font-size: 0.75rem;
    color: #333333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__mail-content {
    flex: 1;
    min-width: 0;
  }

  &__mail-subject {
    font-size: 0.875rem;
    color: #202124;
    margin-bottom: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__mail-important {
    font-size: 0.75rem;
    color: #ea4335;
    background-color: #fce8e6;
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    font-weight: 600;
  }

  &__mail-preview {
    font-size: 0.8125rem;
    color: #333333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__mail-time {
    flex-shrink: 0;
    width: 120px;
    text-align: right;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
  }

  &__mail-time-text {
    font-size: 0.75rem;
    color: #333333;
  }

  &__mail-actions {
    display: flex;
    gap: 0.25rem;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &__mail-item:hover &__mail-actions {
    opacity: 1;
  }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
}

// Responsive adjustments
@media (max-width: 1024px) {
  .sora-mail__sidebar {
    width: 200px;
  }

  .sora-mail__mail-sender {
    width: 150px;
  }
}

@media (max-width: 768px) {
  .sora-mail__sidebar {
    width: 64px;
    padding: 1rem 0.5rem;

    .sora-mail__compose-button,
    .sora-mail__folder-name,
    .sora-mail__labels-title,
    .sora-mail__label-name,
    .sora-mail__folder-count {
      display: none;
    }

    .sora-mail__folder {
      justify-content: center;
      padding: 0.75rem;
      border-radius: 50%;
    }

    .sora-mail__label {
      justify-content: center;
      padding: 0.5rem;
    }
  }

  .sora-mail__mail-sender {
    width: 120px;
  }

  .sora-mail__mail-time {
    width: 80px;
  }
}
</style>
