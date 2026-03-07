<template>
  <ion-page class="dashboard-page">
    <ion-content :fullscreen="true" :scroll-y="true">
      <div class="dashboard-container">
        <div class="greeting-header">
          <span class="greeting-text">Hi, User 👋</span>
        </div>

        <div class="cards-stack">
          <AccountOverview />
          <ProjectOverview />
          <ProjectProgress />
          <TasksCard />
          <KryptonitesCard />
        </div>
      </div>

      <div class="tab-spacer" />
    </ion-content>

    <FloatingAddButton @select="onFabSelect" />

  </ion-page>
</template>

<script setup>
import { IonPage, IonContent } from '@ionic/vue'
import { useRouter } from 'vue-router'
import AccountOverview from '@/components/dashboard/AccountOverview.vue'
import ProjectOverview from '@/components/dashboard/ProjectOverview.vue'
import ProjectProgress from '@/components/dashboard/ProjectProgress.vue'
import TasksCard from '@/components/dashboard/TasksCard.vue'
import KryptonitesCard from '@/components/dashboard/KryptonitesCard.vue'
import FloatingAddButton from '@/components/dashboard/FloatingAddButton.vue'


const router = useRouter()


function onFabSelect(type) {
  router.push(`/transactions/create?type=${type}`)
}
</script>

<style scoped>
.dashboard-page {
  --background: #F5F5F7;
}

.dashboard-page ion-content {
  --background: #F5F5F7;
}

.dashboard-container {
  padding: 0 20px;
  padding-top: env(safe-area-inset-top, 20px);
}

.greeting-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
}

.greeting-text {
  font-size: 18px;
  font-weight: 700;
  color: #1A1A2E;
}

.cards-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 16px;
}

.tab-spacer {
  height: 80px;
}
</style>
