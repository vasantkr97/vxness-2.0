import { useState } from 'react';
import type { ChangeEventHandler, HTMLInputAutoCompleteAttribute, HTMLInputTypeAttribute } from 'react';

interface AuthFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  type?: HTMLInputTypeAttribute;
  autoComplete?: HTMLInputAutoCompleteAttribute;
  placeholder?: string;
  hint?: string;
  error?: string;
}

export const AuthField = ({
  id,
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  placeholder,
  hint,
  error,
}: AuthFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const errorId = `${id}-error`;

  return (
    <div className={`vx-field ${isPassword ? 'vx-field--password' : ''}`}>
      <div className="vx-field__topline">
        <label htmlFor={id}>{label}</label>
        {hint && <span className="vx-field__hint">{hint}</span>}
      </div>
      <div className="vx-field__control">
        <input
          id={id}
          name={id}
          type={isPassword && showPassword ? 'text' : type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          required
        />
        {isPassword && (
          <button
            className="vx-password-toggle"
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error && <p className="vx-field__error" id={errorId}>{error}</p>}
    </div>
  );
};
