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

const TAB_BAR_ROUTES = [
  '/home',
  '/dashboard',
  '/accounts',
  '/analytics',
  '/transactions',
  '/accounting',
  '/profile',
]

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

/* Toolbar text buttons: brand accent (default Ionic blue → app orange) */
ion-toolbar ion-button {
  --color: #ff8d28;
}

/* Dismiss / secondary actions on the leading side */
ion-toolbar ion-buttons[slot='start'] ion-button {
  --color: #6e6a7c;
}
</style>
