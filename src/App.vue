<template>
  <ion-app>
    <ion-router-outlet />
    <TabBar v-if="showTabBar" />
  </ion-app>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import TabBar from '@/components/TabBar.vue'

const route = useRoute()

const TAB_BAR_ROUTES = ['/dashboard', '/accounts', '/transactions', '/accounting', '/profile']

const showTabBar = computed(() =>
  TAB_BAR_ROUTES.some(r => route.path.startsWith(r)) &&
  !route.path.startsWith('/transactions/create') &&
  !/^\/transactions\/\d+$/.test(route.path)
)
</script>

<style>
html, body, #app {
  height: 100%;
  -webkit-font-smoothing: antialiased;
}
</style>
