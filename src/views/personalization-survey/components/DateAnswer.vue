<template>
  <div class="date-wrap">
    <input
      :value="modelValue"
      type="date"
      class="date-input"
      :disabled="disabled"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.date-wrap {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.date-input {
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

.date-input:focus {
  border-color: #ff8d28;
}

.date-input:disabled {
  opacity: 0.6;
}
</style>
