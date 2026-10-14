import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_URL = 'https://negmcars.com'

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch {
          resolve(null)
        }
      })
    }).on('error', () => resolve(null))
  })
}

async function generateSitemap() {
  console.log('Generating sitemap for NegmCars...')

  const today = new Date().toISOString().split('T')[0]

  // Static core routes
  const staticRoutes = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/user/cars', priority: '0.9', changefreq: 'daily' },
    { url: '/user/best-deals', priority: '0.8', changefreq: 'daily' },
    { url: '/user/negm-sooq', priority: '0.8', changefreq: 'daily' },
    { url: '/user/sellers', priority: '0.8', changefreq: 'weekly' },
    { url: '/user/sell', priority: '0.7', changefreq: 'monthly' },
  ]

  // Fetch cars dynamically from API
  let cars = []
  try {
    const res = await fetchJson('https://api.negmcars.com/api/user/cars?limit=1000')
    if (res && Array.isArray(res.data)) {
      cars = res.data
    }
  } catch (err) {
    console.warn('Could not fetch cars from API, proceeding with static routes:', err.message)
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`

  // Add static routes
  for (const route of staticRoutes) {
    xml += `  <url>\n`
    xml += `    <loc>${BASE_URL}${route.url}</loc>\n`
    xml += `    <lastmod>${today}</lastmod>\n`
    xml += `    <changefreq>${route.changefreq}</changefreq>\n`
    xml += `    <priority>${route.priority}</priority>\n`
    xml += `  </url>\n`
  }

  // Add dynamic car routes
  for (const car of cars) {
    const carId = car.id
    if (!carId) continue
    const lastmod = car.updated_at ? car.updated_at.split(' ')[0] : today

    xml += `  <url>\n`
    xml += `    <loc>${BASE_URL}/user/cars/${carId}</loc>\n`
    xml += `    <lastmod>${lastmod}</lastmod>\n`
    xml += `    <changefreq>weekly</changefreq>\n`
    xml += `    <priority>0.8</priority>\n`
    xml += `  </url>\n`
  }

  xml += `</urlset>\n`

  // Output paths
  const publicDir = path.resolve(__dirname, '../public')
  const distDir = path.resolve(__dirname, '../dist')
  const backendPublicDir = path.resolve(__dirname, '../../car-market/public')

  const sitemapPublic = path.join(publicDir, 'sitemap.xml')
  fs.writeFileSync(sitemapPublic, xml, 'utf8')
  console.log(`Saved: ${sitemapPublic}`)

  if (fs.existsSync(distDir)) {
    const sitemapDist = path.join(distDir, 'sitemap.xml')
    fs.writeFileSync(sitemapDist, xml, 'utf8')
    console.log(`Saved: ${sitemapDist}`)
  }

  if (fs.existsSync(backendPublicDir)) {
    const sitemapBackend = path.join(backendPublicDir, 'sitemap.xml')
    fs.writeFileSync(sitemapBackend, xml, 'utf8')
    console.log(`Saved: ${sitemapBackend}`)
  }

  console.log(`Sitemap generated successfully with ${staticRoutes.length + cars.length} URLs!`)
}

generateSitemap()
