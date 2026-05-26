# TURN Server Testing Design

## Overview

Add TURN server testing capability to the existing STUN testing tool. Tests both connectivity and actual data relay functionality.

## Requirements

- Test TURN server connectivity and credentials
- Verify data can flow through the TURN relay
- Display STUN and TURN results in separate sections
- Support multiple TURN servers with credentials

## Architecture

### New Files

- `src/utils/turn.js` - TURN test logic (connectivity + relay data transfer)

### Modified Files

- `src/App.jsx` - Separate STUN and TURN sections
- `src/hooks/useStunTest.js` - Add `useTurnTest` hook or create separate hook
- `src/components/ServerList.jsx` - Support both server types or create TURN-specific component
- `public/servers.json` - Restructure to include TURN servers with credentials

## Data Structures

### Server Config

```json
{
  "stunServers": [
    { "name": "Google STUN", "url": "stun:stun.l.google.com:19302" }
  ],
  "turnServers": [
    {
      "name": "OpenRelay",
      "url": "turn:openrelay.metered.ca:80",
      "username": "openrelayproject",
      "credential": "openrelayproject"
    },
    {
      "name": "OpenRelay TLS",
      "url": "turns:openrelay.metered.ca:443",
      "username": "openrelayproject",
      "credential": "openrelayproject"
    }
  ]
}
```

### TURN Test Result

```typescript
interface TurnTestResult {
  name: string
  url: string
  success: boolean
  latency: number | null       // Time to get relay candidate
  relayIP: string | null       // Relay server IP
  relayPort: number | null     // Relay server port
  dataTransferSuccess: boolean // Did data transfer through relay work?
  error: string | null
}
```

## TURN Test Logic

### Connectivity Test

1. Create RTCPeerConnection with TURN server credentials
2. Create data channel to trigger ICE gathering
3. Wait for `relay` type ICE candidate
4. Record latency and relay endpoint

### Data Transfer Test

1. Create two RTCPeerConnection instances (peer1, peer2) using same TURN server
2. Peer1 creates offer, peer2 answers
3. Both gather relay candidates through TURN
4. Peer1 creates data channel, peer2 receives it
5. Peer1 sends test message through data channel
6. Peer2 receives message → data transfer success

### Timeout

Default 10000ms for TURN tests (longer than STUN due to relay overhead).

## UI Layout

```
┌─────────────────────────────────────┐
│  STUN 服务器测试工具                 │
├─────────────────────────────────────┤
│  [开始测试] [重置]                   │
├─────────────────────────────────────┤
│  STUN Servers                        │
│  (existing STUN server list)         │
├─────────────────────────────────────┤
│  TURN Servers                        │
│  (TURN server list with relay info)  │
├─────────────────────────────────────┤
│  统计信息                            │
│  (combined stats)                    │
└─────────────────────────────────────┘
```

## Error Messages

| Error Condition | Message |
|-----------------|---------|
| Server unreachable | 连接超时 |
| Invalid credentials | 认证失败 |
| No relay candidate | 中继分配失败 |
| Data transfer failed | 数据传输失败 |

## Implementation Notes

- Use existing patterns from `testStunServer` for TURN connectivity test
- Data transfer test requires careful handling of ICE connection states
- Run STUN and TURN tests in parallel for efficiency
- Consider showing progress indicators during relay test phases
