import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, error, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-semibold text-stone-700 mb-1.5">{label}</label>}
      <input
        ref={ref}
        className={cn(
          'w-full px-4 py-2.5 border rounded-xl transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          'disabled:opacity-50 disabled:bg-stone-50',
          'placeholder:text-stone-400',
          error 
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500 text-red-900 placeholder-red-300' 
            : 'border-stone-200 text-stone-900',
          className
        )}
        style={{
          '--tw-ring-color': error ? undefined : 'var(--primary-400)',
          borderColor: error ? undefined : undefined,
        } as React.CSSProperties}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-red-600 font-medium">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export { Input };
