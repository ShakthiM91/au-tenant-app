<template>
  <div v-if="show" class="overlay">
    <div class="spinner" />
    <p class="label">Saving…</p>
  </div>
</template>

<script setup>
defineProps({
  show: { type: Boolean, default: false }
})
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.85);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255, 141, 40, 0.25);
  border-top-color: #ff8d28;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.label {
  margin: 0;
  font-size: 14px;
  color: #6e6a7c;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
