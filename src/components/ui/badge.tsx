import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        danger: 'bg-danger/10 text-danger',
        info: 'bg-accent/10 text-accent',
        neutral: 'bg-muted text-text-secondary',
        outline: 'border border-border text-text-secondary',
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
