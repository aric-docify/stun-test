import { useState, useEffect } from 'react'
import { useServerTest } from './hooks/useServerTest'
import { TestButton } from './components/TestButton'
import { ServerList } from './components/ServerList'
import { Stats } from './components/Stats'

const P2PF_API = 'https://www.p2pf.cn/api/turn-credential?uid=xu3gy&scene=send_file'

function App() {
  const [stunServers, setStunServers] = useState([])
  const [turnServers, setTurnServers] = useState([])
  const [dynamicTurnServers, setDynamicTurnServers] = useState([])
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

  const allTurnServers = [...turnServers, ...dynamicTurnServers]
  const { stunResults, turnResults, isTesting, runTests, resetTests } = useServerTest({ stunServers, turnServers: allTurnServers })

  const fetchDynamicTurn = async () => {
    try {
      const res = await fetch(P2PF_API, {
        headers: {
          'company-source': 'apply7',
          'referer': 'https://www.p2pf.cn/'
        }
      })
      const data = await res.json()
      if (data.urls && data.username && data.password) {
        const servers = data.urls.map(url => ({
          name: `P2PF (${url.split(':')[1]})`,
          url: url,
          username: data.username,
          credential: data.password,
          ttl: data.ttl_seconds
        }))
        setDynamicTurnServers(servers)
      }
    } catch (err) {
      console.error('Failed to fetch TURN credentials:', err)
    }
  }

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
                disabled={stunServers.length === 0 && allTurnServers.length === 0}
              />
              {hasResults && !isTesting && (
                <button
                  className="btn btn-outline"
                  onClick={resetTests}
                >
                  重置
                </button>
              )}
              <button
                className="btn btn-secondary"
                onClick={fetchDynamicTurn}
                disabled={isTesting}
              >
                获取动态 TURN 凭证
              </button>
            </div>

            {/* STUN Servers Section */}
            {stunServers.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">STUN Servers</h2>
                <ServerList results={stunResults} type="stun" />
              </div>
            )}

            {/* TURN Servers Section */}
            {allTurnServers.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">TURN Servers ({dynamicTurnServers.length > 0 && '含动态凭证'})</h2>
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
