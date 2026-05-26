import { useState, useCallback, useRef } from 'react'
import { testStunServer } from '../utils/stun'

/**
 * @typedef {Object} TestResult
 * @property {string} name
 * @property {string} url
 * @property {'pending'|'testing'|'success'|'failed'} status
 * @property {number|null} latency
 * @property {string|null} publicIP
 * @property {number|null} publicPort
 * @property {string|null} error
 */

/**
 * Custom hook for STUN server testing
 * @param {Array<{name: string, url: string}>} servers
 * @returns {{results: TestResult[], isTesting: boolean, runTests: Function, resetTests: Function}}
 */
export function useStunTest(servers) {
  const [results, setResults] = useState([])
  const [isTesting, setIsTesting] = useState(false)
  const testingRef = useRef(false)

  const initializeResults = useCallback(() => {
    return servers.map(server => ({
      name: server.name,
      url: server.url,
      status: 'pending',
      latency: null,
      publicIP: null,
      publicPort: null,
      error: null
    }))
  }, [servers])

  const runTests = useCallback(async () => {
    if (testingRef.current) return

    testingRef.current = true
    setIsTesting(true)
    const initialResults = initializeResults()

    // Set all to testing status
    const testingResults = initialResults.map(r => ({ ...r, status: 'testing' }))
    setResults(testingResults)

    // Run all tests in parallel
    const testPromises = servers.map(async (server) => {
      const result = await testStunServer(server.url)

      return {
        name: server.name,
        url: server.url,
        status: result.success ? 'success' : 'failed',
        latency: result.latency,
        publicIP: result.publicIP,
        publicPort: result.publicPort,
        error: result.error
      }
    })

    const finalResults = await Promise.all(testPromises)

    // Sort by latency (fastest first), with failed servers at the end
    finalResults.sort((a, b) => {
      if (a.status === 'failed' && b.status !== 'failed') return 1
      if (a.status !== 'failed' && b.status === 'failed') return -1
      if (a.latency === null && b.latency === null) return 0
      if (a.latency === null) return 1
      if (b.latency === null) return -1
      return a.latency - b.latency
    })

    setResults(finalResults)
    setIsTesting(false)
    testingRef.current = false
  }, [servers, initializeResults])

  const resetTests = useCallback(() => {
    testingRef.current = false
    setIsTesting(false)
    setResults(initializeResults())
  }, [initializeResults])

  return { results, isTesting, runTests, resetTests }
}
