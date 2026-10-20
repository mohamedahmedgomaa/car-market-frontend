import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.negmcars.com/api',
  withCredentials: false,
  headers: { Accept: "application/json" },
})

// هنا هتكتب ال endpoints اللي عايزها Public (بدون توكن)
// تقدر تزود/تعدل في أي وقت
const AUTH_RULES = {
  // Matchers: string prefix, RegExp, or function(url)=>boolean
  public: [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/auth",
    "/user/auth/login",
    "/user/auth/register",
    "/seller/auth/login",
    "/seller/auth/register",
    "/admin/auth/login",
    "/admin/auth/register",
    /\/auth\//,
  ],
}

const matches = (url, rule) => {
  if (typeof rule === "string") return url === rule || url.startsWith(rule + "/") || url.startsWith(rule)
  if (rule instanceof RegExp) return rule.test(url)
  if (typeof rule === "function") return !!rule(url)
  return false
}

const isPublic = (url = "") => AUTH_RULES.public.some((r) => matches(url, r))

const isAuthEndpoint = (url = "") => {
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/login") ||
    url.includes("/register")
  )
}

api.interceptors.request.use((config) => {
  const url = config.url || ""

  // 1) Override per request: skip auth header on public or explicit skip
  if (config.skipAuth === true || isPublic(url) || isAuthEndpoint(url)) {
    delete config.headers.Authorization
    return config
  }

  // 2) تحديد التوكن حسب المسار
  let token = null
  if (url.startsWith("/admin/")) token = localStorage.getItem("admin_token")
  else if (url.startsWith("/seller/")) token = localStorage.getItem("seller_token")
  else token = localStorage.getItem("user_token") // default user

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
      if (isAuthEndpoint(url)) {
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
