import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import database from './database/index.js'
import './services/databaseService.js'
import OAuthConfigService from './services/oauth/OAuthConfigService.js'
import createOAuthIpcHandlers from './services/oauth/OAuthIpcHandlers.js'

// OAuthIpcHandlers will be imported and initialized later
let oauthIpcHandlers = null

// Load environment variables
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Determine environment and load appropriate .env files
const env = process.env.NODE_ENV || 'development'
const envFile = env === 'production' ? '.env.production' : '.env.dev'
const rootDir = join(__dirname, '../../')

// Load base environment file
const baseEnvPath = join(rootDir, envFile)
if (existsSync(baseEnvPath)) {
  dotenv.config({ path: baseEnvPath })
  console.log(`📁 Loaded environment from: ${envFile}`)
} else {
  console.warn(`⚠️  Environment file not found: ${envFile}`)
}

// Load local overrides (optional)
const localEnvPath = join(rootDir, '.env.local')
if (existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath, override: true })
  console.log('📁 Loaded local overrides from: .env.local')
}

// Log loaded environment (for debugging)
console.log(`🚀 Environment: ${env}`)
console.log(`📁 App name: ${process.env.APP_NAME || 'Not set'}`)

function createWindow() {
  // Create the browser window with config from environment
  const width = parseInt(process.env.WINDOW_WIDTH) || 900
  const height = parseInt(process.env.WINDOW_HEIGHT) || 670
  const minWidth = parseInt(process.env.WINDOW_MIN_WIDTH) || 800
  const minHeight = parseInt(process.env.WINDOW_MIN_HEIGHT) || 600

  const mainWindow = new BrowserWindow({
    width,
    height,
    minWidth,
    minHeight,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Set main window for OAuth IPC handlers
  if (oauthIpcHandlers) {
    oauthIpcHandlers.setMainWindow(mainWindow)
    console.log('✅ OAuth IPC handlers connected to main window')
  } else {
    console.error('❌ OAuth IPC handlers not initialized')
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Initialize database
  await database.initialize().catch((error) => {
    console.error('Failed to initialize database:', error)
  })

  // Load OAuth configuration from environment variables
  try {
    await OAuthConfigService.loadConfigFromEnv()
  } catch (error) {
    console.error('Failed to load OAuth config:', error)
  }

  // Initialize OAuth IPC handlers before creating window
  console.log('🔧 Initializing OAuth services...')
  try {
    // Import and create OAuth IPC handlers with Electron dependencies
    // const { createOAuthIpcHandlers } = await import('./services/oauth/OAuthIpcHandlers.js')
    oauthIpcHandlers = createOAuthIpcHandlers({ BrowserWindow, shell }, ipcMain)
    console.log('✅ OAuth IPC handlers initialized')
  } catch (error) {
    console.error('❌ Failed to initialize OAuth IPC handlers:', error)
    // Fallback: register handlers directly
    console.log('🔄 Falling back to direct handler registration...')
    registerOAuthHandlersDirectly(ipcMain, { BrowserWindow, shell })
  }

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// Fallback function to register OAuth handlers directly
function registerOAuthHandlersDirectly(ipcMain, electron) {
  console.log('🔧 Registering OAuth handlers directly...')

  // Simple handler for testing
  ipcMain.handle('oauth:getAccounts', async () => {
    console.log('📋 oauth:getAccounts handler called')
    return {
      success: true,
      accounts: []
    }
  })

  ipcMain.handle('oauth:getGmailProviderConfig', async () => {
    console.log('📋 oauth:getGmailProviderConfig handler called')
    return {
      success: true,
      config: {
        clientId: '',
        clientSecret: '',
        redirectUri: 'http://localhost'
      }
    }
  })

  console.log('✅ Direct OAuth handlers registered')
}
