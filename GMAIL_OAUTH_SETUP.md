# Hướng dẫn Cấu hình Gmail OAuth cho Sora Mail

## Tổng quan

Tính năng kết nối Gmail OAuth cho phép người dùng kết nối tài khoản Gmail của họ với ứng dụng Sora Mail một cách an toàn thông qua OAuth 2.0. Tính năng này bao gồm:

1. **Xác thực OAuth 2.0** với Google
2. **Lưu trữ token** an toàn trong SQLite database
3. **Đồng bộ hóa email** tự động
4. **Quản lý tài khoản** đa người dùng

## Cấu trúc Kiến trúc

### 1. Main Process Services

- `GoogleOAuthService.js`: Xử lý luồng OAuth với Google
- `OAuthIpcHandlers.js`: IPC handlers cho communication với renderer
- `GmailSyncService.js`: Đồng bộ hóa email từ Gmail API
- `OAuthConfigService.js`: Quản lý cấu hình OAuth

### 2. Database Models

- `ProviderModel.js`: Quản lý nhà cung cấp email (Gmail)
- `AccountModel.js`: Quản lý tài khoản người dùng và tokens
- `FolderModel.js`: Quản lý thư mục email
- `MailModel.js`: Quản lý email messages
- `LabelModel.js`: Quản lý labels/tags

### 3. Renderer Components

- `Home.vue`: Trang chủ với button kết nối Gmail
- UI components cho OAuth flow và account management

## Các bước Cấu hình

### Bước 1: Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Enable **Gmail API**:
   - Tìm "Gmail API" trong API Library
   - Click "Enable"

### Bước 2: Tạo OAuth 2.0 Credentials

1. Đi đến **Credentials** section
2. Click "Create Credentials" → "OAuth client ID"
3. Cấu hình OAuth consent screen:
   - Application type: "Desktop app"
   - Name: "Sora Mail"
   - Support email: your-email@gmail.com
   - Scopes: Thêm các scopes cần thiết

4. Tạo OAuth client ID:
   - Application type: "Desktop app"
   - Name: "Sora Mail Desktop"

5. Lưu **Client ID** và **Client Secret**

### Bước 3: Cấu hình Redirect URI

1. Trong OAuth client settings, thêm authorized redirect URI:
   - `http://localhost` (cho development)
   - Hoặc custom protocol: `sora-mail://oauth-callback`

### Bước 4: Cấu hình Environment Variables

1. Sao chép file `.env.sample` thành `.env.dev` (development) hoặc `.env.production`
2. Cập nhật các biến môi trường:

```env
# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID=your-client-id-here
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret-here
GOOGLE_OAUTH_REDIRECT_URI=http://localhost
```

### Bước 5: Cấu hình Provider trong Database

Ứng dụng sẽ tự động cập nhật provider config từ environment variables khi khởi động. Bạn cũng có thể cấu hình thủ công qua UI:

1. Chạy ứng dụng
2. Click "Connect Gmail"
3. Nếu chưa cấu hình, ứng dụng sẽ hiển thị dialog để nhập credentials
4. Nhập JSON config:

```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "redirectUri": "http://localhost",
  "scopes": [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.labels"
  ]
}
```

## Luồng OAuth

### 1. User Initiates Connection

- User clicks "Connect Gmail" button
- Ứng dụng kiểm tra provider config
- Nếu chưa cấu hình, hiển thị configuration dialog

### 2. OAuth Flow

- Mở browser với Google OAuth URL
- User đăng nhập và cấp quyền
- Google redirect về `http://localhost` với authorization code

### 3. Token Exchange

- Ứng dụng exchange code lấy access/refresh tokens
- Lưu tokens vào database (encrypted)
- Lấy thông tin user profile

### 4. Sync Process

- Đồng bộ hóa labels/folders
- Đồng bộ hóa email messages (50 emails mới nhất)
- Cập nhật sync status

## Database Schema

### Tables liên quan đến OAuth:

