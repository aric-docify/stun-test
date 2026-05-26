---
name: STUN Server Test Tool
description: A web-based tool to test STUN server connectivity, latency, and success rate
type: project
created: 2026-05-26
---

# STUN Server Test Tool - Design Spec

## Overview

A single-page web application deployed to GitHub Pages for testing public STUN servers. Users can test connectivity, measure latency, and view success statistics for multiple STUN servers simultaneously.

## Goals

- Test STUN server connectivity and latency
- Display results sorted by latency (fastest first)
- Simple deployment to GitHub Pages
- Easy maintenance via JSON configuration file

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + DaisyUI
- **Deployment**: GitHub Pages (gh-pages branch)
- **Core API**: WebRTC (RTCPeerConnection)

## Project Structure

```
stun-test/
├── public/
│   └── servers.json        # STUN server configuration
├── src/
│   ├── App.jsx             # Main component
│   ├── components/
│   │   ├── ServerList.jsx  # Server list table
│   │   ├── ServerItem.jsx  # Single server row
│   │   ├── Stats.jsx       # Summary statistics
│   │   └── TestButton.jsx  # Test trigger button
│   ├── hooks/
│   │   └── useStunTest.js  # STUN test logic hook
│   ├── utils/
│   │   └── stun.js         # WebRTC STUN test core
│   ├── main.jsx
│   └── index.css           # Tailwind imports
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## Data Structures

### Server Configuration (servers.json)

```json
{
  "servers": [
    {
      "name": "小米 STUN",
      "url": "stun:stun.miwifi.com:3478"
    },
    {
      "name": "腾讯 STUN",
      "url": "stun:stun.qq.com:3478"
    },
    {
      "name": "Google STUN",
      "url": "stun:stun.l.google.com:19302"
    }
  ]
}
```

### Test Result Object

```typescript
interface TestResult {
  name: string;           // Server display name
  url: string;            // STUN server URL
  status: 'pending' | 'testing' | 'success' | 'failed';
  latency: number | null; // Response time in milliseconds
  publicIP: string | null;
  publicPort: number | null;
  error: string | null;
  startTime: number;      // Test start timestamp
  endTime: number;        // Test end timestamp
}
```

## UI Design

### Layout

```
┌─────────────────────────────────────────────────────┐
│  STUN 服务器测试工具                                  │
│  ┌─────────────┐                                    │
│  │ 开始测试    │                                    │
│  └─────────────┘                                    │
├─────────────────────────────────────────────────────┤
│  服务器名称    │ 状态    │ 延迟    │ 公网 IP        │ 端口  │
│  ─────────────────────────────────────────────────  │
│  小米 STUN     │ ✓ 成功  │ 45ms   │ 1.2.3.4       │ 5678 │
│  腾讯 STUN     │ ✓ 成功  │ 52ms   │ 1.2.3.4       │ 5678 │
│  Google STUN   │ ✗ 失败  │ -      │ -             │ -    │
├─────────────────────────────────────────────────────┤
│  成功率: 2/3 (67%)  │  平均延迟: 48ms               │
└─────────────────────────────────────────────────────┘
```

### Status Indicators

| Status   | Color  | Display          |
|----------|--------|------------------|
| pending  | gray   | 待测试           |
| testing  | blue   | 测试中...        |
| success  | green  | ✓ + latency      |
| failed   | red    | ✗ + error msg    |

### DaisyUI Components

- Container: Card with `card bg-base-100 shadow-xl`
- Button: `btn btn-primary`
- Table: `table` with DaisyUI table styles
- Status badges: `badge badge-success` / `badge badge-error` / `badge badge-warning`
- Stats: `stats` component for summary

### Tailwind + DaisyUI Classes

- Container: `max-w-4xl mx-auto p-6`
- Card: `card bg-base-100 shadow-xl`
- Header: `text-2xl font-bold mb-6 card-title`
- Button: `btn btn-primary`
- Status success: `badge badge-success`
- Status failed: `badge badge-error`
- Status testing: `badge badge-warning animate-pulse`
- Stats: `stats stats-horizontal shadow`

## Core Logic

### STUN Test Flow

1. Create `RTCPeerConnection` with STUN server as ICE server
2. Create a data channel to trigger ICE candidate gathering
3. Start timer
4. Listen for `icecandidate` event
5. Parse candidate to extract public IP and port
6. Stop timer and calculate latency
7. Close connection

### Error Handling

- **Timeout**: 5 seconds per server
- **Network errors**: Catch and display specific error
- **No candidate**: Mark as failed with "No response" message

### Parallel Testing

All servers tested simultaneously using `Promise.all()` for faster results.

## Deployment

### Build Command

```bash
npm run build
```

### GitHub Pages Deployment

Using `gh-pages` package:

```json
// package.json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

### Vite Config for GitHub Pages

```javascript
// vite.config.js
export default defineConfig({
  base: '/stun-test/',  // Repository name
  build: {
    outDir: 'dist'
  }
})
```

## Success Criteria

- [ ] Load server list from JSON config
- [ ] Test all servers with one click
- [ ] Display connectivity status for each server
- [ ] Show latency in milliseconds
- [ ] Show public IP and port when successful
- [ ] Sort results by latency (fastest first)
- [ ] Display success rate and average latency summary
- [ ] Deploy successfully to GitHub Pages
