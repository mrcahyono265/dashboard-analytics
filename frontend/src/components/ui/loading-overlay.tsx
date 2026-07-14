import { Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'

export function LoadingOverlay() {
  const loading = useStore((s) => s.loading)
  const loadingMessage = useStore((s) => s.loadingMessage)

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-surface-container-high rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-4 min-w-[280px]"
          >
            {/* Animated spinner */}
            <div className="relative">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-primary/20" />
              </div>
            </div>

            {/* Text */}
            <div className="text-center">
              <p className="text-on-surface font-semibold text-lg">
                {loadingMessage || 'Loading Data'}
              </p>
              <p className="text-on-surface-variant text-sm mt-1">
                Please wait...
              </p>
            </div>

            {/* Progress shimmer */}
            <div className="w-full h-1.5 bg-outline-variant/30 rounded-full overflow-hidden mt-2">
              <div className="shimmer-bar h-full rounded-full" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
