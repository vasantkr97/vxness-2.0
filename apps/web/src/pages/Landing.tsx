import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen bg-black text-white selection:bg-accent/30 selection:text-white overflow-x-hidden relative">
      {/* Animated Blue Gradient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 left-0 border-b border-accent/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group">
            <span className="font-bold text-2xl tracking-tight text-accent transition-all duration-300 group-hover:scale-105">vxness</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <button className="bg-accent/10 hover:bg-accent hover:text-black text-sm px-6 py-2 rounded-full border border-accent/30 hover:border-accent transition-all duration-300 font-medium hover:shadow-lg hover:shadow-accent/20">
                Log in
              </button>
            </Link>
            <Link to="/signup">
              <button className="bg-accent/10 hover:bg-accent hover:text-black text-sm px-6 py-2 rounded-full border border-accent/30 hover:border-accent transition-all duration-300 font-medium hover:shadow-lg hover:shadow-accent/20">
                Sign up
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative">
        {/* Section 1: Hero (Text & CTA) */}
        <section className="relative min-h-screen flex flex-col justify-center items-center px-6 overflow-hidden pt-16">
          
          <div className="max-w-4xl mx-auto text-center relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white via-white to-accent bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
              Precision Trading. <br />
              Limitless Potential.
            </h1>
            <p className="text-lg md:text-xl text-white/50 mb-12 leading-relaxed max-w-2xl mx-auto font-light animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              Execute trades with microsecond latency. <br />
              Institutional-grade liquidity on a fully decentralized protocol.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
              <Link to="/signup">
                <button className="px-8 py-3 bg-accent text-black text-sm font-semibold rounded-full hover:bg-accent/90 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-accent/30">
                  Start Trading
                </button>
              </Link>
              <Link to="/login">
                <button className="px-8 py-3 bg-transparent border-2 border-accent/30 text-accent text-sm font-semibold rounded-full hover:bg-accent/10 hover:border-accent transition-all duration-300 backdrop-blur-sm">
                  View Markets
                </button>
              </Link>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="absolute top-1/4 left-10 w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute top-1/3 right-20 w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
          <div className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-accent/60 rounded-full animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        </section>

        {/* Section 2: Platform Preview */}
        <section className="relative py-32 px-6 bg-gradient-to-b from-black via-black to-dark-900">
          <div className="max-w-6xl mx-auto group relative z-10">
            {/* Enhanced Glow Effect with Blue */}
            <div className="absolute -inset-4 bg-gradient-to-r from-accent/20 via-blue-500/20 to-accent/20 rounded-3xl blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-700 animate-pulse" style={{ animationDuration: '8s' }} />

            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-accent/20 bg-black/50 backdrop-blur-xl transform transition-all duration-500 hover:scale-[1.02]">
              <img
                src="/platform_preview.png"
                alt="Platform Interface"
                className="w-full h-auto rounded-2xl shadow-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-accent/10 pointer-events-none" />
            </div>
          </div>

          {/* Background Blue Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[80%] bg-accent/10 blur-[150px] rounded-full pointer-events-none" />
        </section>
      </main>

      {/* Value Props */}
      <section className="py-24 border-t border-accent/10 relative bg-gradient-to-b from-dark-900 to-black">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          {[
            { title: "Lightning Fast", desc: "Engineered for microsecond latency. Never miss a tick.", delay: "0ms" },
            { title: "Deep Liquidity", desc: "Access the deepest order books in DeFi.", delay: "100ms" },
            { title: "Bank-Grade Security", desc: "Non-custodial by design. Your keys, your assets.", delay: "200ms" }
          ].map((feature, i) => (
            <div 
              key={i} 
              className="group p-8 rounded-2xl bg-gradient-to-br from-accent/5 to-transparent border border-accent/10 hover:border-accent/30 hover:bg-accent/10 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-accent/10 animate-in fade-in slide-in-from-bottom-4 duration-700"
              style={{ animationDelay: feature.delay }}
            >
              <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-4 group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                <div className="w-6 h-6 rounded-full bg-accent/40" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-white group-hover:text-accent transition-colors duration-300">{feature.title}</h3>
              <p className="text-white/50 leading-relaxed group-hover:text-white/70 transition-colors duration-300">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-accent/10 text-center bg-black">
        <p className="text-white/40 text-sm">
          © 2026 <span className="text-accent">vxness</span>. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
