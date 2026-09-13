const STORAGE_KEY = 'negm_banner_links_map'

export const getSavedBannerLinks = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    return {}
  }
}

export const getBannerLink = (bannerId, defaultLink = '') => {
  if (defaultLink && defaultLink !== '#' && defaultLink.trim() !== '') {
    return defaultLink
  }
  const links = getSavedBannerLinks()
  return links[bannerId] || defaultLink || ''
}

export const setBannerLink = (bannerId, linkUrl) => {
  try {
    const links = getSavedBannerLinks()
    links[bannerId] = linkUrl || ''
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
  } catch (e) {
    console.error('Error saving banner link:', e)
  }
}
