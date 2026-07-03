import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type DivProps = React.HTMLAttributes<HTMLDivElement>

interface CardProps extends DivProps {
  variant?: 'default' | 'interactive' | 'gradient-top'
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    if (variant === 'interactive') {
      return (
        <motion.div
          ref={ref}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'rounded-xl border border-border bg-surface shadow-sm transition-shadow duration-200 hover:shadow-md cursor-pointer',
            className
          )}
          {...(props as any)}
        />
      )
    }
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border border-border bg-surface shadow-sm transition-shadow duration-200',
          variant === 'gradient-top' && 'border-t-2 border-t-primary',
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center justify-between px-6 py-4 border-b border-border', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('font-semibold text-base text-text', className)} {...props} />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-text-secondary', className)} {...props} />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center px-6 py-4 border-t border-border', className)} {...props} />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