```sql
-- Providers table
CREATE TABLE providers (
  id CHAR(36) PRIMARY KEY,
  name TEXT NOT NULL,              -- 'gmail'
  display_name TEXT NOT NULL,      -- 'Gmail'
  auth_type TEXT NOT NULL,         -- 'oauth2'
  config TEXT,                     -- JSON config
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Accounts table
CREATE TABLE accounts (
  id CHAR(36) PRIMARY KEY,
  provider_id CHAR(36) NOT NULL,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  access_token TEXT,               -- Encrypted
  refresh_token TEXT,              -- Encrypted
  token_expiry TIMESTAMP,
  sync_enabled BOOLEAN DEFAULT 1,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Security Considerations

### 1. Token Storage

- Access tokens và refresh tokens được encrypt trước khi lưu
- Sử dụng system keychain/credential manager (future enhancement)

### 2. OAuth Security

- Sử dụng state parameter cho CSRF protection
- PKCE support (future enhancement)
- Token auto-refresh trước khi expiry

### 3. IPC Security

- Context isolation enabled
- Input validation cho tất cả IPC handlers
- Secure API exposure qua preload scripts

## Testing

### Test Cases đã triển khai:

1. **OAuth Flow Tests**:
   - Successful authentication
   - User cancellation
   - Network failures
   - Invalid credentials

2. **Database Tests**:
   - Provider config management
   - Account creation/update
   - Token storage/retrieval

3. **Sync Tests**:
   - Label/folder sync
   - Message sync
   - Error handling

4. **UI Tests**:
   - Button states (loading, disabled)
   - Error messages
   - Success flows

## Troubleshooting

### Common Issues:

1. **"Invalid redirect_uri" error**:
   - Kiểm tra redirect URI trong Google Cloud Console
   - Đảm bảo khớp với config trong ứng dụng

2. **"Client ID not found" error**:
   - Kiểm tra client ID trong environment variables
   - Đảm bảo OAuth consent screen đã được cấu hình

3. **Token refresh failures**:
   - Kiểm tra refresh token có tồn tại trong database
   - Đảm bảo scopes đầy đủ (cần offline access)

4. **Sync errors**:
   - Kiểm tra network connectivity
   - Kiểm tra Gmail API quota limits
   - Xem logs trong console

### Debug Logs:

```bash
# Development logs
npm run dev

# Check database
sqlite3 ~/Library/Application\ Support/sora-mail/sora-mail.db
SELECT * FROM providers;
SELECT email, last_sync_at FROM accounts;
```

## Future Enhancements

### Planned Features:

1. **Enhanced Security**:
   - System keychain integration
   - Certificate pinning
   - Advanced token encryption

2. **Advanced Sync**:
   - Incremental sync với Gmail history API
   - Real-time push notifications
   - Batch operations

3. **UI Improvements**:
   - OAuth popup trong ứng dụng
   - Sync progress indicators
   - Account management UI

4. **Multi-provider Support**:
   - Outlook/Office 365
   - Yahoo Mail
   - IMAP/POP3

## Development Notes

### Code Structure:

```
src/main/services/oauth/
├── GoogleOAuthService.js      # Core OAuth logic
├── OAuthIpcHandlers.js        # IPC communication
├── OAuthConfigService.js      # Configuration management
└── GmailSyncService.js        # Email synchronization

src/main/database/models/
├── ProviderModel.js           # Provider management
├── AccountModel.js            # Account & token management
├── FolderModel.js             # Folder management
├── MailModel.js               # Email management
└── LabelModel.js              # Label management

src/renderer/src/views/
└── Home.vue                   # Main UI with Gmail button
```

### Dependencies:

```json
{
  "googleapis": "^144.0.0", // Google APIs client
  "open": "^10.1.0", // Open URLs in browser
  "better-sqlite3": "^12.8.0", // Database
  "knex": "^3.1.0", // Query builder
  "uuid": "^13.0.0" // UUID generation
}
```

## Support

Nếu gặp vấn đề:

1. Kiểm tra logs trong developer console
2. Xác minh Google Cloud Console configuration
3. Kiểm tra environment variables
4. Xem database trực tiếp

Liên hệ development team nếu cần hỗ trợ thêm.

---

**Lưu ý**: Đây là tính năng beta. Vui lòng báo cáo bất kỳ issue nào gặp phải để chúng tôi có thể cải thiện.
