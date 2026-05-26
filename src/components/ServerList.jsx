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
