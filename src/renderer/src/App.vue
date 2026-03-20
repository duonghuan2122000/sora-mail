<script setup>
import Versions from './components/Versions.vue'

const ipcHandle = () => window.electron.ipcRenderer.send('ping')
</script>

<template>
  <img alt="logo" class="logo" src="./assets/electron.svg" />
  <div class="creator">Powered by electron-vite</div>
  <div class="text">
    Build an Electron app with
    <span class="vue">Vue</span>
  </div>
  <p class="tip">Please try pressing <code>F12</code> to open the devTool</p>
  <div class="actions">
    <div class="action">
      <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">Documentation</a>
    </div>
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="ipcHandle">Send IPC</a>
    </div>
  </div>
  <Versions />

  <div
    class="element-plus-demo"
    style="margin-top: 2rem; padding: 1rem; border-top: 1px solid #eee"
  >
    <h3>Element Plus Demo</h3>

    <div style="margin: 1rem 0">
      <el-button type="primary">Primary Button</el-button>
      <el-button type="success" style="margin-left: 1rem">Success Button</el-button>
      <el-button type="warning" style="margin-left: 1rem">Warning Button</el-button>
    </div>

    <div style="margin: 1rem 0">
      <el-input placeholder="Please input" style="width: 300px" />
    </div>

    <div style="margin: 1rem 0">
      <el-card class="box-card" style="width: 400px">
        <template #header>
          <div class="card-header">
            <span>Card title</span>
          </div>
        </template>
        <div>This is a demo card from Element Plus</div>
        <div style="margin-top: 1rem">
          <el-tag type="success">Success Tag</el-tag>
          <el-tag type="info" style="margin-left: 0.5rem">Info Tag</el-tag>
        </div>
      </el-card>
    </div>
  </div>
</template>
