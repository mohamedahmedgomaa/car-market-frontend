import { useTheme } from 'vuetify'
import { useConfigStore } from '@core/stores/config'

// composable function to return the image variant as per the current theme and skin
export const useGenerateImageVariant = (imgLight, imgDark, imgLightBordered, imgDarkBordered, bordered = false) => {
  const configStore = useConfigStore()
  const { global } = useTheme()
  
  return computed(() => {
    const isDark = Boolean(global.current.value?.dark)
    if (!isDark) {
      if (configStore.skin === 'bordered' && bordered)
        return imgLightBordered
      else
        return imgLight
    }
    else {
      if (configStore.skin === 'bordered' && bordered)
        return imgDarkBordered
      else
        return imgDark
    }
  })
}
