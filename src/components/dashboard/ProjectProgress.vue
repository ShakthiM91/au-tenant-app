<template>
  <div class="card project-progress">
    <span class="card-title">Overall Project Progress</span>

    <div class="columns">
      <div class="column">
        <span class="col-heading">My Projects</span>
        <div class="project-list">
          <div v-for="p in myProjects" :key="p.name" class="project-row">
            <div class="project-info">
              <span class="project-name">{{ p.name }}</span>
              <span class="project-tasks">{{ p.tasks }}</span>
            </div>
            <div class="progress-circle">
              <svg viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="14" fill="none" :stroke="p.bgColor" stroke-width="3"/>
                <circle
                  cx="16" cy="16" r="14"
                  fill="none"
                  :stroke="p.strokeColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  :stroke-dasharray="circumference"
                  :stroke-dashoffset="circumference - (circumference * p.pct) / 100"
                  transform="rotate(-90 16 16)"
                />
              </svg>
              <span class="pct-text">{{ p.pct }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="column">
        <span class="col-heading">Shared Projects</span>
        <div class="project-list">
          <div v-for="p in sharedProjects" :key="p.name" class="project-row">
            <div class="project-info">
              <span class="project-name">{{ p.name }}</span>
              <span class="project-tasks">{{ p.tasks }}</span>
            </div>
            <div class="progress-circle">
              <svg viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="14" fill="none" :stroke="p.bgColor" stroke-width="3"/>
                <circle
                  cx="16" cy="16" r="14"
                  fill="none"
                  :stroke="p.strokeColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  :stroke-dasharray="circumference"
                  :stroke-dashoffset="circumference - (circumference * p.pct) / 100"
                  transform="rotate(-90 16 16)"
                />
              </svg>
              <span class="pct-text">{{ p.pct }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const circumference = 2 * Math.PI * 14

const myProjects = [
  { name: 'Daily To Dos', tasks: '2 Tasks', pct: 70, strokeColor: '#6A8FCE', bgColor: '#E7ECF7' },
  { name: 'Chores', tasks: '8 Tasks', pct: 86, strokeColor: '#475B74', bgColor: 'rgba(224, 225, 220, 0.36)' },
  { name: 'Morning Routine', tasks: 'All Done', pct: 100, strokeColor: '#028174', bgColor: 'rgba(146, 222, 139, 0.36)' }
]

const sharedProjects = [
  { name: 'Our Wedding ❤', tasks: '98 Tasks', pct: 39, strokeColor: '#6A8FCE', bgColor: '#E7ECF7' },
  { name: 'Our House 🏠', tasks: '316 Tasks', pct: 18, strokeColor: '#475B74', bgColor: 'rgba(224, 225, 220, 0.36)' },
  { name: 'Side Hustle', tasks: '16 Tasks', pct: 54, strokeColor: '#028174', bgColor: 'rgba(146, 222, 139, 0.36)' }
]
</script>

<style scoped>
.card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.card-title {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #1A1A2E;
  margin-bottom: 12px;
}

.columns {
  display: flex;
  gap: 8px;
}

.column {
  flex: 1;
  min-width: 0;
}

.col-heading {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #1A1A2E;
  margin-bottom: 8px;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.project-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
}

.project-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.project-name {
  font-size: 10px;
  font-weight: 600;
  color: #1A1A2E;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-tasks {
  font-size: 8px;
  color: #6E6A7C;
}

.progress-circle {
  position: relative;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.progress-circle svg {
  width: 32px;
  height: 32px;
}

.pct-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 7px;
  font-weight: 700;
  color: #1A1A2E;
}
</style>
