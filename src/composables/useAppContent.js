import { computed } from 'vue'
import { useAppContentStore } from '@/store/appContent'

const TEXT_FALLBACKS = {
  'splash.appName': 'Rupee',
  'splash.tagline': 'Nurturing Today for a Better Tomorrow',
  'splash.logoSize': '130',
  'onboarding.slide1.heading': 'Know Your Balance, Find Your \nBalance',
  'onboarding.slide1.cta': 'Find My Balance !',
  'onboarding.slide2.heading': 'Build wealth,\none entry at a time',
  'onboarding.slide2.cta': 'Build my wealth !',
  'onboarding.slide3.heading': 'Welcome to a world of \nnew possibilities',
  'onboarding.slide3.subheading': 'It all starts Today',
  'onboarding.slide3.cta': "I'm All In !",
  'home.recentActivity.title': 'Recent Activity',
  'home.recentActivity.empty': 'No recent transactions',
  'home.recurring.title': 'Recurring Transactions',
  'home.recurring.empty': 'No recurring transactions.',
  'home.banner.gradient2': 'linear-gradient(135deg, #e7ecf7 0%, #b8cff7 45%, #6a8fce 100%)',
  'home.banner.gradient3': 'linear-gradient(135deg, #d4f5e8 0%, #9ee5c8 50%, #52bf90 100%)'
}

const IMAGE_FALLBACKS = {
  'splash.logo': '/logo.png',
  'splash.artwork': '/splash-artwork.png',
  'onboarding.slide1.image': '/onboarding-1.png',
  'onboarding.slide2.image': '/onboarding-2.png',
  'onboarding.slide3.image': '/onboarding-3.png',
  'home.brandLogo': '/rupee-life-logo.png',
  'home.banner.image': '/home-banner-1.png'
}

const HTML_FALLBACKS = {
  'miscellaneous.termsOfService':
    '<h2>Terms of Service</h2><p>These terms govern your use of this application. By creating an account or using the app, you agree to these terms.</p><p>Contact your administrator if you have questions about your organization\'s policies.</p>',
  'miscellaneous.privacyPolicy':
    '<h2>Privacy Policy</h2><p>We respect your privacy and handle your personal and financial data according to applicable law and your organization\'s policies.</p><p>Data you submit is used to provide app features such as accounts, transactions, and reports.</p>',
}

const EMPTY_HTML_MESSAGE =
  '<p class="legal-empty">Content is not available yet.</p>'

export function useAppContent() {
  const store = useAppContentStore()

  function getText(key, fallback) {
    return store.getField(key, fallback ?? TEXT_FALLBACKS[key] ?? '')
  }

  function getImageRaw(key, fallback) {
    return store.getField(key, fallback ?? IMAGE_FALLBACKS[key] ?? '')
  }

  function getHtml(key, fallback) {
    const raw = store.getField(key, fallback ?? HTML_FALLBACKS[key] ?? '')
    const html = raw != null ? String(raw).trim() : ''
    return html || EMPTY_HTML_MESSAGE
  }

  const contentVersion = computed(() => store.version)

  return {
    store,
    contentVersion,
    getText,
    getImageRaw,
    getHtml,
    TEXT_FALLBACKS,
    IMAGE_FALLBACKS,
    HTML_FALLBACKS,
  }
}
