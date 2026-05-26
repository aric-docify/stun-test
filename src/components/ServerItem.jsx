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
