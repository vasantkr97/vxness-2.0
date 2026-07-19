import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { useAuth } from '../hooks/useAuth';
import '../styles/public-pages.css';

const capabilities = [
  {
    label: 'Market intelligence',
    title: 'Read the market without losing the trade.',
    copy: 'Live bid, ask, timeframe, and price action stay visible while you move between supported markets.',
  },
  {
    label: 'Risk clarity',
    title: 'Know the mechanics before you commit.',
    copy: 'Quantity, leverage, notional value, estimated liquidation, and margin resolve inside one order flow.',
  },
  {
    label: 'Position control',
    title: 'Stay in command after execution.',
    copy: 'Open positions, live PnL, balances, and order history remain attached to the terminal.',
  },
];

const workflow = [
  { index: '01', title: 'Select a market', copy: 'Choose BTC, ETH, or SOL and read the live bid and ask.' },
  { index: '02', title: 'Build the order', copy: 'Set direction, quantity, leverage, and optional risk controls.' },
  { index: '03', title: 'Manage the position', copy: 'Follow PnL and close positions from the same workspace.' },
];

export const Landing = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/trade', { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    document.title = 'Vxness | Crypto trading terminal';
  }, []);

  if (loading || user) return null;

  return (
    <div className="vx-public-page">
      <header className="vx-landing-nav">
        <div className="vx-container vx-landing-nav__inner">
          <Link to="/" aria-label="Vxness home"><BrandLogo size="md" /></Link>
          <nav className="vx-nav-links" aria-label="Primary navigation">
            <a href="#terminal">Product</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#workflow">How it works</a>
          </nav>
          <div className="vx-nav-actions">
            <Link className="vx-button vx-button--quiet" to="/login">Sign in</Link>
            <Link className="vx-button vx-button--primary" to="/signup">Create account</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="vx-hero" id="terminal" aria-labelledby="hero-title">
          <div className="vx-container vx-hero__grid">
            <div className="vx-hero__copy">
              <div className="vx-hero__eyebrow">
                <span className="vx-live-dot" aria-hidden="true" />
                The terminal for decisive traders
              </div>
              <h1 id="hero-title">Trade with clarity.<br /><span>Move with conviction.</span></h1>
              <p className="vx-hero__lead">
                One high-performance workspace for market context, execution, risk, and open positions. Everything that matters, exactly where you need it.
              </p>
              <div className="vx-hero__actions">
                <Link className="vx-button vx-button--primary" to="/signup">
                  Start trading <span className="vx-arrow" aria-hidden="true">&rarr;</span>
                </Link>
                <a className="vx-button vx-button--quiet" href="#product-preview">Explore the terminal</a>
              </div>
              <dl className="vx-hero__facts">
                <div><dt>01</dt><dd>Unified execution view</dd></div>
                <div><dt>24/7</dt><dd>Always-on market access</dd></div>
                <div><dt>Live</dt><dd>Position and risk context</dd></div>
              </dl>
            </div>

            <figure className="vx-product-shot" id="product-preview">
              <div className="vx-product-shot__glow" aria-hidden="true" />
              <div className="vx-product-shot__bar">
                <span><i className="vx-window-dot" /> Vxness / Trading terminal</span>
                <span className="vx-status"><i /> Market connected</span>
              </div>
              <img
                src="/platform_preview.png"
                alt="Vxness terminal with crypto markets, candlestick chart, open positions, and order controls"
              />
              <div className="vx-product-callout vx-product-callout--risk">
                <span>Risk in view</span>
                <strong>Margin + liquidation</strong>
              </div>
              <div className="vx-product-callout vx-product-callout--position">
                <span>Position context</span>
                <strong>Live PnL</strong>
              </div>
              <figcaption><span>01 / Product view</span> Live chart, execution, risk, and positions in one terminal.</figcaption>
            </figure>
          </div>
        </section>

        <div className="vx-market-tape" aria-label="Supported Vxness markets">
          <div className="vx-container vx-market-tape__inner">
            <div className="is-live"><span>BTC / USDC</span><strong>Market available</strong></div>
            <div className="is-live"><span>ETH / USDC</span><strong>Market available</strong></div>
            <div className="is-live"><span>SOL / USDC</span><strong>Market available</strong></div>
            <div><span>Execution</span><strong>Buy and sell</strong></div>
          </div>
        </div>

        <section className="vx-section" id="capabilities" aria-labelledby="capabilities-title">
          <div className="vx-container">
            <div className="vx-section-heading">
              <div>
                <p className="vx-kicker">Built around the decision</p>
                <h2 id="capabilities-title">Less switching.<br />More signal.</h2>
              </div>
              <p>
                Vxness is designed around the sequence of a trade: understand the market, define the risk, execute, and stay in control.
              </p>
            </div>

            <div className="vx-capabilities">
              {capabilities.map((capability, index) => (
                <article className="vx-capability" key={capability.title}>
                  <span className="vx-capability__index">0{index + 1}</span>
                  <div>
                    <span className="vx-capability__label">{capability.label}</span>
                    <h3>{capability.title}</h3>
                  </div>
                  <p>{capability.copy}</p>
                  <span className="vx-capability__arrow" aria-hidden="true">↗</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="vx-section vx-section--raised" id="workflow" aria-labelledby="workflow-title">
          <div className="vx-container">
            <div className="vx-section-heading">
              <div>
                <p className="vx-kicker">One continuous workflow</p>
                <h2 id="workflow-title">From signal to position, without the friction.</h2>
              </div>
              <p>
                Every step lives in one visual system, keeping the next action clear without hiding the information behind it.
              </p>
            </div>

            <div className="vx-workflow">
              {workflow.map((step) => (
                <article className="vx-workflow__step" key={step.index}>
                  <span className="vx-workflow__number">{step.index}</span>
                  <div className="vx-workflow__line" aria-hidden="true" />
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="vx-access" aria-labelledby="access-title">
          <div className="vx-container vx-access__inner">
            <div>
              <p className="vx-kicker">Your edge, in one view</p>
              <h2 id="access-title">See the whole trade.<br />Then make the move.</h2>
              <p>Create your Vxness account and enter the complete trading workspace.</p>
            </div>
            <Link className="vx-button vx-button--inverse" to="/signup">
              Enter Vxness <span className="vx-arrow" aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="vx-footer">
        <div className="vx-container vx-footer__inner">
          <BrandLogo size="sm" />
          <div><Link to="/login">Sign in</Link><Link to="/signup">Create account</Link></div>
          <span>&copy; 2026 Vxness. Trading involves risk.</span>
        </div>
      </footer>
    </div>
  );
};
