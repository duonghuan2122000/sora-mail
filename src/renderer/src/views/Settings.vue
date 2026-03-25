<script setup>
import { useRouter } from 'vue-router'
import { Back } from '@element-plus/icons-vue'
import ThemeToggle from '@renderer/components/ThemeToggle.vue'

const router = useRouter()

const goBack = () => {
  router.push('/mail')
}
</script>

<template>
  <div class="settings-page">
    <div class="settings-header">
      <el-button :icon="Back" text @click="goBack">Back</el-button>
      <h1>Settings</h1>
    </div>
    <div class="settings-section">
      <h2>Appearance</h2>
      <div class="setting-item">
        <span class="setting-label">Theme</span>
        <ThemeToggle />
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  padding: var(--space-4);
  max-width: 800px;
  margin: 0 auto;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.settings-header h1 {
  margin: 0;
  flex: 1;
}

.settings-section {
  margin-top: var(--space-4);
  padding: var(--space-4);
  background: var(--color-background-soft);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border-light);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-weight: var(--font-weight-medium);
}
</style>
