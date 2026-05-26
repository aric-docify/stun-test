# STUN Server Test Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web-based STUN server testing tool with React + Vite + Tailwind + DaisyUI, deployable to GitHub Pages.

**Architecture:** Single-page app that loads STUN server config from JSON, uses WebRTC RTCPeerConnection API to test each server in parallel, displays results sorted by latency with DaisyUI components.

**Tech Stack:** React 18, Vite, Tailwind CSS, DaisyUI, WebRTC API

---

## File Structure

```
stun-test/
├── public/
│   └── servers.json        # STUN server configuration
├── src/
│   ├── App.jsx             # Main component, orchestrates state
│   ├── components/
│   │   ├── ServerList.jsx  # Renders table of server results
│   │   ├── ServerItem.jsx  # Single row with status/latency/IP/port
│   │   ├── Stats.jsx       # Success rate and avg latency summary
│   │   └── TestButton.jsx  # "开始测试" button with loading state
│   ├── hooks/
│   │   └── useStunTest.js  # Custom hook managing test state/logic
│   ├── utils/
│   │   └── stun.js         # Core STUN test function using WebRTC
│   ├── main.jsx            # React entry point
│   └── index.css           # Tailwind + DaisyUI imports
├── index.html              # HTML entry with root div
├── vite.config.js          # Vite config with base path
├── tailwind.config.js      # Tailwind + DaisyUI config
├── postcss.config.js       # PostCSS config for Tailwind
└── package.json            # Dependencies and scripts
```

---

## Task 1: Project Scaffolding and Dependencies

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/index.css`
- Create: `.gitignore`

- [ ] **Step 1: Initialize npm project with dependencies**

```bash
npm init -y
npm install react react-dom
npm install -D vite @vitejs/plugin-react tailwindcss postcss autoprefixer daisyui gh-pages
```

- [ ] **Step 2: Create package.json with scripts**

Update `package.json`:

```json
{
  "name": "stun-test",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.18",
    "daisyui": "^4.7.2",
    "gh-pages": "^6.1.1",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "vite": "^5.1.4"
  }
}
```

- [ ] **Step 3: Create Vite config**

Create `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/stun-test/',
})
```

- [ ] **Step 4: Create Tailwind config with DaisyUI**

Create `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
}
```

- [ ] **Step 5: Create PostCSS config**

Create `postcss.config.js`:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: Create index.html**

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>STUN 服务器测试工具</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create main.jsx entry point**

Create `src/main.jsx`:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 8: Create index.css with Tailwind imports**

Create `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 9: Create .gitignore**

Create `.gitignore`:

```
node_modules/
dist/
.DS_Store
*.local
```

- [ ] **Step 10: Commit project scaffolding**

```bash
git add .
git commit -m "chore: scaffold project with Vite + React + Tailwind + DaisyUI

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: STUN Server Configuration

**Files:**
- Create: `public/servers.json`

- [ ] **Step 1: Create servers.json config file**

Create `public/servers.json`:

```json
{
  "servers": [
    {
      "name": "52doc STUN",
      "url": "stun:52doc.com:3478"
    },
    {
      "name": "小米 STUN",
      "url": "stun:stun.miwifi.com:3478"
    },
    {
      "name": "腾讯 STUN",
      "url": "stun:stun.qq.com:3478"
    },
    {
      "name": "Google STUN",
      "url": "stun:stun.l.google.com:19302"
    },
    {
      "name": "Cloudflare STUN",
      "url": "stun:stun.cloudflare.com:3478"
    },
    {
      "name": "Twilio STUN",
      "url": "stun:global.stun.twilio.com:3478"
    }
  ]
}
```

- [ ] **Step 2: Commit servers config**

```bash
git add public/servers.json
git commit -m "feat: add STUN server configuration

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: STUN Test Core Utility

**Files:**
- Create: `src/utils/stun.js`

- [ ] **Step 1: Create STUN test function**

Create `src/utils/stun.js`:

