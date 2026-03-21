<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const { t, locale } = useI18n()
const router = useRouter()
const languages = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' }
]
const selectedLanguage = ref(locale.value)
const isConnecting = ref(false)
const accounts = ref([])

// Initialize database and load accounts
onMounted(async () => {
  try {
    await window.database.initialize()
    await loadAccounts()
  } catch (error) {
    console.error('Failed to initialize:', error)
  }
})

// Load connected accounts
const loadAccounts = async () => {
  try {
    const result = await window.database.oauth.getAccounts()
    if (result.success) {
      accounts.value = result.accounts
    }
  } catch (error) {
    console.error('Error loading accounts:', error)
  }
}

// Handle Gmail OAuth
const handleGmailClick = async () => {
  if (isConnecting.value) return

  isConnecting.value = true

  try {
    // Check if Gmail provider is configured
    const config = await window.database.oauth.getGmailProviderConfig()
    if (!config.success) {
      throw new Error('Gmail provider not configured')
    }

    if (!config.config.clientId || config.config.clientId === '***') {
      await showProviderConfigDialog()
      return
    }

    // Setup event listeners
    setupOAuthListeners()

    // Start OAuth flow
    const result = await window.database.oauth.startGmail()

    if (!result.success) {
      throw new Error(result.error || 'Failed to start OAuth flow')
    }

    ElMessage.info(t('oauthBrowserOpened'))

    // Show OAuth status dialog
    await showOAuthStatusDialog()
  } catch (error) {
    console.error('OAuth error:', error)
    ElMessage.error(error.message || t('oauthError'))
    isConnecting.value = false
  }
}

// Setup OAuth event listeners
const setupOAuthListeners = () => {
  window.database.oauth.onOAuthSuccess(() => {
    console.log('OAuth success')
    ElMessage.success(t('oauthSuccess'))
    handleOAuthSuccess()
  })

  window.database.oauth.onOAuthError(() => {
    console.error('OAuth error')
    ElMessage.error(t('oauthError'))
    isConnecting.value = false
  })

  window.database.oauth.onOAuthCancelled(() => {
    console.log('OAuth cancelled by user')
    ElMessage.info(t('oauthCancelled'))
    isConnecting.value = false
  })

  window.database.oauth.onSyncStarted(() => {
    console.log('Sync started')
    ElMessage.info(t('syncStarted'))
  })

  window.database.oauth.onSyncCompleted(() => {
    console.log('Sync completed')
    ElMessage.success(t('syncCompleted', { count: 0 }))
    handleSyncCompleted()
  })

  window.database.oauth.onSyncError(() => {
    console.error('Sync error')
    ElMessage.error(t('syncError'))
  })
}

// Cleanup event listeners
const cleanupOAuthListeners = () => {
  window.database.oauth.removeOAuthSuccess()
  window.database.oauth.removeOAuthError()
  window.database.oauth.removeOAuthCancelled()
  window.database.oauth.removeSyncStarted()
  window.database.oauth.removeSyncCompleted()
  window.database.oauth.removeSyncError()
}

// Handle OAuth success
const handleOAuthSuccess = async (data) => {
  try {
    // Start sync process
    const syncResult = await window.database.oauth.syncAccount(data.account.id)

    if (syncResult.success) {
      // Reload accounts
      await loadAccounts()

      // Navigate to mail view
      setTimeout(() => {
        router.push('/mail')
      }, 1000)
    } else {
      ElMessage.warning(t('syncWarning'))
      // Still navigate but show warning
      setTimeout(() => {
        router.push('/mail')
      }, 1000)
    }
  } catch (error) {
    console.error('Sync error:', error)
    ElMessage.warning(t('syncWarning'))
    // Navigate anyway
    setTimeout(() => {
      router.push('/mail')
    }, 1000)
  } finally {
    isConnecting.value = false
    cleanupOAuthListeners()
  }
}

// Handle sync completion
const handleSyncCompleted = async () => {
  await loadAccounts()
}

// Show provider configuration dialog
const showProviderConfigDialog = async () => {
  try {
    await ElMessageBox.confirm(t('providerConfigRequired'), t('configurationRequired'), {
      confirmButtonText: t('configure'),
      cancelButtonText: t('cancel'),
      type: 'warning'
    })

    // Show configuration dialog
    await showConfigurationDialog()
  } catch {
    // User cancelled
    isConnecting.value = false
  }
}

// Show configuration dialog
const showConfigurationDialog = async () => {
  try {
    const { value: formValues } = await ElMessageBox.prompt(
      t('enterGoogleCredentials'),
      t('googleOAuthConfig'),
      {
        confirmButtonText: t('save'),
        cancelButtonText: t('cancel'),
        inputType: 'textarea',
        inputValue: JSON.stringify(
          {
            clientId: '',
            clientSecret: '',
            redirectUri: 'http://localhost',
            scopes: [
              'https://www.googleapis.com/auth/gmail.readonly',
              'https://www.googleapis.com/auth/gmail.modify',
              'https://www.googleapis.com/auth/gmail.labels'
            ]
          },
          null,
          2
        )
      }
    )

    try {
      const config = JSON.parse(formValues)
      const result = await window.database.oauth.updateGmailProviderConfig(config)

      if (result.success) {
        ElMessage.success(t('configSaved'))
        // Retry OAuth
        handleGmailClick()
      } else {
        throw new Error(result.error)
      }
    } catch {
      ElMessage.error(t('invalidJson'))
      isConnecting.value = false
    }
  } catch {
    // User cancelled
    isConnecting.value = false
  }
}

