<template>
  <div v-if="needRefresh" class="pwa-update-banner">
    <div class="pwa-update-content">
      <img :src="pwaIcon" alt="" class="pwa-update-icon" />
      <div class="pwa-update-text">
        <strong>Update available</strong>
        <span>A new version of Rupee Life is ready.</span>
      </div>
    </div>
    <div class="pwa-update-actions">
      <button type="button" class="pwa-update-btn" :disabled="updating" @click="applyUpdate">
        {{ updating ? 'Updating…' : 'Update now' }}
      </button>
      <button type="button" class="pwa-update-later" @click="$emit('dismiss')">
        Later
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const pwaIcon = '/logo.png'

defineProps({
  needRefresh: { type: Boolean, default: false }
})

const emit = defineEmits(['dismiss', 'update'])

const updating = ref(false)

async function applyUpdate() {
  updating.value = true
  emit('update')
}
</script>

<style scoped>
.pwa-update-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #e67a00;
  color: #fff;
  padding: 12px 16px calc(16px + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
  z-index: 100000;
  font-size: 14px;
}

.pwa-update-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.pwa-update-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
}

.pwa-update-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.pwa-update-text strong {
  font-size: 15px;
}

.pwa-update-text span {
  opacity: 0.85;
  line-height: 1.35;
}

.pwa-update-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pwa-update-btn {
  padding: 10px 20px;
  background: #fff;
  color: #c45f00;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}

.pwa-update-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.pwa-update-later {
  padding: 8px 12px;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  border: none;
  font-size: 14px;
  cursor: pointer;
  text-decoration: underline;
}
</style>
