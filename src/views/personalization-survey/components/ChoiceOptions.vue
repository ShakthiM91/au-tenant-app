<template>
  <div class="choice-list">
    <button
      v-for="opt in options"
      :key="opt.id"
      type="button"
      class="choice-btn"
      :class="{ selected: selectedIds.includes(opt.id) }"
      :disabled="disabled"
      @click="$emit('select', opt.id)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  options: { type: Array, default: () => [] },
  selectedIds: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false }
})

defineEmits(['select'])
</script>

<style scoped>
.choice-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.choice-btn {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-height: 48px;
  padding: 14px 20px;
  border: 1px solid rgba(255, 141, 40, 0.85);
  border-radius: 12px;
  background: #ffffff;
  color: #3d3a45;
  font-size: 15px;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.choice-btn.selected {
  background: rgba(255, 141, 40, 0.12);
  border-color: #ff8d28;
}

.choice-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
