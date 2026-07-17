export const DEFAULT_BANNER_SLIDES = [
  { type: 'image', value: '/home-banner-1.png' },
  {
    type: 'gradient',
    value: 'linear-gradient(135deg, #e7ecf7 0%, #b8cff7 45%, #6a8fce 100%)'
  },
  {
    type: 'gradient',
    value: 'linear-gradient(135deg, #d4f5e8 0%, #9ee5c8 50%, #52bf90 100%)'
  }
]

export const BANNER_SLIDES_FIELD_KEY = 'home.banner.slides'

export function normalizeBannerSlides(raw) {
  if (!Array.isArray(raw) || !raw.length) return null
  const slides = raw
    .filter((slide) => slide && (slide.type === 'image' || slide.type === 'gradient'))
    .map((slide) => ({
      type: slide.type,
      value: slide.value ?? ''
    }))
    .filter((slide) => slide.value !== '')
  return slides.length ? slides : null
}

export function legacyBannerSlidesFromFields(fields = {}) {
  const slides = []
  const image = fields['home.banner.image']
  if (image != null && image !== '') {
    slides.push({ type: 'image', value: image })
  }
  const gradient2 = fields['home.banner.gradient2']
  if (gradient2) slides.push({ type: 'gradient', value: gradient2 })
  const gradient3 = fields['home.banner.gradient3']
  if (gradient3) slides.push({ type: 'gradient', value: gradient3 })
  return normalizeBannerSlides(slides)
}

export function resolveBannerSlides(fields = {}, defaults = DEFAULT_BANNER_SLIDES) {
  return (
    normalizeBannerSlides(fields[BANNER_SLIDES_FIELD_KEY]) ||
    legacyBannerSlidesFromFields(fields) ||
    defaults
  )
}
