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
            'rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/50 cursor-pointer',
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
          'rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm transition-shadow duration-200',
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
    <div ref={ref} className={cn('flex items-center justify-between px-6 py-4 border-b border-outline-variant', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('font-headline font-bold text-lg text-on-surface', className)} {...props} />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-xs text-on-surface-variant', className)} {...props} />
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
    <div ref={ref} className={cn('flex items-center px-6 py-4 border-t border-outline-variant', className)} {...props} />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
