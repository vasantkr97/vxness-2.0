import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

export const Landing: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/trade', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading || user) return null;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20 selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 left-0 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/vxness_logo.png" alt="vxness" className="w-8 h-8 object-contain opacity-90" />
            <span className="font-bold text-xl tracking-tight text-white/90">vxness</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Log in
            </Link>
            <Link to="/signup">
              <Button variant="ghost" className="bg-white/10 text-white hover:bg-white text-sm px-5 py-2 rounded-full border border-transparent hover:text-black transition-all duration-300">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="selection:bg-white/20 selection:text-white">
        {/* Section 1: Hero (Text & CTA) */}
        <section className="relative min-h-screen flex flex-col justify-center items-center px-6 overflow-hidden pt-16">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-white/5 to-transparent blur-[100px] rounded-full opacity-20 pointer-events-none" />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              Precision Trading. <br />
              Limitless Potential.
            </h1>
            <p className="text-lg text-white/40 mb-10 leading-relaxed max-w-xl mx-auto font-light">
              Execute trades with microsecond latency. <br />
              Institutional-grade liquidity on a fully decentralized protocol.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <button className="px-6 py-2.5 bg-white text-black text-sm font-medium rounded-full hover:bg-gray-100 transition-all duration-300">
                  Start Trading
                </button>
              </Link>
              <Link to="/login">
                <button className="px-6 py-2.5 bg-transparent border border-white/20 text-white text-sm font-medium rounded-full hover:bg-white/5 transition-all duration-300 backdrop-blur-sm">
                  View Markets
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Section 2: Platform Preview */}
        <section className="relative py-32 px-6 bg-gradient-to-b from-black via-zinc-800 to-zinc-900">
          <div className="max-w-6xl mx-auto group relative z-10">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-b from-white/10 to-transparent rounded-2xl blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />

            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black/50 backdrop-blur-xl">
              <img
                src="/platform_preview.png"
                alt="Platform Interface"
                className="w-full h-auto rounded-xl shadow-lg transform transition-transform duration-700 hover:scale-[1.005]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Background Decoration for Preview Section - Neutral White */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[90%] bg-white/5 blur-[120px] rounded-full pointer-events-none" />
        </section>
      </main>

      {/* Value Props */}
      <section className="py-24 border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12">
          {[
            { title: "Lightning Fast", desc: "Engineered for microsecond latency. Never miss a tick." },
            { title: "Deep Liquidity", desc: "Access the deepest order books in DeFi." },
            { title: "Bank-Grade Security", desc: "Non-custodial by design. Your keys, your assets." }
          ].map((feature, i) => (
            <div key={i} className="group p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-300">
              <h3 className="text-2xl font-semibold mb-4 text-white group-hover:text-white/100 transition-colors">{feature.title}</h3>
              <p className="text-white/50 leading-relaxed group-hover:text-white/70 transition-colors">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center">
        <p className="text-white/30 text-sm">
          © 2026 vxness. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
