<template>
  <ion-app :class="{ 'au-has-tab-bar': showTabBar }">
    <ion-router-outlet />
    <TabBar v-if="showTabBar" />
    <PwaInstallBanner v-if="!showUpdateBanner" />
    <PwaUpdateBanner
      :need-refresh="showUpdateBanner"
      @dismiss="dismissUpdate"
      @update="applyPwaUpdate"
    />
  </ion-app>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import TabBar from '@/components/TabBar.vue'
import PwaInstallBanner from '@/components/PwaInstallBanner.vue'
import PwaUpdateBanner from '@/components/PwaUpdateBanner.vue'
import { usePwaRegister } from '@/composables/usePwaRegister'
import { shouldShowTabBar } from '@/utils/tabBarVisibility'

const route = useRoute()
const { needRefresh, updateServiceWorker } = usePwaRegister()
const updateDismissed = ref(false)

const showTabBar = computed(() => shouldShowTabBar(route))

const showUpdateBanner = computed(() => needRefresh.value && !updateDismissed.value)

watch(needRefresh, (v) => {
  if (v) updateDismissed.value = false
})

async function applyPwaUpdate() {
  await updateServiceWorker(true)
}

function dismissUpdate() {
  updateDismissed.value = true
}
</script>

<style>
:root {
  --au-tab-bar-height: 44px;
  --au-safe-bottom: env(safe-area-inset-bottom, 0px);
  --au-tab-bar-offset: 0px;
}

.au-has-tab-bar {
  --au-tab-bar-offset: var(--au-tab-bar-height);
}

html,
body,
#app {
  height: var(--au-app-height, 100%);
  min-height: var(--au-app-height, 100%);
  -webkit-font-smoothing: antialiased;
}

ion-app {
  height: var(--au-app-height, 100%);
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
