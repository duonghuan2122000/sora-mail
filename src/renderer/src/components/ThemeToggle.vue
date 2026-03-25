<script setup>
import { ref, onMounted } from 'vue'

const theme = ref('light')

const loadTheme = async () => {
  try {
    const savedTheme = await window.database.getTheme()
    theme.value = savedTheme || 'light'
    applyTheme(theme.value)
  } catch (error) {
    console.error('Error loading theme:', error)
  }
}

const applyTheme = (newTheme) => {
  document.documentElement.setAttribute('data-theme', newTheme)
  if (newTheme === 'dark') {
    document.body.classList.add('dark')
  } else {
    document.body.classList.remove('dark')
  }
}

const handleThemeChange = async (newTheme) => {
  theme.value = newTheme
  applyTheme(newTheme)

  try {
    await window.database.setTheme(newTheme)
  } catch (error) {
    console.error('Error saving theme:', error)
  }
}

onMounted(() => {
  loadTheme()
})
</script>

<template>
  <div class="theme-toggle">
    <el-switch
      :model-value="theme"
      active-value="dark"
      inactive-value="light"
      active-text="Dark"
      inactive-text="Light"
      @update:model-value="handleThemeChange"
    />
  </div>
</template>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
</style>
