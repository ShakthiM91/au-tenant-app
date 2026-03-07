import {
  homeOutline,
  walletOutline,
  peopleOutline,
  cubeOutline,
  calendarOutline,
  briefcaseOutline,
  settingsOutline,
  listOutline,
  documentOutline,
  keyOutline,
  timeOutline,
  cashOutline,
  folderOutline
} from 'ionicons/icons'

/**
 * Map Element Plus / menu API icon names to ionicons.
 */
const ICON_MAP = {
  Odometer: homeOutline,
  Dashboard: homeOutline,
  Money: cashOutline,
  Currency: cashOutline,
  User: peopleOutline,
  Coin: walletOutline,
  Accounting: walletOutline,
  Box: cubeOutline,
  Asset: cubeOutline,
  Calendar: calendarOutline,
  Scheduling: calendarOutline,
  Briefcase: briefcaseOutline,
  Work: briefcaseOutline,
  Setting: settingsOutline,
  Settings: settingsOutline,
  List: listOutline,
  Document: documentOutline,
  Key: keyOutline,
  Collection: folderOutline,
  Clock: timeOutline
}

/**
 * Get ionicon for menu icon name from API.
 * @param {string} iconName - Icon name from menu (e.g. 'Coin', 'Box')
 * @returns {import('ionicons/icons').IonIcon} ionicon component
 */
export function getMenuIcon(iconName) {
  if (!iconName) return listOutline
  const key = String(iconName).trim()
  return ICON_MAP[key] ?? listOutline
}
