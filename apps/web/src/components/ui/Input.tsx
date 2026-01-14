import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="text-muted text-sm mb-1.5 block">{label}</label>}
      <input
        className={`w-full bg-dark-700 border border-dark-600/50 rounded-lg px-4 py-3 text-white placeholder:text-muted focus:border-gray-500/50 focus:ring-1 focus:ring-gray-500/30 outline-none transition-all disabled:opacity-50 ${className} ${error ? 'border-danger/50' : ''}`}
        {...props}
      />
      {error && <span className="text-danger text-xs mt-1">{error}</span>}
    </div>
  );
};