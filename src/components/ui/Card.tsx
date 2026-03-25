import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-stone-100 bg-white text-stone-900 shadow-sm",
        className
      )}
      {...props}
    />
  );
}
