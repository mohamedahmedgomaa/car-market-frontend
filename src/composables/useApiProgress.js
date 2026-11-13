import { ref } from 'vue'

export const activeApiRequests = ref(0)
export const isApiLoading = ref(false)

let hideTimeout = null

export function trackApiStart() {
  if (hideTimeout) clearTimeout(hideTimeout)
  activeApiRequests.value++
  isApiLoading.value = true
}

export function trackApiEnd() {
  activeApiRequests.value = Math.max(0, activeApiRequests.value - 1)
  if (activeApiRequests.value === 0) {
    if (hideTimeout) clearTimeout(hideTimeout)
    hideTimeout = setTimeout(() => {
      if (activeApiRequests.value === 0) {
        isApiLoading.value = false
      }
    }, 180)
  }
}

