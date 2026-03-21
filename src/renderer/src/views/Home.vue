<script setup>
import { ref } from 'vue'
import { Message } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t, locale } = useI18n()
const router = useRouter()
const languages = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' }
]
const selectedLanguage = ref(locale.value)

const handleGmailClick = () => {
  console.log('Gmail button clicked')
  router.push('/mail')
}

const changeLanguage = (lang) => {
  locale.value = lang
  selectedLanguage.value = lang
}
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
          <el-button
            class="sora-home__provider-button"
            type="primary"
            size="large"
            :icon="Message"
            @click="handleGmailClick"
          >
            <div class="sora-home__provider-button-content">
              <div class="sora-home__provider-name">{{ t('gmail') }}</div>
              <div class="sora-home__provider-description">{{ t('gmailDescription') }}</div>
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
  }

  &__provider-button-content {
    text-align: left;
    margin-left: var(--space-4);
  }

  &__provider-name {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
  }

  &__provider-description {
    font-size: var(--font-size-sm);
    color: rgba(255, 255, 255, 0.8);
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
