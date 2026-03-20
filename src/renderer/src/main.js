import './assets/main.css'

import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'

// i18n configuration
const messages = {
  en: {
    appTitle: 'Sora Mail',
    appSubtitle: 'Your unified email client',
    connectAccount: 'Connect Your Email Account',
    selectProvider: 'Select an email provider to get started',
    gmail: 'Gmail',
    gmailDescription: 'Google Mail Service',
    comingSoon: 'More providers coming soon',
    secureNote: 'Sora Mail securely connects to your email accounts using OAuth 2.0',
    aboutTitle: 'About Sora Mail',
    aboutDescription:
      'A modern desktop email client built with Electron and Vue.js. Currently supports Gmail with more providers on the way.',
    secure: 'Secure',
    fast: 'Fast',
    crossPlatform: 'Cross-platform',
    versionInfo: 'Version 1.0.0 • Built with Electron & Vue.js'
  },
  vi: {
    appTitle: 'Sora Mail',
    appSubtitle: 'Trình đọc email thống nhất của bạn',
    connectAccount: 'Kết nối tài khoản email của bạn',
    selectProvider: 'Chọn nhà cung cấp email để bắt đầu',
    gmail: 'Gmail',
    gmailDescription: 'Dịch vụ thư điện tử Google',
    comingSoon: 'Sẽ có thêm nhà cung cấp',
    secureNote: 'Sora Mail kết nối an toàn đến tài khoản email của bạn sử dụng OAuth 2.0',
    aboutTitle: 'Giới thiệu Sora Mail',
    aboutDescription:
      'Một ứng dụng email desktop hiện đại được xây dựng bằng Electron và Vue.js. Hiện tại hỗ trợ Gmail và sẽ có thêm nhiều nhà cung cấp khác.',
    secure: 'Bảo mật',
    fast: 'Nhanh chóng',
    crossPlatform: 'Đa nền tảng',
    versionInfo: 'Phiên bản 1.0.0 • Xây dựng bằng Electron & Vue.js'
  }
}

const i18n = createI18n({
  locale: 'en', // default locale
  fallbackLocale: 'en',
  messages
})

const app = createApp(App)
app.use(i18n)
app.use(ElementPlus)
app.mount('#app')
