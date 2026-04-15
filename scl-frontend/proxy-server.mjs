import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

const app = express()
const PORT = process.env.PROXY_PORT || 4001
const API_TARGET = process.env.API_TARGET || 'http://localhost:4002'
const VITE_DEV_SERVER = process.env.VITE_DEV_SERVER || 'http://localhost:5173'

// Proxy API requests to the backend
app.use(
  '/api',
  createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxy] ${req.method} ${req.url} -> ${API_TARGET}${req.url}`)
    },
    onError: (err, req, res) => {
      console.error(`[Proxy Error] ${err.message}`)
      res.status(502).json({ error: 'Proxy error', message: err.message })
    },
  })
)

// Proxy all other requests to Vite dev server
app.use(
  '/',
  createProxyMiddleware({
    target: VITE_DEV_SERVER,
    changeOrigin: true,
    ws: true, // Enable WebSocket proxying for HMR
  })
)

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`)
  console.log(`  - API requests proxied to: ${API_TARGET}`)
  console.log(`  - UI requests proxied to: ${VITE_DEV_SERVER}`)
})
