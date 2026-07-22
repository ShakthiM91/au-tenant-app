<template>
  <ion-page class="legal-page-root">
    <ion-header class="legal-header">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="backHref" text="Back" />
        </ion-buttons>
        <ion-title>{{ title }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="legal-page" :fullscreen="true">
      <div class="legal-page-inner">
        <article class="legal-article">
          <slot />
        </article>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
} from '@ionic/vue'

defineProps({
  title: { type: String, required: true },
  backHref: { type: String, default: '/start' },
})
</script>

<style scoped>
.legal-page-root {
  color-scheme: only light;
  --ion-background-color: #f8f8f8;
  --ion-text-color: #1a1a1a;
  --ion-toolbar-background: #ffffff;
  --ion-toolbar-color: #1a1a1a;
}

.legal-header ion-toolbar {
  --background: #ffffff;
  --color: #1a1a1a;
  --border-color: #e5e7eb;
  --min-height: 56px;
}

.legal-header ion-title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.legal-page {
  --background: #f8f8f8;
}

.legal-page-inner {
  max-width: 640px;
  margin: 0 auto;
  padding: 16px 16px calc(24px + env(safe-area-inset-bottom, 0px));
}

.legal-article {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  padding: 22px 20px 8px;
  border: 1px solid #e5e7eb;
}

.legal-article :deep(h2) {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
  color: #1a1a1a;
  margin: 26px 0 10px;
  padding: 0;
  letter-spacing: -0.01em;
}

.legal-article :deep(h2::before) {
  content: '';
  flex-shrink: 0;
  width: 4px;
  min-height: 1.2em;
  margin-top: 2px;
  border-radius: 4px;
  background: #ff8d28;
}

.legal-article :deep(h2:first-of-type) {
  margin-top: 4px;
}

.legal-article :deep(p) {
  margin: 0 0 14px;
  font-size: 15px;
  line-height: 1.65;
  color: #4b5563;
}

.legal-article :deep(ul) {
  margin: 0 0 16px;
  padding: 0 0 0 4px;
  list-style: none;
}

.legal-article :deep(li) {
  position: relative;
  margin: 0 0 12px;
  padding-left: 22px;
  font-size: 15px;
  line-height: 1.6;
  color: #4b5563;
}

.legal-article :deep(li::before) {
  content: '';
  position: absolute;
  left: 4px;
  top: 0.55em;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ff8d28;
  opacity: 0.85;
}

.legal-article :deep(strong) {
  color: #1a1a1a;
  font-weight: 600;
}

.legal-article :deep(a) {
  color: #c2410c;
  font-weight: 600;
  text-decoration: underline;
  text-decoration-color: rgba(194, 65, 12, 0.35);
  text-underline-offset: 3px;
}

.legal-article :deep(.legal-empty) {
  margin: 0 0 14px;
  font-size: 15px;
  line-height: 1.65;
  color: #6b7280;
  font-style: italic;
}
</style>
