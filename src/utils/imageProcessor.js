/**
 * Image processing utilities for car photos and uploads.
 * Handles HEIC/HEIF conversions (from iPhone/iOS/Safari) and compresses large images.
 */

/**
 * Check if a file is in HEIC or HEIF format.
 * @param {File} file
 * @returns {boolean}
 */
export const isHeicFile = (file) => {
  if (!file) return false
  const name = (file.name || '').toLowerCase()
  const type = (file.type || '').toLowerCase()
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    type === 'image/heic' ||
    type === 'image/heif'
  )
}

/**
 * Sanitize filename to ensure converted HEIC files have .jpg extension.
 * @param {string} originalName
 * @returns {string}
 */
export const sanitizeImageFileName = (originalName) => {
  if (!originalName) return `car_image_${Date.now()}.jpg`
  if (/\.(heic|heif)$/i.test(originalName)) {
    return originalName.replace(/\.(heic|heif)$/i, '.jpg')
  }
  return originalName
}

/**
 * Process a single image file:
 * - Automatically converts HEIC/HEIF files to high-quality standard JPEG.
 * - Compresses images larger than 1.5MB to max 1920x1080 JPEG at 85% quality.
 * - Safely returns original file if browser canvas cannot decode (e.g. non-Safari browser with HEIC),
 *   allowing backend Cloudinary conversion to take over.
 *
 * @param {File} file
 * @returns {Promise<File>}
 */
export const processCarImage = async (file) => {
  if (!file) return file

  const isHeic = isHeicFile(file)
  const isLarge = file.size > 1024 * 1024 * 1.5 // > 1.5MB

  // If not HEIC and already small enough, no conversion needed
  if (!isHeic && !isLarge) {
    return file
  }

  return new Promise((resolve) => {
    // 7-second safety timeout so upload never hangs indefinitely
    const timeoutId = setTimeout(() => {
      console.warn('Image processing timed out, using original file:', file.name)
      resolve(file)
    }, 7000)

    const finish = (resultFile) => {
      clearTimeout(timeoutId)
      resolve(resultFile)
    }

    let objectUrl = ''
    try {
      objectUrl = URL.createObjectURL(file)
    } catch (e) {
      finish(file)
      return
    }

    const img = new Image()

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        let width = img.naturalWidth || img.width
        let height = img.naturalHeight || img.height

        const MAX_WIDTH = 1920
        const MAX_HEIGHT = 1080

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width)
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height)
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl)
            if (!blob) {
              finish(file)
              return
            }

            const newFileName = sanitizeImageFileName(file.name)
            const convertedFile = new File([blob], newFileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })

            finish(convertedFile)
          },
          'image/jpeg',
          0.85
        )
      } catch (err) {
        console.error('Canvas processing error:', err)
        URL.revokeObjectURL(objectUrl)
        finish(file)
      }
    }

    img.onerror = (err) => {
      console.warn('Browser could not decode image in canvas, falling back to original file:', err)
      URL.revokeObjectURL(objectUrl)
      finish(file)
    }

    img.src = objectUrl
  })
}

/**
 * Process a list of car image files (up to maxCount)
 * @param {FileList|File[]} files
 * @param {number} maxCount
 * @returns {Promise<File[]>}
 */
export const processCarImages = async (files, maxCount = 20) => {
  if (!files || !files.length) return []
  const filesArray = Array.from(files).slice(0, maxCount)
  const processed = []

  for (const file of filesArray) {
    const pFile = await processCarImage(file)
    processed.push(pFile)
  }

  return processed
}
