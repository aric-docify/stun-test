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
