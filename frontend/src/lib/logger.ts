export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  id: string
  timestamp: number
  level: LogLevel
  category: string
  message: string
  data?: Record<string, any>
  duration?: number
}

const MAX_LOGS = 500
const logs: LogEntry[] = []
let logListeners: ((entry: LogEntry) => void)[] = []

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function addLog(level: LogLevel, category: string, message: string, data?: Record<string, any>, duration?: number): void {
  const entry: LogEntry = {
    id: generateId(),
    timestamp: Date.now(),
    level,
    category,
    message,
    data,
    duration,
  }

  logs.push(entry)
  if (logs.length > MAX_LOGS) logs.shift()

  logListeners.forEach((fn) => fn(entry))

  // Console output in dev
  if (import.meta.env.DEV) {
    const style = level === 'error' ? 'color: red' : level === 'warn' ? 'color: orange' : level === 'info' ? 'color: blue' : 'color: gray'
    console.log(`%c[${level.toUpperCase()}] [${category}] ${message}`, style, data ?? '')
  }
}

export const logger = {
  debug: (category: string, message: string, data?: Record<string, any>) =>
    addLog('debug', category, message, data),
  info: (category: string, message: string, data?: Record<string, any>) =>
    addLog('info', category, message, data),
  warn: (category: string, message: string, data?: Record<string, any>) =>
    addLog('warn', category, message, data),
  error: (category: string, message: string, data?: Record<string, any>) =>
    addLog('error', category, message, data),

  // Performance timing
  startTimer: (category: string, label: string): ((success?: boolean) => number) => {
    const start = performance.now()
    return (success?: boolean) => {
      const duration = Math.round(performance.now() - start)
      if (success === false) {
        addLog('error', category, `${label} failed`, undefined, duration)
      } else {
        addLog('debug', category, `${label} completed`, undefined, duration)
      }
      return duration
    }
  },

  // Get all logs
  getLogs: (level?: LogLevel, category?: string): LogEntry[] => {
    let result = logs
    if (level) result = result.filter((l) => l.level === level)
    if (category) result = result.filter((l) => l.category === category)
    return [...result]
  },

  // Clear logs
  clear: () => {
    logs.length = 0
    logListeners.forEach((fn) => fn({ id: '', timestamp: Date.now(), level: 'info', category: 'system', message: 'Logs cleared' }))
  },

  // Subscribe to new logs
  subscribe: (fn: (entry: LogEntry) => void): (() => void) => {
    logListeners.push(fn)
    return () => {
      logListeners = logListeners.filter((f) => f !== fn)
    }
  },

  // Get stats
  getStats: (): Record<LogLevel, number> => {
    const stats: Record<LogLevel, number> = { debug: 0, info: 0, warn: 0, error: 0 }
    logs.forEach((l) => stats[l.level]++)
    return stats
  },
}
