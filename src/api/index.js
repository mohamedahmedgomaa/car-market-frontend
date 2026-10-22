import axios from "axios"

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
  const url = config.url || ""

  // 1) Override per request: skip auth header on guest login/register or explicit skipAuth
  if (config.skipAuth === true || shouldSkipAuth(url)) {
    delete config.headers.Authorization
    return config
  }

  // 2) تحديد التوكن حسب المسار
  let token = null
  if (url.startsWith("/admin/")) token = localStorage.getItem("admin_token")
  else if (url.startsWith("/seller/")) token = localStorage.getItem("seller_token")
  else token = localStorage.getItem("user_token") || localStorage.getItem("seller_token") // default user / seller

  // 3) إرسال التوكن إذا وُجد
  // 3) إرسال التوكن إذا وُجد
  if (token) config.headers.Authorization = `Bearer ${token}`
  else delete config.headers.Authorization

  return config
})

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || ""

      // If it's a login or register endpoint, do NOT redirect — let UI show the validation/credential error
      if (isLoginOrRegister(url)) {
        return Promise.reject(error)
      }

      // Determine which auth type failed and redirect accordingly
      if (url.startsWith("/admin/")) {
        const token = localStorage.getItem("admin_token")
        if (token && token.startsWith("mock_")) {
          return Promise.reject(error)
        }
        localStorage.removeItem("admin_token")
        localStorage.removeItem("admin_data")
        window.location.href = "/admin/login"
      } else if (url.startsWith("/seller/")) {
        localStorage.removeItem("seller_token")
        localStorage.removeItem("seller_data")
        window.location.href = "/seller/login"
      } else {
        localStorage.removeItem("user_token")
        localStorage.removeItem("user_data")
      }
    }
    return Promise.reject(error)
  }
)

export default api
