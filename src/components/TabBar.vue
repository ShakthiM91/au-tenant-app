<template>
  <div class="tab-bar">
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        class="tab-item"
        :class="{ active: isActive(tab) }"
        @click="tab.action()"
      >
        <div class="tab-icon" v-html="tab.icon" />
      </button>
    </div>
    <div class="home-indicator">
      <div class="indicator-bar" />
    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

function isActive(tab) {
  return tab.route && route.path.startsWith(tab.route)
}

const tabs = [
  {
    name: 'home',
    route: '/home',
    action: () => router.push('/home'),
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 12.5L12 3.5L21 12.5V20.5C21 21.0523 20.5523 21.5 20 21.5H15V15.5H9V21.5H4C3.44772 21.5 3 21.0523 3 20.5V12.5Z"/>
    </svg>`
  },
  {
    name: 'accounts',
    route: '/accounts',
    action: () => router.push('/accounts'),
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="4" y="4" width="16" height="5" rx="1"/>
      <rect x="4" y="11" width="16" height="5" rx="1"/>
      <rect x="6" y="18" width="12" height="3" rx="1"/>
    </svg>`
  },
  {
    name: 'add',
    route: null,
    action: () => router.push('/transactions/create'),
    icon: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="2" y="2" width="24" height="24" rx="6"/>
      <line x1="14" y1="8" x2="14" y2="20"/>
      <line x1="8" y1="14" x2="20" y2="14"/>
    </svg>`
  },
  {
    name: 'tasks',
    route: '/tasks',
    action: () => router.push('/tasks'),
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <path d="M14 17.5L16.5 20L21 14"/>
    </svg>`
  },
  {
    name: 'profile',
    route: '/profile',
    action: () => router.push('/profile'),
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 21C4 17.134 7.58172 14 12 14C16.4183 14 20 17.134 20 21"/>
    </svg>`
  }
]
</script>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  z-index: 100;
  border-top: 1px solid #f0f0f0;
}

.tabs {
  display: flex;
  height: 44px;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0;
  color: #8E8E93;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.tab-item.active {
  color: #FF8D28;
}

.tab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-indicator {
  display: flex;
  justify-content: center;
  padding: 8px 0;
  height: 21px;
  box-sizing: border-box;
}

.indicator-bar {
  width: 134px;
  height: 5px;
  background: #000;
  border-radius: 3px;
}
</style>
