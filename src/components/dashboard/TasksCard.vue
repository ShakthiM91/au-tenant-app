<template>
  <div class="card tasks-card">
    <div class="card-header">
      <span class="card-title">Tasks</span>
      <div class="calendar-strip">
        <div
          v-for="day in calendarDays"
          :key="day.date"
          class="cal-day"
          :class="{ active: day.active }"
        >
          <span class="cal-month">{{ day.month }}</span>
          <span class="cal-date">{{ day.date }}</span>
          <span class="cal-weekday">{{ day.weekday }}</span>
        </div>
      </div>
    </div>

    <div class="filter-tabs">
      <button
        v-for="tab in filterTabs"
        :key="tab"
        class="filter-tab"
        :class="{ active: activeFilter === tab }"
        @click="activeFilter = tab"
      >
        {{ tab }}
      </button>
    </div>

    <div class="tasks-columns">
      <div class="task-column">
        <div v-for="task in leftTasks" :key="task.name" class="task-item">
          <span class="task-name">{{ task.name }}</span>
          <span class="task-project">{{ task.project }}</span>
        </div>
      </div>
      <div class="task-column">
        <div v-for="task in rightTasks" :key="task.name" class="task-item">
          <span class="task-name">{{ task.name }}</span>
          <span class="task-project">{{ task.project }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const filterTabs = ['All', 'In Progress', 'Pending']
const activeFilter = ref('All')

const calendarDays = [
  { month: 'Feb', date: 23, weekday: 'Fri', active: false },
  { month: 'Feb', date: 24, weekday: 'Sat', active: false },
  { month: 'Feb', date: 25, weekday: 'Sun', active: false },
  { month: 'Feb', date: 26, weekday: 'Mon', active: false },
  { month: 'Feb', date: 27, weekday: 'Tue', active: true }
]

const leftTasks = [
  { name: 'Set a budget for each category', project: 'Our Wedding ❤' },
  { name: 'Request Quotes from venue', project: 'Our Wedding ❤' },
  { name: 'Make a sales pitch', project: 'Side Hustle' },
  { name: 'Hire SEO services', project: 'Side Hustle' },
  { name: 'Get in touch with tax Advisor', project: 'Side Hustle' },
  { name: 'Buy toothpaste', project: 'Daily To Dos' }
]

const rightTasks = [
  { name: 'Backing up photos', project: 'Daily To Dos' },
  { name: 'Service the Washing Machine', project: 'Daily To Dos' },
  { name: 'Change engine oil', project: 'Daily To Dos' },
  { name: 'Fix external hard drive', project: 'Daily To Dos' },
  { name: 'Replace the Screen protector', project: 'Daily To Dos' }
]
</script>

<style scoped>
.card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #1A1A2E;
}

.calendar-strip {
  display: flex;
  gap: 6px;
}

.cal-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 30px;
  height: 40px;
  border-radius: 8px;
  background: #F5F5F5;
  padding: 4px 0;
  cursor: pointer;
}

.cal-day.active {
  background: rgba(255, 141, 40, 0.18);
}

.cal-month {
  font-size: 6px;
  color: #6E6A7C;
}

.cal-date {
  font-size: 12px;
  font-weight: 700;
  color: #1A1A2E;
  line-height: 1.2;
}

.cal-weekday {
  font-size: 6px;
  color: #6E6A7C;
}

.filter-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.filter-tab {
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid rgba(168, 168, 168, 0.2);
  background: #fff;
  font-size: 10px;
  color: rgba(0, 0, 0, 0.72);
  cursor: pointer;
}

.filter-tab.active {
  border-color: rgba(255, 141, 40, 0.75);
  color: rgba(0, 0, 0, 0.72);
}

.tasks-columns {
  display: flex;
  gap: 8px;
}

.task-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.task-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.task-name {
  font-size: 10px;
  font-weight: 600;
  color: #1A1A2E;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-project {
  font-size: 8px;
  color: #6E6A7C;
}
</style>
