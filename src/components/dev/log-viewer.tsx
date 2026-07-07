import { useState, useEffect, useCallback } from 'react'
import { logger, type LogEntry, type LogLevel } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Trash2, Download, Bug } from 'lucide-react'

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: 'text-text-tertiary',
  info: 'text-blue-500',
  warn: 'text-amber-500',
  error: 'text-danger',
}

const LEVEL_BG: Record<LogLevel, string> = {
  debug: 'bg-muted',
  info: 'bg-blue-500/10',
  warn: 'bg-amber-500/10',
  error: 'bg-danger/10',
}

export function LogViewer() {
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState<LogLevel | 'all'>('all')
  const [stats, setStats] = useState<Record<LogLevel, number>>({ debug: 0, info: 0, warn: 0, error: 0 })

  const refreshLogs = useCallback(() => {
    setLogs(logger.getLogs(filter === 'all' ? undefined : filter))
    setStats(logger.getStats())
  }, [filter])

  useEffect(() => {
    refreshLogs()
    const unsub = logger.subscribe(() => refreshLogs())
    return unsub
  }, [refreshLogs])

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '`' && e.ctrlKey) {
        e.preventDefault()
        setIsOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  if (!import.meta.env.DEV) return null

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-surface border border-border shadow-lg hover:bg-muted transition-colors"
        title="Log Viewer (Ctrl+`)"
      >
        <Bug className="h-4 w-4 text-text-secondary" />
        {stats.error > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-danger text-[10px] text-white flex items-center justify-center">
            {stats.error}
          </span>
        )}
      </button>

      {/* Log panel */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 z-50 w-[500px] max-h-[60vh] border border-border bg-surface shadow-2xl flex flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-text">Logs</h3>
              <div className="flex gap-1">
                {(['all', 'debug', 'info', 'warn', 'error'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setFilter(level)}
                    className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                      filter === level ? 'bg-primary text-white' : 'text-text-secondary hover:bg-muted'
                    }`}
                  >
                    {level === 'all' ? 'All' : level.toUpperCase()}
                    {level !== 'all' && stats[level] > 0 && ` (${stats[level]})`}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-sm" onClick={exportLogs} title="Export">
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={logger.clear} title="Clear">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => setIsOpen(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-center text-text-tertiary py-8">No logs</p>
            ) : (
              logs.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-start gap-2 px-2 py-1 rounded ${LEVEL_BG[entry.level]}`}
                >
                  <span className="text-text-tertiary shrink-0">{formatTime(entry.timestamp)}</span>
                  <span className={`shrink-0 w-10 text-right font-semibold ${LEVEL_COLORS[entry.level]}`}>
                    {entry.level.toUpperCase()}
                  </span>
                  <span className="text-primary shrink-0">[{entry.category}]</span>
                  <span className="text-text flex-1 break-all">{entry.message}</span>
                  {entry.duration !== undefined && (
                    <span className="text-text-tertiary shrink-0">{entry.duration}ms</span>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="border-t border-border px-4 py-1.5 text-[10px] text-text-tertiary flex justify-between">
            <span>{logs.length} logs</span>
            <span>Ctrl+` to toggle</span>
          </div>
        </div>
      )}
    </>
  )
}
