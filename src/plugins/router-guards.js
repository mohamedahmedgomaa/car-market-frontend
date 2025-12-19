import { setupGuards } from '@/router/guards'

export default function (app) {
  const router = app.config.globalProperties.$router

  if (router) setupGuards(router)
  else console.error('⚠️ Router not found in app instance.')
}
