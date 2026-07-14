import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary-container/10 text-primary border border-primary/20',
        success: 'bg-secondary-container/10 text-secondary border border-secondary/20',
        warning: 'bg-tertiary-container/10 text-tertiary border border-tertiary/20',
        danger: 'bg-error-container/10 text-error border border-error/20',
        info: 'bg-secondary-container/10 text-secondary border border-secondary/20',
        neutral: 'bg-surface-container-high text-on-surface-variant border border-outline-variant',
        outline: 'border border-outline-variant text-on-surface-variant',
      },
      dot: {
        true: 'before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-current',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, dot, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, dot }), className)} {...props} />
}

export { Badge, badgeVariants }
