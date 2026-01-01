import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: false,
  headers: { Accept: "application/json" },
})

// هنا هتكتب ال endpoints اللي عايزها Public (بدون توكن)
// تقدر تزود/تعدل في أي وقت
const AUTH_RULES = {
  // Matchers: يا إما string prefix أو RegExp أو function(url)=>boolean
  public: [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/auth", // لو عندك /auth/*
    // "/products",
    // "/categories",
    // "/brands",
    // "/home",
    // /^\/public\/.*/,

    // مثال function لو عندك logic:
    // (url) => url.startsWith("/posts") && url.includes("featured"),
  ],
}

const matches = (url, rule) => {
  if (typeof rule === "string") return url === rule || url.startsWith(rule + "/") || url.startsWith(rule)
  if (rule instanceof RegExp) return rule.test(url)
  if (typeof rule === "function") return !!rule(url)
  return false
}

const isPublic = (url = "") => AUTH_RULES.public.some((r) => matches(url, r))

api.interceptors.request.use((config) => {
  const url = config.url || ""

  // 1) Override per request: لو عايز تجبر skip
  if (config.skipAuth === true || isPublic(url)) {
    delete config.headers.Authorization
    return config
  }

  // 2) تحديد التوكن حسب المسار
  let token = null
  if (url.startsWith("/admin/")) token = localStorage.getItem("admin_token")
  else if (url.startsWith("/seller/")) token = localStorage.getItem("seller_token")
  else token = localStorage.getItem("user_token") // default user

  // 3) أهم نقطة: لو مفيش توكن، متعملش error ولا توقف الطلب
  // بس ابعت request عادي بدون Authorization
  if (token) config.headers.Authorization = `Bearer ${token}`
  else delete config.headers.Authorization

  return config
})

export default api
