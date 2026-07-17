import { computed } from 'vue'
import { useAppContentStore } from '@/store/appContent'

const TEXT_FALLBACKS = {
  'splash.appName': 'Rupee',
  'splash.tagline': 'Nurturing Today for a Better Tomorrow',
  'onboarding.slide1.heading': 'Know Your Balance, Find Your \nBalance',
  'onboarding.slide1.cta': 'Find My Balance !',
  'onboarding.slide2.heading': 'Build wealth,\none entry at a time',
  'onboarding.slide2.cta': 'Build my wealth !',
  'onboarding.slide3.heading': 'Welcome to a world of \nnew possibilities',
  'onboarding.slide3.subheading': 'It all starts Today',
  'onboarding.slide3.cta': "I'm All In !"
}

const IMAGE_FALLBACKS = {
  'splash.logo': '/logo.png',
  'splash.artwork': '/splash-artwork.png',
  'onboarding.slide1.image': '/onboarding-1.png',
  'onboarding.slide2.image': '/onboarding-2.png',
  'onboarding.slide3.image': '/onboarding-3.png'
}

export function useAppContent() {
  const store = useAppContentStore()

  function getText(key, fallback) {
    return store.getField(key, fallback ?? TEXT_FALLBACKS[key] ?? '')
  }

  function getImageRaw(key, fallback) {
    return store.getField(key, fallback ?? IMAGE_FALLBACKS[key] ?? '')
  }

  const contentVersion = computed(() => store.version)

  return {
    store,
    contentVersion,
    getText,
    getImageRaw,
    TEXT_FALLBACKS,
    IMAGE_FALLBACKS
  }
}
