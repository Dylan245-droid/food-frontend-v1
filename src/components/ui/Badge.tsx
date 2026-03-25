import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: "bg-stone-900 text-white border-transparent",
    secondary: "bg-stone-100 text-stone-900 border-transparent",
    outline: "bg-transparent text-stone-900 border-stone-200"
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
