<template>
  <LegalPageShell :title="pageTitle" :back-href="backHref">
    <div v-if="htmlContent" v-html="htmlContent" />
    <p v-else class="legal-empty">Content is not available yet.</p>
  </LegalPageShell>
</template>

<script setup>
import { computed, watch, ref } from 'vue'
import { useRoute } from 'vue-router'
import LegalPageShell from '@/views/legal/LegalPageShell.vue'
import { useAppContent } from '@/composables/useAppContent'

const route = useRoute()
const { getHtml, contentVersion } = useAppContent()

const htmlContent = ref('')

const contentKey = computed(() => route.meta.contentKey || '')
const pageTitle = computed(() => route.meta.title || 'Legal')
const backHref = computed(() => {
  const from = route.query.from
  return typeof from === 'string' && from.startsWith('/') ? from : '/start'
})

function applyContent() {
  const key = contentKey.value
  if (!key) {
    htmlContent.value = ''
    return
  }
  htmlContent.value = getHtml(key)
}

watch([contentKey, contentVersion], applyContent, { immediate: true })
</script>
