const STORAGE_KEY = 'negm_video_banners_v1'
const DB_NAME = 'NegmCarsVideoDB'
const STORE_NAME = 'video_blobs'

// 1. IndexedDB Helper for Storing Large Video Files (MP4/WebM Blobs)
const getDB = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null)
      return
    }
    const req = window.indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve(null)
  })
}

export const saveVideoBlob = async (id, fileOrBlob) => {
  try {
    const db = await getDB()
    if (!db) return false
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        // Convert File to clean Blob for Safari compatibility
        const safeBlob = (typeof File !== 'undefined' && fileOrBlob instanceof File)
          ? new Blob([fileOrBlob], { type: fileOrBlob.type || 'video/mp4' })
          : fileOrBlob
        const req = store.put({ id, blob: safeBlob, timestamp: Date.now() })
        req.onsuccess = () => resolve(true)
        req.onerror = () => resolve(false)
        tx.oncomplete = () => resolve(true)
        tx.onerror = () => resolve(false)
      } catch (innerErr) {
        console.warn('IndexedDB store.put error:', innerErr)
        resolve(false)
      }
    })
  } catch (err) {
    console.warn('saveVideoBlob error:', err)
    return false
  }
}

export const getVideoBlob = async (id) => {
  try {
    const db = await getDB()
    if (!db) return null
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(id)
      req.onsuccess = () => resolve(req.result?.blob || null)
      req.onerror = () => resolve(null)
    })
  } catch (err) {
    console.error('getVideoBlob error:', err)
    return null
  }
}

export const deleteVideoBlob = async (id) => {
  try {
    const db = await getDB()
    if (!db) return
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
  } catch (err) {
    console.error('deleteVideoBlob error:', err)
  }
}

// 2. LocalStorage Helpers for Metadata & URLs (YouTube & Remote Videos)
export const getStoredVideoBanners = () => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

export const saveStoredVideoBanners = (banners) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(banners))
    window.dispatchEvent(new CustomEvent('negm_video_banner_updated'))
  } catch (e) {
    console.error('saveStoredVideoBanners error:', e)
  }
}

export const addVideoBanner = async ({ videoUrl, link, file }) => {
  const id = `vid_${Date.now()}`
  let imagePath = videoUrl || ''

  if (file && file instanceof File) {
    await saveVideoBlob(id, file)
    // We mark it with blob reference prefix
    imagePath = `blob_ref:${id}`
  }

  const newBanner = {
    id,
    type: 'video',
    image_path: imagePath,
    link: link ? link.trim() : '',
    is_active: true,
    created_at: new Date().toISOString(),
  }

  const existing = getStoredVideoBanners()
  // By default, set other video banners inactive if we want only one active at a time
  const updated = [newBanner, ...existing.map((b) => ({ ...b, is_active: false }))]
  saveStoredVideoBanners(updated)
  return newBanner
}

export const updateVideoBannerItem = (id, updates) => {
  const existing = getStoredVideoBanners()
  const updated = existing.map((b) => {
    if (b.id === id) {
      return { ...b, ...updates }
    }
    // If activating this banner, deactivate others
    if (updates.is_active === true) {
      return { ...b, is_active: false }
    }
    return b
  })
  saveStoredVideoBanners(updated)
}

export const removeVideoBanner = async (id) => {
  await deleteVideoBlob(id)
  const existing = getStoredVideoBanners()
  const updated = existing.filter((b) => b.id !== id)
  saveStoredVideoBanners(updated)
}

export const resolveVideoSource = async (imagePath) => {
  if (!imagePath) return ''
  if (imagePath.startsWith('blob_ref:')) {
    const blobId = imagePath.replace('blob_ref:', '')
    const blob = await getVideoBlob(blobId)
    if (blob) {
      return URL.createObjectURL(blob)
    }
    return ''
  }
  return imagePath
}

export const getActiveVideoBanner = () => {
  const banners = getStoredVideoBanners()
  return banners.find((b) => b.is_active) || null
}
