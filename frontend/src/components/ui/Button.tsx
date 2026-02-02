import { forwardRef, type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800': variant === 'primary',
            'bg-[#262626] text-white hover:bg-[#333333] active:bg-[#404040]': variant === 'secondary',
            'text-gray-300 hover:bg-[#262626] hover:text-white': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700 active:bg-red-800': variant === 'danger',
          },
          {
            'px-2.5 py-1.5 text-xs gap-1': size === 'sm',
            'px-4 py-2 text-sm gap-2': size === 'md',
            'px-6 py-3 text-base gap-2': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
