# TURN Server Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add TURN server testing with connectivity check and relay data transfer verification.

**Architecture:** Create TURN test utility following existing STUN patterns, restructure server config to separate STUN and TURN servers, display results in separate sections.

**Tech Stack:** React 19, Vite, WebRTC RTCPeerConnection API, DaisyUI

---

## File Structure

| File | Purpose |
|------|---------|
| `src/utils/turn.js` | TURN test logic (connectivity + relay data transfer) |
| `src/hooks/useStunTest.js` | Rename to `useServerTest.js`, handle both STUN and TURN |
| `src/components/ServerList.jsx` | Modify to accept server type prop |
| `src/components/ServerItem.jsx` | Add support for TURN result fields |
| `src/components/Stats.jsx` | Combine STUN and TURN stats |
| `src/App.jsx` | Separate STUN and TURN sections |
| `public/servers.json` | Restructure with stunServers and turnServers arrays |

---

### Task 1: Restructure Server Config

**Files:**
- Modify: `public/servers.json`

- [ ] **Step 1: Update server config structure**

```json
{
  "stunServers": [
    {
      "name": "52doc STUN",
      "url": "stun:52doc.com:3478"
    },
    {
      "name": "小米 STUN",
      "url": "stun:stun.miwifi.com:3478"
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
  ],
  "turnServers": [
    {
      "name": "OpenRelay",
      "url": "turn:openrelay.metered.ca:80",
      "username": "openrelayproject",
      "credential": "openrelayproject"
    },
    {
      "name": "OpenRelay TLS",
      "url": "turns:openrelay.metered.ca:443",
      "username": "openrelayproject",
      "credential": "openrelayproject"
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add public/servers.json
git commit -m "feat: add TURN servers to config, restructure with stunServers and turnServers arrays"
```

---

### Task 2: Create TURN Test Utility

**Files:**
- Create: `src/utils/turn.js`

- [ ] **Step 1: Create TURN test function**

```javascript
/**
 * Test a TURN server for connectivity and relay data transfer
 * @param {string} turnUrl - TURN server URL (e.g., "turn:server.com:3478")
 * @param {string} username - TURN username
 * @param {string} credential - TURN credential/password
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 * @returns {Promise<{success: boolean, latency: number|null, relayIP: string|null, relayPort: number|null, dataTransferSuccess: boolean, error: string|null}>}
 */
export function testTurnServer(turnUrl, username, credential, timeout = 10000) {
  return new Promise((resolve) => {
    const startTime = performance.now()

    const config = {
      iceServers: [{
        urls: turnUrl,
        username: username,
        credential: credential
      }],
      iceTransportPolicy: 'relay' // Force relay only
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
        relayIP: null,
        relayPort: null,
        dataTransferSuccess: false,
        error: '连接超时'
      })
    }, timeout)

    try {
      connection = new RTCPeerConnection(config)

      connection.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate.candidate
          console.log('[TURN] Candidate:', candidate)

          // Look for relay candidate
          if (candidate.includes('relay')) {
            const ipMatch = candidate.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g)
            const portMatch = candidate.match(/ (\d+) typ /)

            if (ipMatch && portMatch) {
              const endTime = performance.now()
              const relayIP = ipMatch[ipMatch.length - 1]
              const relayPort = parseInt(portMatch[1], 10)

              // Now test data transfer through relay
              testDataTransfer(turnUrl, username, credential, relayIP, relayPort)
                .then(dataSuccess => {
                  finish({
                    success: true,
                    latency: Math.round(endTime - startTime),
                    relayIP: relayIP,
                    relayPort: relayPort,
                    dataTransferSuccess: dataSuccess,
                    error: null
                  })
                })
                .catch(() => {
                  finish({
                    success: true,
                    latency: Math.round(endTime - startTime),
                    relayIP: relayIP,
                    relayPort: relayPort,
                    dataTransferSuccess: false,
                    error: null
                  })
                })
            }
          }
        }
      }

      connection.onicegatheringstatechange = () => {
        if (connection.iceGatheringState === 'complete' && !resolved) {
          finish({
            success: false,
            latency: null,
            relayIP: null,
            relayPort: null,
            dataTransferSuccess: false,
            error: '中继分配失败'
          })
        }
      }

      // Create data channel to trigger ICE candidate gathering
      connection.createDataChannel('test')

      connection.createOffer()
        .then(offer => connection.setLocalDescription(offer))
        .catch(err => {
          finish({
            success: false,
            latency: null,
            relayIP: null,
            relayPort: null,
            dataTransferSuccess: false,
            error: err.message || '创建连接失败'
          })
        })

    } catch (err) {
      finish({
        success: false,
        latency: null,
        relayIP: null,
        relayPort: null,
        dataTransferSuccess: false,
        error: err.message || '初始化失败'
      })
    }
  })
}

/**
 * Test data transfer through TURN relay by creating two peer connections
 */
async function testDataTransfer(turnUrl, username, credential, relayIP, relayPort) {
  return new Promise((resolve, reject) => {
    const config = {
      iceServers: [{
        urls: turnUrl,
        username: username,
        credential: credential
      }],
      iceTransportPolicy: 'relay'
    }

    let peer1 = null
    let peer2 = null
    let dataChannel = null
    let timeoutId = null

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (peer1) peer1.close()
      if (peer2) peer2.close()
    }

    timeoutId = setTimeout(() => {
      cleanup()
      reject(new Error('数据传输超时'))
    }, 5000)

    try {
      peer1 = new RTCPeerConnection(config)
      peer2 = new RTCPeerConnection(config)

      // Create data channel on peer1
      dataChannel = peer1.createDataChannel('relay-test')

      let messageReceived = false

      peer2.ondatachannel = (event) => {
        const receiveChannel = event.channel
        receiveChannel.onmessage = () => {
          messageReceived = true
          cleanup()
          resolve(true)
        }
      }

      // ICE connection state change
      peer1.oniceconnectionstatechange = () => {
        if (peer1.iceConnectionState === 'connected' && !messageReceived) {
          // Send test message
          dataChannel.send('relay-test-ping')
        }
      }

      // Exchange SDP
      peer1.createOffer()
        .then(offer => {
          peer1.setLocalDescription(offer)
          return peer2.setRemoteDescription(offer)
        })
        .then(() => peer2.createAnswer())
        .then(answer => {
          peer2.setLocalDescription(answer)
          return peer1.setRemoteDescription(answer)
        })
        .catch(err => {
          cleanup()
          reject(err)
        })

    } catch (err) {
      cleanup()
      reject(err)
    }
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/turn.js
git commit -m "feat: add TURN server test utility with connectivity and relay data transfer"
```

