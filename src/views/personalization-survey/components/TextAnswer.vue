<template>
  <div class="text-wrap">
    <input
      :value="modelValue"
      type="text"
      class="text-input"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="$emit('update:modelValue', $event.target.value)"
      @keyup.enter="$emit('submit')"
    />
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})

defineEmits(['update:modelValue', 'submit'])
</script>

<style scoped>
.text-wrap {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.text-input {
  display: block;
  width: 100%;
  max-width: 100%;
  height: 48px;
  padding: 0 18px;
  border: 1px solid rgba(255, 141, 40, 0.85);
  border-radius: 24px;
  background: #ffffff;
  color: #3d3a45;
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
}

.text-input:focus {
  border-color: #ff8d28;
}

.text-input:disabled {
  opacity: 0.6;
}

.text-input::placeholder {
  color: rgba(110, 106, 124, 0.5);
}
</style>
