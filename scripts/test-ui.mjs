import { chromium } from 'playwright'

const BASE = 'http://localhost:5174'

async function testPage(page, path, name) {
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(2000)
    
    // Check for console errors
    const errors = []
    page.on('pageerror', err => errors.push(err.message))
    
    // Take screenshot
    const screenshot = `/tmp/test_${name}.png`
    await page.screenshot({ path: screenshot, fullPage: true })
    
    // Check if page has meaningful content (not just blank)
    const bodyText = await page.textContent('body')
    const hasContent = bodyText && bodyText.length > 50
    
    // Check for React error boundaries
    const hasError = await page.$('.error-boundary, [data-error]')
    
    return { 
      name, path, 
      ok: hasContent && !hasError, 
      contentLength: bodyText?.length || 0,
      errors,
      screenshot 
    }
  } catch (err) {
    return { name, path, ok: false, error: err.message }
  }
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

// Collect console errors
const consoleErrors = []
page.on('console', msg => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})

// Test login page first
console.log('Testing login...')
const loginResult = await testPage(page, '/login', 'login')
console.log(`  /login: ${loginResult.ok ? '✅' : '❌'} (${loginResult.contentLength} chars)`)

// Do login
console.log('Logging in...')
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 15000 })
await page.waitForTimeout(1000)
// Init default user via localStorage (mimicking initDefaultUser)
await page.evaluate(() => {
  const users = [{ username: 'admin', passwordHash: 'h_g10hvh', displayName: 'Administrator', role: 'admin' }]
  localStorage.setItem('prio_dashboard_users', JSON.stringify(users))
})
await page.locator('input[type="text"]').fill('admin')
await page.locator('input[type="password"]').fill('admin123')
await page.locator('button[type="submit"]').click()
await page.waitForTimeout(3000)
console.log(`  Current URL after login: ${page.url()}`)

// Now test all pages
const pages = [
  ['/', 'overview'],
  ['/xlc', 'xlc'],
  ['/gsf', 'gsf'],
  ['/merchant', 'merchant'],
  ['/wo', 'wo'],
  ['/expo', 'expo'],
  ['/xlsatu', 'xlsatu'],
  ['/elite', 'elite'],
  ['/promotor', 'promotor'],
  ['/target', 'target'],
  ['/reporting', 'reporting'],
  ['/monitoring', 'monitoring'],
]

const results = []
for (const [path, name] of pages) {
  const result = await testPage(page, path, name)
  results.push(result)
  const icon = result.ok ? '✅' : '❌'
  console.log(`  ${path}: ${icon} (${result.contentLength || 0} chars)${result.error ? ' ERR: ' + result.error : ''}`)
}

await browser.close()

// Summary
const ok = results.filter(r => r.ok).length
const fail = results.filter(r => !r.ok).length
console.log(`\n=== Summary ===`)
console.log(`Passed: ${ok}/${results.length}`)
console.log(`Failed: ${fail}/${results.length}`)
if (consoleErrors.length > 0) {
  console.log(`Console errors: ${consoleErrors.length}`)
  consoleErrors.slice(0, 5).forEach(e => console.log(`  - ${e.slice(0, 120)}`))
}
