<template>
  <header class="question-header">
    <h1 class="question-number">Question #{{ number }}</h1>
    <p class="question-text">{{ text }}</p>
  </header>
</template>

<script setup>
defineProps({
  number: { type: Number, required: true },
  text: { type: String, default: '' }
})
</script>

<style scoped>
.question-header {
  text-align: center;
  width: 100%;
}

.question-number {
  margin: 0 0 12px;
  font-size: 22px;
  font-weight: 700;
  color: #3d3a45;
  letter-spacing: -0.3px;
}

.question-text {
  margin: 0;
  font-size: 15px;
  font-weight: 400;
  line-height: 1.45;
  color: #6e6a7c;
}
</style>
