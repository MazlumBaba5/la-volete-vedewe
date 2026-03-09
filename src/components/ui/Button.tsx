import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'accent',
  size = 'md',
  children,
  fullWidth,
  className = '',
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm px-5 py-2.5',
    lg: 'text-base px-7 py-3',
  };

  return (
    <button
      className={`btn-${variant} ${sizeClasses[size]} ${fullWidth ? 'w-full justify-center' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
