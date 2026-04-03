<template>
  <div class="gender-picker">
    <ul
      class="gender-list"
      role="radiogroup"
      :aria-label="ariaLabel"
    >
      <li v-for="opt in options" :key="opt.value" class="gender-item">
        <button
          type="button"
          class="gender-row"
          :class="{ selected: modelValue === opt.value }"
          role="radio"
          :aria-checked="modelValue === opt.value"
          @click="select(opt.value)"
        >
          <span class="gender-label">{{ opt.label }}</span>
          <ion-icon
            v-show="modelValue === opt.value"
            :icon="checkmarkOutline"
            class="gender-check"
            aria-hidden="true"
          />
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { IonIcon } from '@ionic/vue'
import { checkmarkOutline } from 'ionicons/icons'

defineProps({
  modelValue: { type: String, required: true },
  options: {
    type: Array,
    required: true
  },
  ariaLabel: { type: String, default: 'Gender' }
})

const emit = defineEmits(['update:modelValue'])

function select(value) {
  emit('update:modelValue', value)
}
</script>

<style scoped>
.gender-picker {
  width: 100%;
  margin-top: 2px;
}

.gender-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gender-item {
  margin: 0;
  padding: 0;
}

.gender-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  padding: 12px 4px 12px 2px;
  margin: 0;
  border: none;
  border-radius: 10px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  font-size: 16px;
  line-height: 1.35;
  color: #a8a8a8;
  font-weight: 400;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}

.gender-row:active {
  background: rgba(0, 0, 0, 0.03);
}

.gender-row.selected {
  color: #1a1a2e;
  font-weight: 600;
}

.gender-row:focus {
  outline: none;
}

.gender-row:focus-visible {
  outline: 2px solid #ff8d28;
  outline-offset: 2px;
}

.gender-label {
  flex: 1;
  min-width: 0;
}

.gender-check {
  flex-shrink: 0;
  font-size: 22px;
  color: #ff8d28;
}
</style>