---

### Task 3: Create Combined Server Test Hook

**Files:**
- Create: `src/hooks/useServerTest.js`
- Delete: `src/hooks/useStunTest.js`

- [ ] **Step 1: Create combined hook**

```javascript
import { useState, useCallback, useRef } from 'react'
import { testStunServer } from '../utils/stun'
import { testTurnServer } from '../utils/turn'

/**
 * @typedef {Object} StunTestResult
 * @property {string} name
 * @property {string} url
 * @property {'stun'} type
 * @property {'pending'|'testing'|'success'|'failed'} status
 * @property {number|null} latency
 * @property {string|null} publicIP
 * @property {number|null} publicPort
 * @property {boolean|null} dataTransferSuccess
 * @property {string|null} error
 */

/**
 * @typedef {Object} TurnTestResult
 * @property {string} name
 * @property {string} url
 * @property {'turn'} type
 * @property {'pending'|'testing'|'success'|'failed'} status
 * @property {number|null} latency
 * @property {string|null} relayIP
 * @property {number|null} relayPort
 * @property {boolean|null} dataTransferSuccess
 * @property {string|null} error
 */

/**
 * Custom hook for STUN and TURN server testing
 * @param {Object} servers - Server configuration
 * @param {Array<{name: string, url: string}>} servers.stunServers
 * @param {Array<{name: string, url: string, username: string, credential: string}>} servers.turnServers
 * @returns {{stunResults: StunTestResult[], turnResults: TurnTestResult[], isTesting: boolean, runTests: Function, resetTests: Function}}
 */
export function useServerTest({ stunServers = [], turnServers = [] }) {
  const [stunResults, setStunResults] = useState([])
  const [turnResults, setTurnResults] = useState([])
  const [isTesting, setIsTesting] = useState(false)
  const testingRef = useRef(false)

  const initializeStunResults = useCallback(() => {
    return stunServers.map(server => ({
      name: server.name,
      url: server.url,
      type: 'stun',
      status: 'pending',
      latency: null,
      publicIP: null,
      publicPort: null,
      dataTransferSuccess: null,
      error: null
    }))
  }, [stunServers])

  const initializeTurnResults = useCallback(() => {
    return turnServers.map(server => ({
      name: server.name,
      url: server.url,
      type: 'turn',
      status: 'pending',
      latency: null,
      relayIP: null,
      relayPort: null,
      dataTransferSuccess: null,
      error: null
    }))
  }, [turnServers])

  const runTests = useCallback(async () => {
    if (testingRef.current) return

    testingRef.current = true
    setIsTesting(true)

    // Initialize with testing status
    const stunInitial = stunServers.map(server => ({
      name: server.name,
      url: server.url,
      type: 'stun',
      status: 'testing',
      latency: null,
      publicIP: null,
      publicPort: null,
      dataTransferSuccess: null,
      error: null
    }))
    setStunResults(stunInitial)

    const turnInitial = turnServers.map(server => ({
      name: server.name,
      url: server.url,
      type: 'turn',
      status: 'testing',
      latency: null,
      relayIP: null,
      relayPort: null,
      dataTransferSuccess: null,
      error: null
    }))
    setTurnResults(turnInitial)

    // Run STUN tests
    const stunPromises = stunServers.map(async (server) => {
      const result = await testStunServer(server.url)
      return {
        name: server.name,
        url: server.url,
        type: 'stun',
        status: result.success ? 'success' : 'failed',
        latency: result.latency,
        publicIP: result.publicIP,
        publicPort: result.publicPort,
        dataTransferSuccess: null,
        error: result.error
      }
    })

    // Run TURN tests
    const turnPromises = turnServers.map(async (server) => {
      const result = await testTurnServer(server.url, server.username, server.credential)
      return {
        name: server.name,
        url: server.url,
        type: 'turn',
        status: result.success ? 'success' : 'failed',
        latency: result.latency,
        relayIP: result.relayIP,
        relayPort: result.relayPort,
        dataTransferSuccess: result.dataTransferSuccess,
        error: result.error
      }
    })

    // Wait for all tests in parallel
    const [stunFinal, turnFinal] = await Promise.all([
      Promise.all(stunPromises),
      Promise.all(turnPromises)
    ])

    // Sort by latency (fastest first), with failed servers at the end
    const sortByLatency = (a, b) => {
      if (a.status === 'failed' && b.status !== 'failed') return 1
      if (a.status !== 'failed' && b.status === 'failed') return -1
      if (a.latency === null && b.latency === null) return 0
      if (a.latency === null) return 1
      if (b.latency === null) return -1
      return a.latency - b.latency
    }

    setStunResults(stunFinal.sort(sortByLatency))
    setTurnResults(turnFinal.sort(sortByLatency))
    setIsTesting(false)
    testingRef.current = false
  }, [stunServers, turnServers])

  const resetTests = useCallback(() => {
    testingRef.current = false
    setIsTesting(false)
    setStunResults(initializeStunResults())
    setTurnResults(initializeTurnResults())
  }, [initializeStunResults, initializeTurnResults])

  return { stunResults, turnResults, isTesting, runTests, resetTests }
}
```

