import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../BrandLogo';
import '../../styles/public-pages.css';

interface AuthFrameProps {
  mode: 'login' | 'signup';
  title: string;
  intro: string;
  children: ReactNode;
}

export const AuthFrame = ({ mode, title, intro, children }: AuthFrameProps) => {
  const isLogin = mode === 'login';

  useEffect(() => {
    document.title = isLogin ? 'Sign in | Vxness' : 'Create account | Vxness';
  }, [isLogin]);

  return (
    <div className={`vx-auth-page vx-auth-page--${mode}`}>
      <section className="vx-auth-story" aria-label="Vxness trading platform">
        <div className="vx-auth-story__copy">
          <Link to="/" aria-label="Vxness home"><BrandLogo size="lg" /></Link>
          <div className="vx-auth-story__eyebrow">
            <span className="vx-live-dot" aria-hidden="true" />
            One terminal. Complete context.
          </div>
          <h1>Stay ahead of<br /><span>the move.</span></h1>
          <p className="vx-auth-story__lead">
            Live markets, risk, orders, and positions in one focused workspace.
          </p>

          <figure className="vx-auth-preview">
            <div><span><i className="vx-window-dot" /> Terminal preview</span><span className="vx-status"><i /> Market connected</span></div>
            <img src="/platform_preview.png" alt="Vxness crypto trading terminal" />
          </figure>
        </div>

        <div className="vx-auth-story__foot" aria-label="Platform qualities">
          <span>Live markets</span>
          <span>Order controls</span>
          <span>Position tracking</span>
        </div>
      </section>

      <section className="vx-auth-form-side">
        <div className="vx-auth-panel">
          <Link className="vx-auth-panel__back" to="/" aria-label="Back to Vxness home">
            <span className="vx-arrow" aria-hidden="true">&larr;</span>
            Back to Vxness
          </Link>

          <div className="vx-auth-panel__meta"><span>Secure access</span><span>{isLogin ? 'Welcome back' : 'New account'}</span></div>
          <h2>{title}</h2>
          <p className="vx-auth-panel__intro">{intro}</p>
          {children}

          <p className="vx-auth-switch">
            {isLogin ? 'New to Vxness?' : 'Already have an account?'}{' '}
            <Link to={isLogin ? '/signup' : '/login'}>
              {isLogin ? 'Create an account' : 'Sign in'}
            </Link>
          </p>
          <p className="vx-auth-disclaimer">
            Digital asset trading involves risk. Trade only with funds you can afford to lose.
          </p>
        </div>
      </section>
    </div>
  );
};
