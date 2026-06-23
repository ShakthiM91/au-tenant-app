<template>
  <ion-modal
    mode="ios"
    class="chart-focus-modal"
    :is-open="open"
    @didDismiss="$emit('close')"
  >
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="$emit('close')">Close</ion-button>
        </ion-buttons>
        <ion-title>{{ title }}</ion-title>
      </ion-toolbar>
      <ion-toolbar v-if="subtitle" class="chart-focus-modal__subtitle-bar">
        <ion-title size="small">{{ subtitle }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="chart-focus-modal__content">
      <p class="chart-focus-modal__hint">Pinch or scroll to zoom · Drag to pan</p>
      <div class="chart-focus-modal__chart-wrap">
        <VChart class="chart-focus-modal__chart" :option="expandedOption" autoresize />
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { computed } from 'vue'
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
} from '@ionic/vue'
import { expandChartOption } from '@/views/analytics/chartOptions'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  option: { type: Object, default: () => ({}) },
})

defineEmits(['close'])

const expandedOption = computed(() => expandChartOption(props.option))
</script>

<style scoped>
.chart-focus-modal {
  --width: 100%;
  --height: 100%;
}

.chart-focus-modal__subtitle-bar {
  --min-height: 36px;
}

.chart-focus-modal__subtitle-bar ion-title {
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.55);
}

.chart-focus-modal__content {
  --background: #f8f8fa;
}

.chart-focus-modal__hint {
  margin: 10px 16px 0;
  font-size: 11px;
  line-height: 1.35;
  color: rgba(0, 0, 0, 0.45);
  text-align: center;
}

.chart-focus-modal__chart-wrap {
  padding: 8px 10px 24px;
  min-height: calc(100% - 48px);
  box-sizing: border-box;
}

.chart-focus-modal__chart {
  width: 100%;
  height: min(72vh, 640px);
  min-height: 320px;
}
</style>
