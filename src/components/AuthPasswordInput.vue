<template>
  <div class="password-input-wrap">
    <input
      :value="modelValue"
      :type="showPassword ? 'text' : 'password'"
      class="field-input"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <button
      type="button"
      class="password-toggle"
      :aria-label="showPassword ? 'Hide password' : 'Show password'"
      @click="showPassword = !showPassword"
    >
      <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline" />
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { IonIcon } from '@ionic/vue'
import { eyeOutline, eyeOffOutline } from 'ionicons/icons'

defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  autocomplete: { type: String, default: 'current-password' }
})

defineEmits(['update:modelValue'])

const showPassword = ref(false)
</script>

<style scoped>
.password-input-wrap {
  position: relative;
  width: 100%;
}

.field-input {
  width: 100%;
  height: 38px;
  padding: 0 40px 0 10px;
  border: 1px solid rgba(255, 141, 40, 0.75);
  border-radius: 10px;
  background: transparent;
  font-size: 15px;
  color: rgba(0, 0, 0, 0.72);
  outline: none;
  box-shadow: 0 3px 4px 1px rgba(0, 0, 0, 0.16);
  box-sizing: border-box;
}

.field-input::placeholder {
  color: rgba(0, 0, 0, 0.3);
}

.field-input:focus {
  border-color: rgba(255, 141, 40, 1);
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: none;
  background: transparent;
  color: rgba(255, 141, 40, 0.75);
  cursor: pointer;
  transform: translateY(-50%);
}

.password-toggle ion-icon {
  font-size: 20px;
}
</style>