- [ ] **Step 2: Delete old hook file**

```bash
rm src/hooks/useStunTest.js
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: combine STUN and TURN testing into useServerTest hook"
```

---

### Task 4: Update ServerItem Component

**Files:**
- Modify: `src/components/ServerItem.jsx`

- [ ] **Step 1: Add support for TURN result fields**

```javascript
export function ServerItem({ result }) {
  const { name, status, latency, publicIP, publicPort, relayIP, relayPort, dataTransferSuccess, error, type } = result

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

  const renderDataTransfer = () => {
    if (type !== 'turn' || status !== 'success') return '-'
    if (dataTransferSuccess === true) {
      return <span className="text-success">✓ 通过</span>
    }
    if (dataTransferSuccess === false) {
      return <span className="text-error">✗ 失败</span>
    }
    return '-'
  }

  // Show IP and Port based on server type
  const displayIP = type === 'turn' ? relayIP : publicIP
  const displayPort = type === 'turn' ? relayPort : publicPort

  return (
    <tr>
      <td className="font-medium">{name}</td>
      <td>{renderStatus()}</td>
      <td>
        {status === 'success' && latency !== null ? `${latency}ms` : '-'}
      </td>
      <td>{status === 'success' ? displayIP || '-' : '-'}</td>
      <td>{status === 'success' && displayPort !== null ? displayPort : '-'}</td>
      {type === 'turn' && (
        <td>{renderDataTransfer()}</td>
      )}
    </tr>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ServerItem.jsx
git commit -m "feat: add TURN-specific fields to ServerItem component"
```

---

### Task 5: Update ServerList Component

**Files:**
- Modify: `src/components/ServerList.jsx`

- [ ] **Step 1: Add server type prop and TURN table headers**

