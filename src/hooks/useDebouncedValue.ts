import { useEffect, useState } from 'react'

export const useDebouncedValue = <T>(value: T, ms = 350) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}
