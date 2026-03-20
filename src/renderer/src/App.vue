<script setup>
import { ref } from 'vue'
import { Message, Globe } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const languages = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' }
]
const selectedLanguage = ref(locale.value)

const handleGmailClick = () => {
  console.log('Gmail button clicked')
  // TODO: Implement Gmail authentication/connection
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
          :prefix-icon="Globe"
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
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 3rem;
    width: 100%;
  }

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
    color: #666;
    margin-top: 0.5rem;
  }

  &__content {
    width: 100%;
  }

  &__providers-card {
    margin-bottom: 2rem;
  }

  &__card-header {
    text-align: center;
  }

  &__card-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
  }

  &__card-description {
    color: #666;
    margin-top: 0.5rem;
  }

  &__providers-list {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 1rem 0;
  }

  &__provider-button {
    width: 280px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 2rem;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }

  &__provider-button-content {
    text-align: left;
    margin-left: 1rem;
  }

  &__provider-name {
    font-size: 1.2rem;
    font-weight: 600;
  }

  &__provider-description {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.8);
    margin-top: 0.25rem;
  }

  &__coming-soon {
    margin-top: 1rem;
  }

  &__card-footer {
    text-align: center;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #eee;
  }

  &__footer-note {
    color: #666;
    font-size: 0.9rem;
    margin: 0;
  }

  &__info {
    margin-top: 2rem;
  }

  &__info-card {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
  }

  &__info-content {
    text-align: center;

    h3 {
      margin: 0 0 1rem 0;
      color: #333;
    }

    p {
      color: #666;
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }
  }

  &__features {
    display: flex;
    justify-content: center;
    gap: 8px;
  }

  &__footer {
    margin-top: 3rem;
    text-align: center;
  }

  &__version-info {
    color: #999;
    font-size: 0.9rem;
  }

  // Responsive styles
  @media (max-width: 768px) {
    padding: 1rem;

    &__title {
      font-size: 2.5rem;
    }

    &__subtitle {
      font-size: 1rem;
    }

    &__provider-button {
      width: 100%;
      max-width: 280px;
    }

    &__card-title {
      font-size: 1.3rem;
    }

    &__features {
      flex-wrap: wrap;
      justify-content: center;
    }

    &__header {
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
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
      font-size: 2rem;
    }

    &__header {
      margin-bottom: 2rem;
    }

    &__provider-button {
      height: 70px;
      padding: 0 1.5rem;
    }

    &__provider-name {
      font-size: 1.1rem;
    }

    &__provider-description {
      font-size: 0.85rem;
    }

    &__language-select {
      width: 110px;
    }
  }
}
</style>
