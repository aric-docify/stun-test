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
