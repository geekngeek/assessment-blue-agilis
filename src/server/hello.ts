import { createServerFn } from '@tanstack/react-start'

// smoke-test server function; proves the RPC boundary works before any database exists
export const getHello = createServerFn({ method: 'GET' }).handler(async () => {
  return {
    message: 'Hello from the server',
    runtime: `Node ${process.version}`,
    at: new Date().toISOString(),
  }
})
