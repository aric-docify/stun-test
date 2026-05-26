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
