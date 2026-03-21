<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Menu as IconMenu,
  Message,
  Search,
  Refresh,
  More,
  Star,
  Delete,
  User,
  Setting,
  ArrowLeft,
  ArrowRight,
  Document,
  Folder
} from '@element-plus/icons-vue'
import {
  getFullMail,
  toggleStar,
  deleteMail,
  initializeDatabase,
  getActiveAccount,
  initializeAccountData
} from '@renderer/services/mailServiceV2'

const route = useRoute()
const router = useRouter()

const mailId = route.params.id
const mail = ref(null)
const folderList = ref([])
const labelList = ref([])
const selectedFolder = ref('Inbox')
const searchQuery = ref('')
const isLoading = ref(true)
const activeAccount = ref(null)

const goBack = () => {
  router.push('/mail')
}

const handleToggleStar = async () => {
  if (mail.value) {
    const updatedMail = await toggleStar(mail.value)
    if (updatedMail) {
      mail.value = updatedMail
    }
  }
}

const handleDeleteMail = async () => {
  if (mail.value) {
    const success = await deleteMail(mail.value)
    if (success) {
      router.push('/mail')
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
    }

    // Load mail details
    const mailData = await getFullMail(mailId)
    mail.value = mailData

    if (!mail.value) {
      console.error('Mail not found:', mailId)
      // Could redirect to 404 page here
    }
  } catch (error) {
    console.error('Error loading mail detail:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
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
            :key="folder.name"
            class="sora-mail__folder"
            :class="{ 'sora-mail__folder--active': selectedFolder === folder.name }"
            @click="selectedFolder = folder.name"
          >
            <component :is="folder.icon" class="sora-mail__folder-icon" />
            <span class="sora-mail__folder-name">{{ folder.name }}</span>
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
            <el-button :icon="ArrowLeft" text @click="goBack">Back</el-button>
            <el-button :icon="Refresh" text />
            <el-button :icon="More" text />
          </div>
          <div class="sora-mail__toolbar-right">
            <el-button :icon="Document" text />
            <el-button :icon="Folder" text />
            <el-button :icon="Delete" text @click="handleDeleteMail" />
            <el-button :icon="More" text />
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="sora-mail__empty">
          <el-empty description="Loading email..." />
        </div>

        <!-- Mail Detail -->
        <div v-else-if="mail" class="sora-mail__mail-detail">
          <div class="sora-mail__mail-header">
            <div class="sora-mail__mail-subject-row">
              <h1 class="sora-mail__mail-subject">{{ mail.subject }}</h1>
              <div class="sora-mail__mail-actions">
                <el-button :icon="Star" text @click="handleToggleStar">
                  {{ mail.starred ? 'Unstar' : 'Star' }}
                </el-button>
                <el-button :icon="Refresh" text>Reply</el-button>
                <el-button :icon="ArrowRight" text>Forward</el-button>
                <el-button :icon="More" text />
              </div>
            </div>
            <div class="sora-mail__mail-sender-row">
              <div class="sora-mail__mail-sender-info">
                <el-avatar :size="40" :icon="User" class="sora-mail__mail-avatar" />
                <div class="sora-mail__mail-sender-details">
                  <div class="sora-mail__mail-sender-name">{{ mail.sender }}</div>
                  <div class="sora-mail__mail-sender-email">{{ mail.senderEmail }}</div>
                </div>
              </div>
              <div class="sora-mail__mail-time">
                <div class="sora-mail__mail-date">{{ mail.date }}</div>
                <div class="sora-mail__mail-time-text">{{ mail.time }}</div>
              </div>
            </div>
          </div>

          <div class="sora-mail__mail-body">
            <p class="sora-mail__mail-preview">{{ mail.preview }}</p>
            <div class="sora-mail__mail-content">
              <!-- In a real app, this would be the full email content -->
              <p>
                This is the full content of the email. In a real application, this would contain the
                complete email body with formatting, attachments, etc.
              </p>
              <p>For demonstration purposes, we're showing the preview text as the main content.</p>
            </div>
          </div>

          <div v-if="false" class="sora-mail__mail-attachments">
            <h3 class="sora-mail__attachments-title">Attachments</h3>
            <div class="sora-mail__attachment-list">
              <div class="sora-mail__attachment-item">
                <div class="sora-mail__attachment-icon">📎</div>
                <div class="sora-mail__attachment-info">
                  <div class="sora-mail__attachment-name">document.pdf</div>
                  <div class="sora-mail__attachment-size">2.4 MB</div>
                </div>
                <el-button text>Download</el-button>
              </div>
            </div>
          </div>

          <div class="sora-mail__mail-footer">
            <div class="sora-mail__reply-actions">
              <el-button type="primary" :icon="Refresh">Reply</el-button>
              <el-button :icon="ArrowRight">Forward</el-button>
              <el-button :icon="More">More</el-button>
            </div>
          </div>
        </div>

        <!-- Not found state -->
        <div v-else class="sora-mail__empty">
          <el-empty description="Email not found" />
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

  &__mail-detail {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
  }

  &__mail-header {
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 1.5rem;
    margin-bottom: 1.5rem;
  }

  &__mail-subject-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  &__mail-subject {
    font-size: 1.5rem;
    font-weight: 600;
    color: #202124;
    margin: 0;
  }

  &__mail-actions {
    display: flex;
    gap: 0.5rem;
  }

  &__mail-sender-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__mail-sender-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__mail-avatar {
    background-color: #e8f0fe;
    color: #1967d2;
  }

  &__mail-sender-details {
    display: flex;
    flex-direction: column;
  }

  &__mail-sender-name {
    font-weight: 600;
    font-size: 1rem;
    color: #202124;
  }

  &__mail-sender-email {
    font-size: 0.875rem;
    color: #333333;
  }

  &__mail-time {
    text-align: right;
  }

  &__mail-date {
    font-size: 0.875rem;
    font-weight: 600;
    color: #202124;
  }

  &__mail-time-text {
    font-size: 0.875rem;
    color: #333333;
  }

  &__mail-body {
    line-height: 1.6;
    color: #202124;
  }

  &__mail-preview {
    font-size: 1rem;
    margin-bottom: 1.5rem;
    color: #333333;
  }

  &__mail-content {
    font-size: 1rem;
    color: #202124;
  }

  &__mail-attachments {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e0e0e0;
  }

  &__attachments-title {
    font-size: 1rem;
    font-weight: 600;
    color: #202124;
    margin: 0 0 1rem;
  }

  &__attachment-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__attachment-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background-color: #f8f9fa;
  }

  &__attachment-icon {
    font-size: 1.5rem;
  }

  &__attachment-info {
    flex: 1;
  }

  &__attachment-name {
    font-weight: 600;
    font-size: 0.875rem;
    color: #202124;
  }

  &__attachment-size {
    font-size: 0.75rem;
    color: #333333;
  }

  &__mail-footer {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e0e0e0;
  }

  &__reply-actions {
    display: flex;
    gap: 1rem;
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

  .sora-mail__mail-detail {
    padding: 1rem;
  }

  .sora-mail__mail-subject-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .sora-mail__mail-sender-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .sora-mail__mail-time {
    text-align: left;
  }
}
</style>
