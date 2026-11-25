import { storeToRefs } from 'pinia'
import { useTheme } from 'vuetify'
import { cookieRef, useLayoutConfigStore } from '@layouts/stores/config'
import { themeConfig } from '@themeConfig'

// SECTION Store
export const useConfigStore = defineStore('config', () => {
  // 👉 Theme
  const userPreferredColorScheme = usePreferredColorScheme()
  const cookieColorScheme = cookieRef('color-scheme', 'light')

  watch(userPreferredColorScheme, val => {
    if (val !== 'no-preference')
      cookieColorScheme.value = val
  }, { immediate: true })

  const theme = cookieRef('theme', themeConfig.app.theme)

  // 👉 isVerticalNavSemiDark
  const isVerticalNavSemiDark = cookieRef('isVerticalNavSemiDark', themeConfig.verticalNav.isVerticalNavSemiDark)

  // 👉 isVerticalNavSemiDark
  const skin = cookieRef('skin', themeConfig.app.skin)

  // ℹ️ We need to use `storeToRefs` to forward the state
  const { isLessThanOverlayNavBreakpoint, appContentWidth, navbarType, isNavbarBlurEnabled, appContentLayoutNav, isVerticalNavCollapsed, footerType, isAppRTL } = storeToRefs(useLayoutConfigStore())
  
  return {
    theme,
    isVerticalNavSemiDark,
    skin,

    // @layouts exports
    isLessThanOverlayNavBreakpoint,
    appContentWidth,
    navbarType,
    isNavbarBlurEnabled,
    appContentLayoutNav,
    isVerticalNavCollapsed,
    footerType,
    isAppRTL,
  }
})
// !SECTION
// SECTION Init
export const initConfigStore = () => {
  const userPreferredColorScheme = usePreferredColorScheme()
  const vuetifyTheme = useTheme()
  const configStore = useConfigStore()

  const applyTheme = () => {
    let resolved = configStore.theme === 'system'
      ? (userPreferredColorScheme.value === 'dark' ? 'emberDark' : 'amberLight')
      : configStore.theme

    if (resolved === 'light') {
      resolved = 'amberLight'
      configStore.theme = 'amberLight'
    } else if (resolved === 'dark') {
      resolved = 'emberDark'
      configStore.theme = 'emberDark'
    }

    vuetifyTheme.global.name.value = resolved

    // Keep base .v-theme--dark / .v-theme--light selectors working for custom brand variants
    const root = document.documentElement
    root.classList.remove('v-theme--dark', 'v-theme--light')
    if (resolved === 'emberDark') {
      root.classList.add('v-theme--dark')
    } else if (resolved === 'amberLight') {
      root.classList.add('v-theme--light')
    }
  }

  watch([() => configStore.theme, userPreferredColorScheme], applyTheme, { immediate: true })
  onMounted(applyTheme)
}
// !SECTION
