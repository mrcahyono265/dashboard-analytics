import { useEffect, useRef } from 'react'
import { logger } from '@/lib/logger'

export function useRenderTracking(componentName: string) {
  const renderCount = useRef(0)
  const prevProps = useRef<Record<string, any> | null>(null)

  useEffect(() => {
    renderCount.current++
    if (import.meta.env.DEV) {
      logger.debug('render', `${componentName} rendered`, { renderCount: renderCount.current })
    }
  })

  return {
    renderCount: renderCount.current,
  }
}

export function useDataTracking(source: string, dataLength: number) {
  const prevLength = useRef(dataLength)
  const loadTime = useRef<number>(0)

  useEffect(() => {
    if (dataLength !== prevLength.current) {
      logger.info('data', `${source} data changed`, {
        previous: prevLength.current,
        current: dataLength,
        delta: dataLength - prevLength.current,
      })
      prevLength.current = dataLength
    }
  }, [source, dataLength])

  const startLoad = () => {
    loadTime.current = performance.now()
    logger.debug('data', `Loading ${source}...`)
  }

  const endLoad = (success: boolean) => {
    const duration = Math.round(performance.now() - loadTime.current)
    if (success) {
      logger.info('data', `${source} loaded`, { duration, records: dataLength })
    } else {
      logger.error('data', `${source} load failed`, { duration })
    }
  }

  return { startLoad, endLoad }
}

export function useFilterTracking() {
  const filterChangeCount = useRef(0)

  const trackFilter = (filterKey: string, value: any[]) => {
    filterChangeCount.current++
    logger.info('filter', `Filter changed: ${filterKey}`, {
      value: value.length > 0 ? value : '(cleared)',
      totalChanges: filterChangeCount.current,
    })
  }

  return { trackFilter }
}

export function useChartRenderTracking(chartType: string, dataLength: number) {
  const renderStart = useRef(0)

  useEffect(() => {
    renderStart.current = performance.now()
  }, [dataLength])

  useEffect(() => {
    if (renderStart.current > 0) {
      const duration = Math.round(performance.now() - renderStart.current)
      if (duration > 100) {
        logger.warn('chart', `${chartType} slow render`, { duration, dataLength })
      }
    }
  })
}
