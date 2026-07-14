import { createI18n } from 'vue-i18n'
import { cookieRef } from '@layouts/stores/config'

// Define default languages and their translation messages
const messages = {
  en: {
    settings: 'Settings',
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    cars: 'Cars',
    bestDeals: 'Best Deals',
    importCars: 'Import Cars',
    bikes: 'Bikes',
    sell: 'Sell',
    favorites: 'Favorites',
    showrooms: 'Showrooms',
    login: 'Login',
    profile: 'Profile',
    logout: 'Logout',
    searchPlaceholder: 'Search for cars...',
  },
  ar: {
    settings: 'الإعدادات',
    language: 'اللغة',
    theme: 'المظهر',
    light: 'مضيء',
    dark: 'داكن',
    system: 'تلقائي',
    cars: 'سيارات',
    bestDeals: 'أفضل الصفقات',
    importCars: 'سيارات مستوردة',
    bikes: 'دراجات نارية',
    sell: 'بيع سيارتك',
    favorites: 'المفضلة',
    showrooms: 'المعارض',
    login: 'تسجيل الدخول',
    profile: 'الملف الشخصي',
    logout: 'تسجيل الخروج',
    searchPlaceholder: 'ابحث عن سيارات...',
  }
}

export default function (app) {
  const cookieLanguage = cookieRef('language', 'ar') // Default to Arabic (ar) as specified by the screenshot
  const i18n = createI18n({
    legacy: false,
    locale: cookieLanguage.value || 'ar',
    fallbackLocale: 'ar',
    messages,
  })

  app.use(i18n)
}