```javascript
import { ServerItem } from './ServerItem'

export function ServerList({ results, type = 'stun' }) {
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
            <th>{type === 'turn' ? '中继 IP' : '公网 IP'}</th>
            <th>端口</th>
            {type === 'turn' && <th>数据传输</th>}
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

- [ ] **Step 2: Commit**

```bash
git add src/components/ServerList.jsx
git commit -m "feat: add server type prop to ServerList for TURN support"
```

---

### Task 6: Update Stats Component

**Files:**
- Modify: `src/components/Stats.jsx`

- [ ] **Step 1: Support combined STUN and TURN stats**

```javascript
export function Stats({ stunResults = [], turnResults = [] }) {
  const allResults = [...stunResults, ...turnResults]

  if (allResults.length === 0) return null

  const successCount = allResults.filter(r => r.status === 'success').length
  const totalCount = allResults.length
  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0

  const successLatencies = allResults
    .filter(r => r.status === 'success' && r.latency !== null)
    .map(r => r.latency)

  const avgLatency = successLatencies.length > 0
    ? Math.round(successLatencies.reduce((a, b) => a + b, 0) / successLatencies.length)
    : null

  const stunSuccess = stunResults.filter(r => r.status === 'success').length
  const turnSuccess = turnResults.filter(r => r.status === 'success').length
  const turnDataTransferSuccess = turnResults.filter(r => r.dataTransferSuccess === true).length

  return (
    <div className="stats stats-horizontal shadow w-full flex-wrap">
      <div className="stat">
        <div className="stat-title">总成功率</div>
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

      {stunResults.length > 0 && (
        <div className="stat">
          <div className="stat-title">STUN 成功</div>
          <div className="stat-value text-accent">
            {stunSuccess}/{stunResults.length}
          </div>
        </div>
      )}

      {turnResults.length > 0 && (
        <div className="stat">
          <div className="stat-title">TURN 成功</div>
          <div className="stat-value text-info">
            {turnSuccess}/{turnResults.length}
          </div>
          {turnSuccess > 0 && (
            <div className="stat-desc">数据传输: {turnDataTransferSuccess}/{turnSuccess}</div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Stats.jsx
git commit -m "feat: update Stats to show combined STUN and TURN statistics"
```

---

### Task 7: Update App Component

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Update to use new hook and separate sections**

```javascript
import { useState, useEffect } from 'react'
import { useServerTest } from './hooks/useServerTest'
import { TestButton } from './components/TestButton'
import { ServerList } from './components/ServerList'
import { Stats } from './components/Stats'

function App() {
  const [stunServers, setStunServers] = useState([])
  const [turnServers, setTurnServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/servers.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load servers config')
        return res.json()
      })
      .then(data => {
        setStunServers(data.stunServers || [])
        setTurnServers(data.turnServers || [])
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const { stunResults, turnResults, isTesting, runTests, resetTests } = useServerTest({ stunServers, turnServers })

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

  const hasResults = stunResults.length > 0 || turnResults.length > 0

  return (
    <div className="min-h-screen bg-base-200 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title text-2xl mb-6">STUN/TURN 服务器测试工具</h1>

            <div className="card-actions mb-6">
              <TestButton
                onClick={runTests}
                isLoading={isTesting}
                disabled={stunServers.length === 0 && turnServers.length === 0}
              />
              {hasResults && !isTesting && (
                <button
                  className="btn btn-outline"
                  onClick={resetTests}
                >
                  重置
                </button>
              )}
            </div>

            {/* STUN Servers Section */}
            {stunServers.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">STUN Servers</h2>
                <ServerList results={stunResults} type="stun" />
              </div>
            )}

            {/* TURN Servers Section */}
            {turnServers.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">TURN Servers</h2>
                <ServerList results={turnResults} type="turn" />
              </div>
            )}

            {/* Combined Stats */}
            {hasResults && !isTesting && (
              <div className="mt-6">
                <Stats stunResults={stunResults} turnResults={turnResults} />
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-6 text-base-content/60 text-sm">
          使用 WebRTC 测试 STUN/TURN 服务器连通性和中继功能
        </div>
      </div>
    </div>
  )
}

export default App
```

- [ ] **Step 2: Commit**

```bash
git add src/App.jsx
git commit -m "feat: update App with separate STUN and TURN sections"
```

---

### Task 8: Final Build Test

- [ ] **Step 1: Run development server to test**

```bash
pnpm run dev
```

Expected: App loads, shows STUN and TURN sections, clicking "开始测试" runs both tests in parallel.

- [ ] **Step 2: Verify in browser**

Open the dev server URL, click "开始测试", verify:
- Both STUN and TURN tests run
- TURN section shows relay IP, port, and data transfer status
- Stats show combined statistics

- [ ] **Step 3: Build for production**

```bash
pnpm run build
```

Expected: Build completes without errors.

- [ ] **Step 4: Final commit if needed**

```bash
git add -A
git commit -m "chore: verify build and final cleanup"
```
