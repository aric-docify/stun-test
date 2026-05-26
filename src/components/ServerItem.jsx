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
