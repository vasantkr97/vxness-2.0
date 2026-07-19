import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthField } from '../components/auth/AuthField';
import { AuthFrame } from '../components/auth/AuthFrame';
import { useAuth } from '../hooks/useAuth';

interface LoginErrors {
  email?: string;
  password?: string;
}

const isEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value);

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signin } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const nextErrors: LoginErrors = {};

    if (!email.trim()) nextErrors.email = 'Enter your email address.';
    else if (!isEmail(email)) nextErrors.email = 'Enter a valid email address.';

    if (!password) nextErrors.password = 'Enter your password.';
    else if (password.length < 6) nextErrors.password = 'Password must be at least 6 characters.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError('');

    if (!validate()) return;

    setLoading(true);
    const result = await signin(email.trim(), password);
    setLoading(false);

    if (result.success) {
      navigate('/trade');
      return;
    }

    setServerError(result.error || 'We could not sign you in. Check your details and try again.');
  };

  return (
    <AuthFrame
      mode="login"
      title="Welcome back"
      intro="Sign in to access your Vxness account."
    >
      <form className="vx-auth-form" onSubmit={handleSubmit} noValidate>
        <AuthField
          id="email"
          label="Email address"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setErrors((current) => ({ ...current, email: undefined }));
          }}
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email}
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setErrors((current) => ({ ...current, password: undefined }));
          }}
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password}
        />

        {serverError && (
          <div className="vx-auth-error" role="alert">
            <span>{serverError}</span>
          </div>
        )}

        <button
          className="vx-button vx-button--primary vx-button--full vx-auth-submit"
          type="submit"
          disabled={loading}
        >
          {loading && <span className="vx-loader" aria-hidden="true" />}
          {loading ? 'Signing in...' : 'Sign in to Vxness'}
          {!loading && <span className="vx-arrow" aria-hidden="true">&rarr;</span>}
        </button>
      </form>
    </AuthFrame>
  );
};