```javascript
/**
 * Test a single STUN server
 * @param {string} stunUrl - STUN server URL (e.g., "stun:stun.l.google.com:19302")
 * @param {number} timeout - Timeout in milliseconds (default: 5000)
 * @returns {Promise<{success: boolean, latency: number|null, publicIP: string|null, publicPort: number|null, error: string|null}>}
 */
export function testStunServer(stunUrl, timeout = 5000) {
  return new Promise((resolve) => {
    const startTime = performance.now()

    const config = {
      iceServers: [{ urls: stunUrl }]
    }

    let connection = null
    let timeoutId = null
    let resolved = false

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      if (connection) {
        connection.close()
        connection = null
      }
    }

    const finish = (result) => {
      if (resolved) return
      resolved = true
      cleanup()
      resolve(result)
    }

    timeoutId = setTimeout(() => {
      finish({
        success: false,
        latency: null,
        publicIP: null,
        publicPort: null,
        error: '超时'
      })
    }, timeout)

    try {
      connection = new RTCPeerConnection(config)

      connection.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate.candidate

          // Parse candidate to extract IP and port
          // Example: "a=candidate:... UDP 2122260223 192.168.1.1 12345 typ host"
          const ipMatch = candidate.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g)
          const portMatch = candidate.match(/ (\d+) typ /)

          if (ipMatch && portMatch) {
            // Look for srflx (server reflex) candidate which has public IP
            if (candidate.includes('srflx')) {
              const endTime = performance.now()
              finish({
                success: true,
                latency: Math.round(endTime - startTime),
                publicIP: ipMatch[ipMatch.length - 1], // Last IP is usually the public one
                publicPort: parseInt(portMatch[1], 10),
                error: null
              })
            }
          }
        }
      }

      connection.onicegatheringstatechange = () => {
        if (connection.iceGatheringState === 'complete' && !resolved) {
          // Gathering complete but no srflx candidate found
          finish({
            success: false,
            latency: null,
            publicIP: null,
            publicPort: null,
            error: '无法获取公网IP'
          })
        }
      }

      // Create data channel to trigger ICE candidate gathering
      connection.createDataChannel('test')

      // Create and set local offer
      connection.createOffer()
        .then(offer => connection.setLocalDescription(offer))
        .catch(err => {
          finish({
            success: false,
            latency: null,
            publicIP: null,
            publicPort: null,
            error: err.message || '创建连接失败'
          })
        })

    } catch (err) {
      finish({
        success: false,
        latency: null,
        publicIP: null,
        publicPort: null,
        error: err.message || '初始化失败'
      })
    }
  })
}
```

- [ ] **Step 2: Commit STUN utility**

```bash
git add src/utils/stun.js
git commit -m "feat: add STUN server test utility using WebRTC

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: Custom Hook for STUN Testing

**Files:**
- Create: `src/hooks/useStunTest.js`

- [ ] **Step 1: Create useStunTest hook**

Create `src/hooks/useStunTest.js`:

```jsx
import { useState, useCallback } from 'react'
import { testStunServer } from '../utils/stun'

/**
 * @typedef {Object} TestResult
 * @property {string} name
 * @property {string} url
 * @property {'pending'|'testing'|'success'|'failed'} status
 * @property {number|null} latency
 * @property {string|null} publicIP
 * @property {number|null} publicPort
 * @property {string|null} error
 */

/**
 * Custom hook for STUN server testing
 * @param {Array<{name: string, url: string}>} servers
 * @returns {{results: TestResult[], isTesting: boolean, runTests: Function, resetTests: Function}}
 */
export function useStunTest(servers) {
  const [results, setResults] = useState([])
  const [isTesting, setIsTesting] = useState(false)

  const initializeResults = useCallback(() => {
    return servers.map(server => ({
      name: server.name,
      url: server.url,
      status: 'pending',
      latency: null,
      publicIP: null,
      publicPort: null,
      error: null
    }))
  }, [servers])

  const runTests = useCallback(async () => {
    if (isTesting) return

    setIsTesting(true)
    const initialResults = initializeResults()

    // Set all to testing status
    const testingResults = initialResults.map(r => ({ ...r, status: 'testing' }))
    setResults(testingResults)

    // Run all tests in parallel
    const testPromises = servers.map(async (server, index) => {
      const result = await testStunServer(server.url)

      return {
        name: server.name,
        url: server.url,
        status: result.success ? 'success' : 'failed',
        latency: result.latency,
        publicIP: result.publicIP,
        publicPort: result.publicPort,
        error: result.error
      }
    })

    const finalResults = await Promise.all(testPromises)

    // Sort by latency (fastest first), with failed servers at the end
    finalResults.sort((a, b) => {
      if (a.status === 'failed' && b.status !== 'failed') return 1
      if (a.status !== 'failed' && b.status === 'failed') return -1
      if (a.latency === null && b.latency === null) return 0
      if (a.latency === null) return 1
      if (b.latency === null) return -1
      return a.latency - b.latency
    })

    setResults(finalResults)
    setIsTesting(false)
  }, [servers, isTesting, initializeResults])

  const resetTests = useCallback(() => {
    setResults(initializeResults())
  }, [initializeResults])

  return { results, isTesting, runTests, resetTests }
}
```

- [ ] **Step 2: Commit useStunTest hook**

```bash
git add src/hooks/useStunTest.js
git commit -m "feat: add useStunTest custom hook

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: UI Components

**Files:**
- Create: `src/components/TestButton.jsx`
- Create: `src/components/ServerItem.jsx`
- Create: `src/components/ServerList.jsx`
- Create: `src/components/Stats.jsx`

- [ ] **Step 1: Create TestButton component**

Create `src/components/TestButton.jsx`:

```jsx
export function TestButton({ onClick, isLoading, disabled }) {
  return (
    <button
      className="btn btn-primary"
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <>
          <span className="loading loading-spinner loading-sm"></span>
          测试中...
        </>
      ) : (
        '开始测试'
      )}
    </button>
  )
}
```

- [ ] **Step 2: Create ServerItem component**

Create `src/components/ServerItem.jsx`:

