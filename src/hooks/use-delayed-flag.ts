import { useEffect, useState } from 'react'

// true only once the flag has stayed on past the delay, so quick loads never flash a spinner
export function useDelayedFlag(active: boolean, delayMs: number): boolean {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!active) {
      setVisible(false)
      return
    }

    const timer = setTimeout(() => setVisible(true), delayMs)

    return () => clearTimeout(timer)
  }, [active, delayMs])

  return visible
}
