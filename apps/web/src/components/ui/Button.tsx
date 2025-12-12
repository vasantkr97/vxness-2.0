import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'danger' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "font-medium px-6 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-accent hover:bg-accent/90 text-white",
    success: "bg-success/10 hover:bg-success/20 text-success border border-success/30",
    danger: "bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30",
    outline: "bg-transparent border border-dark-600 text-muted hover:text-white hover:border-dark-500",
    ghost: "bg-transparent text-muted hover:text-white"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};