```jsx
export function ServerItem({ result }) {
  const { name, status, latency, publicIP, publicPort, error } = result

  const renderStatus = () => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-ghost">待测试</span>
      case 'testing':
        return <span className="badge badge-warning animate-pulse">测试中...</span>
      case 'success':
        return <span className="badge badge-success">{latency}ms</span>
      case 'failed':
        return <span className="badge badge-error">{error || '失败'}</span>
      default:
        return null
    }
  }

  return (
    <tr>
      <td className="font-medium">{name}</td>
      <td>{renderStatus()}</td>
      <td>
        {status === 'success' && latency !== null ? `${latency}ms` : '-'}
      </td>
      <td>{status === 'success' ? publicIP || '-' : '-'}</td>
      <td>{status === 'success' && publicPort !== null ? publicPort : '-'}</td>
    </tr>
  )
}
```

- [ ] **Step 3: Create ServerList component**

Create `src/components/ServerList.jsx`:

```jsx
import { ServerItem } from './ServerItem'

export function ServerList({ results }) {
  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-base-content/60">
        点击"开始测试"按钮开始测试
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra w-full">
        <thead>
          <tr>
            <th>服务器名称</th>
            <th>状态</th>
            <th>延迟</th>
            <th>公网 IP</th>
            <th>端口</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => (
            <ServerItem key={result.url + index} result={result} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Create Stats component**

Create `src/components/Stats.jsx`:

```jsx
export function Stats({ results }) {
  if (results.length === 0) return null

  const successCount = results.filter(r => r.status === 'success').length
  const totalCount = results.length
  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0

  const successLatencies = results
    .filter(r => r.status === 'success' && r.latency !== null)
    .map(r => r.latency)

  const avgLatency = successLatencies.length > 0
    ? Math.round(successLatencies.reduce((a, b) => a + b, 0) / successLatencies.length)
    : null

  return (
    <div className="stats stats-horizontal shadow w-full">
      <div className="stat">
        <div className="stat-title">成功率</div>
        <div className="stat-value text-primary">
          {successCount}/{totalCount}
        </div>
        <div className="stat-desc">{successRate}%</div>
      </div>

      <div className="stat">
        <div className="stat-title">平均延迟</div>
        <div className="stat-value text-secondary">
          {avgLatency !== null ? `${avgLatency}ms` : '-'}
        </div>
        <div className="stat-desc">
          {successCount > 0 ? `${successCount} 个服务器响应` : '无响应'}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit UI components**

```bash
git add src/components/
git commit -m "feat: add UI components (TestButton, ServerItem, ServerList, Stats)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: Main App Component

**Files:**
- Create: `src/App.jsx`

- [ ] **Step 1: Create App component**

Create `src/App.jsx`:

```jsx
import { useState, useEffect } from 'react'
import { useStunTest } from './hooks/useStunTest'
import { TestButton } from './components/TestButton'
import { ServerList } from './components/ServerList'
import { Stats } from './components/Stats'

function App() {
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/stun-test/servers.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load servers config')
        return res.json()
      })
      .then(data => {
        setServers(data.servers || [])
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const { results, isTesting, runTests, resetTests } = useStunTest(servers)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="alert alert-error max-w-md">
          <span>加载服务器配置失败: {error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-200 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title text-2xl mb-6">STUN 服务器测试工具</h1>

            <div className="card-actions mb-6">
              <TestButton
                onClick={runTests}
                isLoading={isTesting}
                disabled={servers.length === 0}
              />
              {results.length > 0 && !isTesting && (
                <button
                  className="btn btn-outline"
                  onClick={resetTests}
                >
                  重置
                </button>
              )}
            </div>

            <ServerList results={results} />

            {results.length > 0 && !isTesting && (
              <div className="mt-6">
                <Stats results={results} />
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-6 text-base-content/60 text-sm">
          使用 WebRTC 测试 STUN 服务器连通性
        </div>
      </div>
    </div>
  )
}

export default App
```

- [ ] **Step 2: Commit App component**

```bash
git add src/App.jsx
git commit -m "feat: add main App component

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 7: Build and Verify

**Files:**
- Modify: `package.json` (if needed)

- [ ] **Step 1: Install dependencies and run dev server**

```bash
npm install
npm run dev
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:5173/stun-test/ and verify:
- Page loads without errors
- Servers are displayed
- "开始测试" button is visible
- Clicking button starts tests
- Results show with status badges
- Stats show success rate and avg latency

- [ ] **Step 3: Build for production**

```bash
npm run build
```

Expected: `dist/` folder created with production build

- [ ] **Step 4: Commit any fixes**

If any fixes were needed:

```bash
git add .
git commit -m "fix: resolve build issues

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 8: Deploy to GitHub Pages

**Files:**
- None (uses gh-pages package)

- [ ] **Step 1: Deploy to GitHub Pages**

```bash
npm run deploy
```

Expected: Creates `gh-pages` branch and pushes to remote

- [ ] **Step 2: Verify deployment**

Wait 1-2 minutes, then visit:
`https://<username>.github.io/stun-test/`

Verify the app works correctly on GitHub Pages.

- [ ] **Step 3: Final commit with deployment info**

```bash
git add .
git commit -m "docs: add deployment info

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```
