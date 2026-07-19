import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthField } from '../components/auth/AuthField';
import { AuthFrame } from '../components/auth/AuthFrame';
import { useAuth } from '../hooks/useAuth';

interface SignupErrors {
  username?: string;
  email?: string;
  password?: string;
}

const isEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value);

export const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<SignupErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const nextErrors: SignupErrors = {};

    if (!username.trim()) nextErrors.username = 'Choose a username.';
    else if (username.trim().length < 2) nextErrors.username = 'Username must be at least 2 characters.';

    if (!email.trim()) nextErrors.email = 'Enter your email address.';
    else if (!isEmail(email)) nextErrors.email = 'Enter a valid email address.';

    if (!password) nextErrors.password = 'Create a password.';
    else if (password.length < 6) nextErrors.password = 'Use at least 6 characters.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError('');

    if (!validate()) return;

    setLoading(true);
    const result = await signup(username.trim(), email.trim(), password);
    setLoading(false);

    if (result.success) {
      navigate('/trade');
      return;
    }

    setServerError(result.error || 'We could not create your account. Review your details and try again.');
  };

  return (
    <AuthFrame
      mode="signup"
      title="Create account"
      intro="Set up your account to access Vxness."
    >
      <form className="vx-auth-form" onSubmit={handleSubmit} noValidate>
        <AuthField
          id="username"
          label="Username"
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
            setErrors((current) => ({ ...current, username: undefined }));
          }}
          autoComplete="username"
          placeholder="Choose a username"
          error={errors.username}
        />
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
          autoComplete="new-password"
          placeholder="Create a password"
          hint="6 characters minimum"
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
          {loading ? 'Creating account...' : 'Create account'}
          {!loading && <span className="vx-arrow" aria-hidden="true">&rarr;</span>}
        </button>
      </form>
    </AuthFrame>
  );
};
