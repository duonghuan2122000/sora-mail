import './assets/main.css'

import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'

// i18n configuration
const messages = {
  en: {
    appTitle: 'Sora Mail',
    appSubtitle: 'Your unified email client',
    connectAccount: 'Connect Your Email Account',
    selectProvider: 'Select an email provider to get started',
    gmail: 'Gmail',
    gmailDescription: 'Google Mail Service',
    connectGmail: 'Connect Gmail',
    gmailOAuthDescription: 'Secure OAuth 2.0 connection',
    connectedAccounts: 'Connected Accounts',
    active: 'Active',
    inactive: 'Inactive',
    addAnotherAccount: 'Add Another Account',
    comingSoon: 'More providers coming soon',
    secureNote: 'Sora Mail securely connects to your email accounts using OAuth 2.0',
    aboutTitle: 'About Sora Mail',
    aboutDescription:
      'A modern desktop email client built with Electron and Vue.js. Currently supports Gmail with more providers on the way.',
    secure: 'Secure',
    fast: 'Fast',
    crossPlatform: 'Cross-platform',
    versionInfo: 'Version 1.0.0 • Built with Electron & Vue.js',
    // OAuth messages
    oauthBrowserOpened:
      'OAuth authentication opened in your browser. Please complete the authentication process.',
    oauthSuccess: 'Authentication successful!',
    oauthError: 'Authentication failed. Please try again.',
    oauthCancelled: 'Authentication cancelled by user.',
    oauthInProgress: 'Authentication in Progress',
    oauthStatusMessage:
      'Please complete the authentication in your browser. This window will close automatically when done.',
    // Sync messages
    syncStarted: 'Syncing your emails...',
    syncCompleted: 'Successfully synced {count} emails',
    syncError: 'Sync failed. Please try again.',
    syncWarning: 'Connected but sync had issues. You can retry later.',
    // Configuration messages
    providerConfigRequired:
      'Gmail provider needs to be configured first. You need to add your Google OAuth credentials.',
    configurationRequired: 'Configuration Required',
    configure: 'Configure',
    cancel: 'Cancel',
    enterGoogleCredentials: 'Please enter your Google OAuth credentials (JSON format):',
    googleOAuthConfig: 'Google OAuth Configuration',
    save: 'Save',
    configSaved: 'Configuration saved successfully!',
    invalidJson: 'Invalid JSON format. Please check your input.'
  },
  vi: {
    appTitle: 'Sora Mail',
    appSubtitle: 'Trình đọc email thống nhất của bạn',
    connectAccount: 'Kết nối tài khoản email của bạn',
    selectProvider: 'Chọn nhà cung cấp email để bắt đầu',
    gmail: 'Gmail',
    gmailDescription: 'Dịch vụ thư điện tử Google',
    connectGmail: 'Kết nối Gmail',
    gmailOAuthDescription: 'Kết nối OAuth 2.0 an toàn',
    connectedAccounts: 'Tài khoản đã kết nối',
    active: 'Hoạt động',
    inactive: 'Không hoạt động',
    addAnotherAccount: 'Thêm tài khoản khác',
    comingSoon: 'Sẽ có thêm nhà cung cấp',
    secureNote: 'Sora Mail kết nối an toàn đến tài khoản email của bạn sử dụng OAuth 2.0',
    aboutTitle: 'Giới thiệu Sora Mail',
    aboutDescription:
      'Một ứng dụng email desktop hiện đại được xây dựng bằng Electron và Vue.js. Hiện tại hỗ trợ Gmail và sẽ có thêm nhiều nhà cung cấp khác.',
    secure: 'Bảo mật',
    fast: 'Nhanh chóng',
    crossPlatform: 'Đa nền tảng',
    versionInfo: 'Phiên bản 1.0.0 • Xây dựng bằng Electron & Vue.js',
    // OAuth messages
    oauthBrowserOpened:
      'Xác thực OAuth đã mở trong trình duyệt của bạn. Vui lòng hoàn tất quá trình xác thực.',
    oauthSuccess: 'Xác thực thành công!',
    oauthError: 'Xác thực thất bại. Vui lòng thử lại.',
    oauthCancelled: 'Xác thực đã bị hủy bởi người dùng.',
    oauthInProgress: 'Đang xác thực',
    oauthStatusMessage:
      'Vui lòng hoàn tất xác thực trong trình duyệt của bạn. Cửa sổ này sẽ tự động đóng khi hoàn tất.',
    // Sync messages
    syncStarted: 'Đang đồng bộ email của bạn...',
    syncCompleted: 'Đã đồng bộ thành công {count} email',
    syncError: 'Đồng bộ thất bại. Vui lòng thử lại.',
    syncWarning: 'Đã kết nối nhưng đồng bộ gặp sự cố. Bạn có thể thử lại sau.',
    // Configuration messages
    providerConfigRequired:
      'Cần cấu hình nhà cung cấp Gmail trước. Bạn cần thêm thông tin xác thực OAuth của Google.',
    configurationRequired: 'Yêu cầu cấu hình',
    configure: 'Cấu hình',
    cancel: 'Hủy',
    enterGoogleCredentials: 'Vui lòng nhập thông tin xác thực OAuth của Google (định dạng JSON):',
    googleOAuthConfig: 'Cấu hình OAuth Google',
    save: 'Lưu',
    configSaved: 'Cấu hình đã được lưu thành công!',
    invalidJson: 'Định dạng JSON không hợp lệ. Vui lòng kiểm tra lại.'
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
app.use(router)
app.mount('#app')
