import { useRoute } from 'vue-router'
import { ref, watch } from 'vue'
import adminMenu from './adminMenu'
import sellerMenu from './sellerMenu'
import userMenu from './userMenu'

export default function useVerticalNav() {
  const route = useRoute()
  const menu = ref([])

  function cleanMenu(arr) {
    return Array.isArray(arr)
      ? arr.filter(item => item && typeof item === 'object' && !Array.isArray(item))
      : []
  }

  const updateMenu = (path) => {
    if (path.startsWith('/admin')) menu.value = cleanMenu(adminMenu)
    else if (path.startsWith('/seller')) menu.value = cleanMenu(sellerMenu)
    else menu.value = cleanMenu(userMenu)
  }

  watch(
    () => route?.path,
    (p) => updateMenu(p || ''),
    { immediate: true }
  )

  return menu
}
