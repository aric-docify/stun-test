import { useState, useCallback, useRef } from 'react'
import { testStunServer } from '../utils/stun'
import { testTurnServer } from '../utils/turn'

/**
 * @typedef {Object} StunTestResult
 * @property {string} name
 * @property {string} url
 * @property {'stun'} type
 * @property {'pending'|'testing'|'success'|'failed'} status
 * @property {number|null} latency
 * @property {string|null} publicIP
 * @property {number|null} publicPort
 * @property {boolean|null} dataTransferSuccess
 * @property {string|null} error
 */

/**
 * @typedef {Object} TurnTestResult
 * @property {string} name
 * @property {string} url
 * @property {'turn'} type
 * @property {'pending'|'testing'|'success'|'failed'} status
 * @property {number|null} latency
 * @property {string|null} relayIP
 * @property {number|null} relayPort
 * @property {boolean|null} dataTransferSuccess
 * @property {string|null} error
 */

/**
 * Custom hook for STUN and TURN server testing
 * @param {Object} servers - Server configuration
 * @param {Array<{name: string, url: string}>} servers.stunServers
 * @param {Array<{name: string, url: string, username: string, credential: string}>} servers.turnServers
 * @returns {{stunResults: StunTestResult[], turnResults: TurnTestResult[], isTesting: boolean, runTests: Function, resetTests: Function}}
 */
export function useServerTest({ stunServers = [], turnServers = [] }) {
  const [stunResults, setStunResults] = useState([])
  const [turnResults, setTurnResults] = useState([])
  const [isTesting, setIsTesting] = useState(false)
  const testingRef = useRef(false)

  const initializeStunResults = useCallback(() => {
    return stunServers.map(server => ({
      name: server.name,
      url: server.url,
      type: 'stun',
      status: 'pending',
      latency: null,
      publicIP: null,
      publicPort: null,
      dataTransferSuccess: null,
      error: null
    }))
  }, [stunServers])

  const initializeTurnResults = useCallback(() => {
    return turnServers.map(server => ({
      name: server.name,
      url: server.url,
      type: 'turn',
      status: 'pending',
      latency: null,
      relayIP: null,
      relayPort: null,
      dataTransferSuccess: null,
      error: null
    }))
  }, [turnServers])

  const runTests = useCallback(async () => {
    if (testingRef.current) return

    testingRef.current = true
    setIsTesting(true)

    // Initialize with testing status
    const stunInitial = stunServers.map(server => ({
      name: server.name,
      url: server.url,
      type: 'stun',
      status: 'testing',
      latency: null,
      publicIP: null,
      publicPort: null,
      dataTransferSuccess: null,
      error: null
    }))
    setStunResults(stunInitial)

    const turnInitial = turnServers.map(server => ({
      name: server.name,
      url: server.url,
      type: 'turn',
      status: 'testing',
      latency: null,
      relayIP: null,
      relayPort: null,
      dataTransferSuccess: null,
      error: null
    }))
    setTurnResults(turnInitial)

    // Run STUN tests
    const stunPromises = stunServers.map(async (server) => {
      const result = await testStunServer(server.url)
      return {
        name: server.name,
        url: server.url,
        type: 'stun',
        status: result.success ? 'success' : 'failed',
        latency: result.latency,
        publicIP: result.publicIP,
        publicPort: result.publicPort,
        dataTransferSuccess: null,
        error: result.error
      }
    })

    // Run TURN tests
    const turnPromises = turnServers.map(async (server) => {
      const result = await testTurnServer(server.url, server.username, server.credential)
      return {
        name: server.name,
        url: server.url,
        type: 'turn',
        status: result.success ? 'success' : 'failed',
        latency: result.latency,
        relayIP: result.relayIP,
        relayPort: result.relayPort,
        dataTransferSuccess: result.dataTransferSuccess,
        error: result.error
      }
    })

    // Wait for all tests in parallel
    const [stunFinal, turnFinal] = await Promise.all([
      Promise.all(stunPromises),
      Promise.all(turnPromises)
    ])

    // Sort by latency (fastest first), with failed servers at the end
    const sortByLatency = (a, b) => {
      if (a.status === 'failed' && b.status !== 'failed') return 1
      if (a.status !== 'failed' && b.status === 'failed') return -1
      if (a.latency === null && b.latency === null) return 0
      if (a.latency === null) return 1
      if (b.latency === null) return -1
      return a.latency - b.latency
    }

    setStunResults(stunFinal.sort(sortByLatency))
    setTurnResults(turnFinal.sort(sortByLatency))
    setIsTesting(false)
    testingRef.current = false
  }, [stunServers, turnServers])

  const resetTests = useCallback(() => {
    testingRef.current = false
    setIsTesting(false)
    setStunResults(initializeStunResults())
    setTurnResults(initializeTurnResults())
  }, [initializeStunResults, initializeTurnResults])

  return { stunResults, turnResults, isTesting, runTests, resetTests }
}
