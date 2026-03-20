<script setup>
import { Message } from '@element-plus/icons-vue'

const handleGmailClick = () => {
  console.log('Gmail button clicked')
  // TODO: Implement Gmail authentication/connection
}
</script>

<template>
  <div class="sora-home">
    <div class="sora-home__header">
      <h1 class="sora-home__title">Sora Mail</h1>
      <p class="sora-home__subtitle">Your unified email client</p>
    </div>

    <div class="sora-home__content">
      <el-card class="sora-home__providers-card" shadow="hover">
        <template #header>
          <div class="sora-home__card-header">
            <h2 class="sora-home__card-title">Connect Your Email Account</h2>
            <p class="sora-home__card-description">Select an email provider to get started</p>
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
              <div class="sora-home__provider-name">Gmail</div>
              <div class="sora-home__provider-description">Google Mail Service</div>
            </div>
          </el-button>

          <div class="sora-home__coming-soon">
            <el-tag type="info" size="large">More providers coming soon</el-tag>
          </div>
        </div>

        <div class="sora-home__card-footer">
          <p class="sora-home__footer-note">
            Sora Mail securely connects to your email accounts using OAuth 2.0
          </p>
        </div>
      </el-card>

      <div class="sora-home__info">
        <el-card class="sora-home__info-card" shadow="never">
          <div class="sora-home__info-content">
            <h3>About Sora Mail</h3>
            <p>
              A modern desktop email client built with Electron and Vue.js. Currently supports Gmail
              with more providers on the way.
            </p>
            <div class="sora-home__features">
              <el-tag type="success" size="small">Secure</el-tag>
              <el-tag type="warning" size="small">Fast</el-tag>
              <el-tag type="info" size="small">Cross-platform</el-tag>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <div class="sora-home__footer">
      <p class="sora-home__version-info">Version 1.0.0 • Built with Electron & Vue.js</p>
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
    text-align: center;
    margin-bottom: 3rem;
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
  }
}
</style>
