<template>
  <div class="survey-actions">
    <p v-if="validationError" class="validation-error">{{ validationError }}</p>

    <button
      v-if="showContinue"
      type="button"
      class="continue-btn"
      :disabled="disabled"
      @click="$emit('continue')"
    >
      Continue
    </button>

    <button
      v-if="showSkipStep"
      type="button"
      class="link-btn"
      :disabled="disabled"
      @click="$emit('skip-step')"
    >
      Skip this step →
    </button>

  </div>
</template>

<script setup>
defineProps({
  showContinue: { type: Boolean, default: false },
  showSkipStep: { type: Boolean, default: false },
  validationError: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})

defineEmits(['continue', 'skip-step'])
</script>

<style scoped>
.survey-actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  width: 100%;
}

.validation-error {
  margin: 0;
  font-size: 13px;
  color: #c30010;
  text-align: center;
}

.continue-btn {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  height: 48px;
  border: none;
  border-radius: 12px;
  background: #ff8d28;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.continue-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.link-btn {
  border: none;
  background: none;
  padding: 8px 4px;
  font-size: 13px;
  color: rgba(110, 106, 124, 0.75);
  cursor: pointer;
}

.link-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
