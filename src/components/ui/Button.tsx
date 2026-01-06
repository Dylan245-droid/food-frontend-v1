import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, isLoading, variant = 'primary', size = 'md', children, style, ...props }, ref) => {
  // Base styles for each variant - using CSS variables for themeable colors
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          className: 'text-white focus:ring-2',
          style: { 
            background: 'var(--primary-gradient)',
            '--tw-ring-color': 'var(--primary-400)'
          } as React.CSSProperties
        };
      case 'secondary':
        return {
          className: 'text-white focus:ring-2',
          style: { 
            background: 'var(--secondary-gradient)',
            '--tw-ring-color': 'var(--secondary-400)'
          } as React.CSSProperties
        };
      case 'gradient':
        return {
          className: 'text-white focus:ring-2',
          style: { 
            background: 'var(--gradient-brand)',
            '--tw-ring-color': 'var(--primary-400)'
          } as React.CSSProperties
        };
      case 'danger':
        return {
          className: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
          style: {}
        };
      case 'ghost':
        return {
          className: 'bg-transparent hover:bg-opacity-10',
          style: { 
            color: 'var(--primary-600)'
          } as React.CSSProperties
        };
      case 'outline':
        return {
          className: 'bg-transparent border focus:ring-2',
          style: { 
            borderColor: 'var(--primary-300)',
            color: 'var(--primary-700)',
            '--tw-ring-color': 'var(--primary-400)'
          } as React.CSSProperties
        };
      default:
        return { className: '', style: {} };
    }
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl'
  };

  const variantStyles = getVariantStyles();

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all duration-200',
        'focus:outline-none focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
        variantStyles.className,
        sizes[size],
        className
      )}
      style={{ ...variantStyles.style, ...style }}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export { Button };
