import { ref } from 'vue'

const isGlobalLoading = ref(false)
const globalLoadingText = ref('جاري تحميل الصفحة...')
const globalLoadingSubtitle = ref('NegmCars • قيادة نحو أفضل الصفقات')
let hideTimeout = null

export function useGlobalLoader() {
  const showLoader = (text = 'جاري تحميل الصفحة...', subtitle = 'لحظات ونكون جاهزين بأحدث العروض') => {
    if (hideTimeout) clearTimeout(hideTimeout)
    globalLoadingText.value = text
    globalLoadingSubtitle.value = subtitle
    isGlobalLoading.value = true
  }

  const hideLoader = (delay = 250) => {
    if (hideTimeout) clearTimeout(hideTimeout)
    hideTimeout = setTimeout(() => {
      isGlobalLoading.value = false
    }, delay)
  }

  return {
    isGlobalLoading,
    globalLoadingText,
    globalLoadingSubtitle,
    showLoader,
    hideLoader,
  }
}

