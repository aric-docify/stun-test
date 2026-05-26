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
