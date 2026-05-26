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
