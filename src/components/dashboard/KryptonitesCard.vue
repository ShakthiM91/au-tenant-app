<template>
  <div class="card kryptonites-card">
    <div class="card-header">
      <span class="card-title">My Kryptonites 💉</span>
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

    <div class="kryp-rows">
      <div v-for="item in kryptonites" :key="item.name" class="kryp-row">
        <div class="kryp-left">
          <span class="kryp-name">{{ item.name }}</span>
          <span class="kryp-entries">{{ item.entries }} Entries</span>
        </div>

        <div class="kryp-stats">
          <div class="kryp-stat">
            <span class="kryp-stat-label">Average</span>
            <span class="kryp-stat-value">{{ item.average }}</span>
          </div>
          <div class="kryp-stat">
            <span class="kryp-stat-label">Projected</span>
            <span class="kryp-stat-value">{{ item.projected }}</span>
          </div>
          <div class="kryp-stat">
            <span class="kryp-stat-label">This Year</span>
            <span class="kryp-stat-value">{{ item.thisYear }}</span>
          </div>
        </div>

        <div class="kryp-right">
          <div class="kryp-month-info">
            <span class="kryp-month-label">This month</span>
            <span class="kryp-month-value">{{ item.thisMonth }}</span>
          </div>
          <div class="progress-circle">
            <svg viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="none" stroke="#E7ECF7" stroke-width="3"/>
              <circle
                cx="16" cy="16" r="14"
                fill="none"
                stroke="#6A8FCE"
                stroke-width="3"
                stroke-linecap="round"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="circumference - (circumference * item.pct) / 100"
                transform="rotate(-90 16 16)"
              />
            </svg>
            <span class="pct-text">{{ item.pct }}%</span>
          </div>
        </div>

        <div class="progress-bar-row">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" :style="{ width: item.barPct + '%', background: item.barColor }" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const circumference = 2 * Math.PI * 14

const filterTabs = ['All', 'In Progress', 'Pending']
const activeFilter = ref('All')

const calendarDays = [
  { month: 'Feb', date: 23, weekday: 'Fri', active: false },
  { month: 'Feb', date: 24, weekday: 'Sat', active: false },
  { month: 'Feb', date: 25, weekday: 'Sun', active: false },
  { month: 'Feb', date: 26, weekday: 'Mon', active: false },
  { month: 'Feb', date: 27, weekday: 'Tue', active: true }
]

const kryptonites = [
  {
    name: 'Snacks',
    entries: 15,
    average: '866',
    projected: '1500',
    thisYear: '5900',
    thisMonth: '1,126 / 700',
    pct: 70,
    barPct: 100,
    barColor: 'rgba(117, 0, 10, 0.74)'
  },
  {
    name: 'Smoking',
    entries: 1,
    average: '9140',
    projected: '300',
    thisYear: '36,000',
    thisMonth: '150 / 3000',
    pct: 70,
    barPct: 5,
    barColor: '#52BF90'
  },
  {
    name: 'Eating Out',
    entries: 8,
    average: '21,450',
    projected: '15,683',
    thisYear: '95,000',
    thisMonth: '17,150 / 20,000',
    pct: 70,
    barPct: 86,
    barColor: 'rgba(195, 0, 16, 0.74)'
  }
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

.kryp-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.kryp-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.kryp-left {
  display: flex;
  flex-direction: column;
  min-width: 40px;
}

.kryp-name {
  font-size: 10px;
  font-weight: 600;
  color: #1A1A2E;
}

.kryp-entries {
  font-size: 7px;
  color: #6E6A7C;
}

.kryp-stats {
  display: flex;
  gap: 12px;
  flex: 1;
  justify-content: center;
}

.kryp-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.kryp-stat-label {
  font-size: 7px;
  color: #6E6A7C;
}

.kryp-stat-value {
  font-size: 10px;
  font-weight: 600;
  color: #1A1A2E;
}

.kryp-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.kryp-month-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.kryp-month-label {
  font-size: 7px;
  color: #6E6A7C;
}

.kryp-month-value {
  font-size: 8px;
  font-weight: 600;
  color: #A8A8A8;
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

.progress-bar-row {
  width: 100%;
}

.progress-bar-bg {
  width: 100%;
  height: 6px;
  background: #DDDDDD;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}
</style>
