import { useSyncExternalStore } from 'react'

export function useMediaQuery(query: string): boolean {
  const mql = window.matchMedia(query)
  return useSyncExternalStore(
    (callback) => {
      mql.addEventListener('change', callback)
      return () => mql.removeEventListener('change', callback)
    },
    () => mql.matches,
    () => false,
  )
}