// Show OAuth status dialog
const showOAuthStatusDialog = async () => {
  try {
    await ElMessageBox.alert(t('oauthStatusMessage'), t('oauthInProgress'), {
      confirmButtonText: t('ok'),
      showClose: false,
      closeOnClickModal: false,
      closeOnPressEscape: false
    })
  } catch {
    // Dialog closed
    isConnecting.value = false
    cleanupOAuthListeners()
  }
}

// Handle existing account click
const handleAccountClick = () => {
  router.push('/mail')
}

const changeLanguage = (lang) => {
  locale.value = lang
  selectedLanguage.value = lang
}

// Cleanup on unmount
onUnmounted(() => {
  cleanupOAuthListeners()
})
</script>

<template>
  <div class="sora-home">
    <div class="sora-home__header">
      <div class="sora-home__header-content">
        <h1 class="sora-home__title">Sora Mail</h1>
        <p class="sora-home__subtitle">{{ t('appSubtitle') }}</p>
      </div>
      <div class="sora-home__language-switcher">
        <el-select
          v-model="selectedLanguage"
          class="sora-home__language-select"
          size="small"
          @change="changeLanguage"
        >
          <el-option
            v-for="lang in languages"
            :key="lang.value"
            :label="lang.label"
            :value="lang.value"
          />
        </el-select>
      </div>
    </div>

    <div class="sora-home__content">
      <el-card class="sora-home__providers-card" shadow="hover">
        <template #header>
          <div class="sora-home__card-header">
            <h2 class="sora-home__card-title">{{ t('connectAccount') }}</h2>
            <p class="sora-home__card-description">{{ t('selectProvider') }}</p>
          </div>
        </template>

        <div class="sora-home__providers-list">
          <!-- Connected Accounts -->
          <div v-if="accounts.length > 0" class="sora-home__connected-accounts">
            <h3 class="sora-home__accounts-title">{{ t('connectedAccounts') }}</h3>
            <div class="sora-home__accounts-list">
              <div
                v-for="account in accounts"
                :key="account.id"
                class="sora-home__account-item"
                @click="handleAccountClick(account)"
              >
                <div class="sora-home__account-avatar">
                  {{ account.email.charAt(0).toUpperCase() }}
                </div>
                <div class="sora-home__account-info">
                  <div class="sora-home__account-email">{{ account.email }}</div>
                  <div class="sora-home__account-provider">{{ account.provider_name }}</div>
                </div>
                <div class="sora-home__account-status">
                  <el-tag v-if="account.sync_enabled" type="success" size="small">
                    {{ t('active') }}
                  </el-tag>
                  <el-tag v-else type="info" size="small">
                    {{ t('inactive') }}
                  </el-tag>
                </div>
              </div>
            </div>
            <div class="sora-home__add-more">
              <el-button type="text" size="small" @click="handleGmailClick">
                {{ t('addAnotherAccount') }}
              </el-button>
            </div>
          </div>

          <!-- Gmail OAuth Button -->
          <el-button
            class="sora-home__provider-button sora-home__provider-button--gmail"
            type="primary"
            size="large"
            :loading="isConnecting"
            :disabled="isConnecting"
            @click="handleGmailClick"
          >
            <div class="sora-home__provider-button-content">
              <div class="sora-home__provider-icon">
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"
                  />
                  <path
                    fill="#34A853"
                    d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"
                  />
                  <path
                    fill="#4A90E2"
                    d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"
                  />
                </svg>
              </div>
              <div class="sora-home__provider-text">
                <div class="sora-home__provider-name">{{ t('connectGmail') }}</div>
                <div class="sora-home__provider-description">{{ t('gmailOAuthDescription') }}</div>
              </div>
            </div>
          </el-button>

          <div class="sora-home__coming-soon">
            <el-tag type="info" size="large">{{ t('comingSoon') }}</el-tag>
          </div>
        </div>

        <div class="sora-home__card-footer">
          <p class="sora-home__footer-note">
            {{ t('secureNote') }}
          </p>
        </div>
      </el-card>

      <div class="sora-home__info">
        <el-card class="sora-home__info-card" shadow="never">
          <div class="sora-home__info-content">
            <h3>{{ t('aboutTitle') }}</h3>
            <p>
              {{ t('aboutDescription') }}
            </p>
            <div class="sora-home__features">
              <el-tag type="success" size="small">{{ t('secure') }}</el-tag>
              <el-tag type="warning" size="small">{{ t('fast') }}</el-tag>
              <el-tag type="info" size="small">{{ t('crossPlatform') }}</el-tag>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <div class="sora-home__footer">
      <p class="sora-home__version-info">{{ t('versionInfo') }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sora-home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-8);
  max-width: 800px;
  margin: 0 auto;

  &__header-content {
    text-align: left;
  }

  &__language-switcher {
    flex-shrink: 0;
  }

  &__language-select {
    width: 140px;
  }

  &__title {
    font-size: 3rem;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  &__subtitle {
    font-size: 1.2rem;
    color: var(--color-text-soft);
    margin-top: var(--space-2);
  }

  &__content {
    width: 100%;
  }

  &__providers-card {
    margin-bottom: var(--space-8);
  }

  &__card-header {
    text-align: center;
  }

  &__card-title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    margin: 0;
  }

  &__card-description {
    color: var(--color-text-soft);
    margin-top: var(--space-2);
  }

  &__providers-list {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-6);
    padding: var(--space-4) 0;
  }

  &__connected-accounts {
    width: 100%;
    margin-bottom: var(--space-6);
  }

  &__accounts-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    margin: 0 0 var(--space-4) 0;
    color: var(--color-text);
    text-align: center;
  }

  &__accounts-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }

  &__account-item {
    display: flex;
    align-items: center;
    padding: var(--space-3) var(--space-4);
    background-color: var(--color-gray-50);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background-color: var(--color-gray-100);
      border-color: var(--color-primary-light);
      transform: translateX(2px);
    }
  }

  &__account-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-lg);
    margin-right: var(--space-3);
  }

  &__account-info {
    flex: 1;
  }

  &__account-email {
    font-weight: var(--font-weight-medium);
    color: var(--color-text);
    margin-bottom: 2px;
  }

  &__account-provider {
    font-size: var(--font-size-sm);
    color: var(--color-text-soft);
  }

  &__account-status {
    margin-left: var(--space-3);
  }

  &__add-more {
    text-align: center;
    margin-top: var(--space-2);
  }

  &__provider-button {
    width: 280px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 var(--space-8);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &--gmail {
      background: linear-gradient(135deg, #ea4335 0%, #4285f4 50%, #34a853 100%);
      border: none;
      color: var(--color-white);

      &:hover {
        background: linear-gradient(135deg, #d23a2d 0%, #3b78e7 50%, #2e9b4a 100%);
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }

      &:active {
        transform: translateY(0);
        box-shadow: var(--shadow-md);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      &.is-loading {
        .sora-home__provider-icon {
          opacity: 0.5;
        }
      }
    }
  }

  &__provider-button-content {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  &__provider-icon {
    flex-shrink: 0;
  }

  &__provider-text {
    text-align: left;
  }

  &__provider-name {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
  }

  &__provider-description {
    font-size: var(--font-size-sm);
    color: rgba(255, 255, 255, 0.9);
    margin-top: var(--space-1);
  }

  &__coming-soon {
    margin-top: var(--space-4);
  }

  &__card-footer {
    text-align: center;
    margin-top: var(--space-6);
    padding-top: var(--space-6);
    border-top: 1px solid var(--color-border-light);
  }

  &__footer-note {
    color: var(--color-text-soft);
    font-size: var(--font-size-sm);
    margin: 0;
  }

  &__info {
    margin-top: var(--space-8);
  }

  &__info-card {
    background-color: var(--color-gray-50);
    border: 1px solid var(--color-border-light);
  }

  &__info-content {
    text-align: center;

    h3 {
      margin: 0 0 1rem 0;
      color: var(--color-text);
    }

    p {
      color: var(--color-text-soft);
      line-height: var(--line-height-normal);
      margin-bottom: var(--space-6);
    }
  }

  &__features {
    display: flex;
    justify-content: center;
    gap: var(--space-2);
  }

  &__footer {
    margin-top: var(--space-12);
    text-align: center;
  }

  &__version-info {
    color: var(--color-text-mute);
    font-size: var(--font-size-sm);
  }

  // Responsive styles
  @media (max-width: 768px) {
    padding: var(--space-4);

    &__title {
      font-size: 2.5rem;
    }

    &__subtitle {
      font-size: var(--font-size-base);
    }

    &__provider-button {
      width: 100%;
      max-width: 280px;
    }

    &__card-title {
      font-size: var(--font-size-xl);
    }

    &__features {
      flex-wrap: wrap;
      justify-content: center;
    }

    &__header {
      flex-direction: column;
      align-items: center;
      gap: var(--space-6);
    }

    &__header-content {
      text-align: center;
    }

    &__language-select {
      width: 120px;
    }
  }

  @media (max-width: 480px) {
    &__title {
      font-size: var(--font-size-3xl);
    }

    &__header {
      margin-bottom: var(--space-8);
    }

    &__provider-button {
      height: 70px;
      padding: 0 var(--space-6);
    }

    &__provider-name {
      font-size: var(--font-size-lg);
    }

    &__provider-description {
      font-size: var(--font-size-sm);
    }

    &__language-select {
      width: 110px;
    }
  }
}
</style>
