import axios from "axios"
import { trackApiStart, trackApiEnd } from "../composables/useApiProgress.js"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.negmcars.com/api',
  withCredentials: false,
  headers: { Accept: "application/json" },
})

// Endpoints that should NOT send an Authorization header (login / register / password reset)
const SKIP_AUTH_ENDPOINTS = [
  "/user/auth/login",
  "/user/auth/register",
  "/seller/auth/login",
  "/seller/auth/register",
  "/admin/auth/login",
  "/admin/auth/register",
  "/forgot-password",
  "/reset-password",
]

const shouldSkipAuth = (url = "") => {
  return SKIP_AUTH_ENDPOINTS.some((ep) => url === ep || url.startsWith(ep + "?") || url.startsWith(ep + "/"))
}

const isLoginOrRegister = (url = "") => {
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url === "/login" ||
    url === "/register"
  )
}

api.interceptors.request.use((config) => {
  trackApiStart()
  const url = config.url || ""

  // 1) Override per request: skip auth header on guest login/register or explicit skipAuth
  if (config.skipAuth === true || shouldSkipAuth(url)) {
    delete config.headers.Authorization
    return config
  }

  // 2) تحديد التوكن حسب المسار المعزول لكل دور (Admin / Seller / User)
  let token = null
  if (url.startsWith("/admin/")) {
    token = localStorage.getItem("admin_token")
  } else if (url.startsWith("/seller/")) {
    token = localStorage.getItem("seller_token")
  } else {
    token = localStorage.getItem("user_token") || localStorage.getItem("seller_token")
  }

  // 3) إرسال التوكن إذا وُجد وتجاهل أي توكن وهمي mock
  if (token && !token.startsWith("mock_")) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    delete config.headers.Authorization
  }

  return config
})

api.interceptors.response.use(
  (response) => {
    trackApiEnd()
    return response
  },
  (error) => {
    trackApiEnd()
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || ""

      // If it's a login or register endpoint, do NOT redirect — let UI show the validation/credential error
      if (isLoginOrRegister(url)) {
        return Promise.reject(error)
      }

      // Determine which auth type failed and clean ONLY its own state
      const currentPath = typeof window !== "undefined" ? window.location.pathname : ""

      if (url.startsWith("/admin/")) {
        localStorage.removeItem("admin_token")
        localStorage.removeItem("admin_data")
        if (currentPath.startsWith("/admin") && currentPath !== "/admin/login") {
          window.location.href = "/admin/login"
        }
        return Promise.reject(error)
      } else if (url.startsWith("/seller/")) {
        localStorage.removeItem("seller_token")
        localStorage.removeItem("seller_data")
        if (currentPath.startsWith("/seller") && currentPath !== "/seller/login") {
          window.location.href = "/seller/login"
        }
        return Promise.reject(error)
      } else {
        localStorage.removeItem("user_token")
        localStorage.removeItem("user_data")
        if (currentPath.startsWith("/user") && currentPath !== "/login") {
          window.location.href = "/login"
        }
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export default api
