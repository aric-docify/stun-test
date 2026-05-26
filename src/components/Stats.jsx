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
