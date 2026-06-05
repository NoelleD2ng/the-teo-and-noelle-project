'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import WishlistCard from '@/components/WishlistCard'

const embers = [
  { top: '8%',  left: '12%', size: 1.5, delay: '0s',   dur: '9s'  },
  { top: '22%', left: '78%', size: 1,   delay: '1.5s', dur: '12s' },
  { top: '45%', left: '5%',  size: 2,   delay: '3s',   dur: '8s'  },
  { top: '60%', left: '88%', size: 1.5, delay: '0.8s', dur: '14s' },
  { top: '15%', left: '50%', size: 1,   delay: '5s',   dur: '10s' },
  { top: '78%', left: '30%', size: 1.5, delay: '2s',   dur: '11s' },
  { top: '35%', left: '65%', size: 1,   delay: '4s',   dur: '9s'  },
  { top: '88%', left: '70%', size: 2,   delay: '1s',   dur: '13s' },
  { top: '52%', left: '42%', size: 1,   delay: '6s',   dur: '7s'  },
  { top: '5%',  left: '90%', size: 1.5, delay: '3.5s', dur: '16s' },
]

export default function SecretPage() {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className="secret-root min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: '#060404' }}
    >

      {/* ── Deep crimson glow — top left ─────────────────────── */}
      <div
        className="absolute pointer-events-none secret-glow-a"
        style={{
          top: '-5%', left: '-8%',
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(140,20,30,0.35) 0%, transparent 65%)',
          filter: 'blur(90px)',
          borderRadius: '50%',
        }}
      />

      {/* ── Deep rose glow — bottom right ────────────────────── */}
      <div
        className="absolute pointer-events-none secret-glow-b"
        style={{
          bottom: '-8%', right: '-5%',
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(100,10,60,0.4) 0%, transparent 65%)',
          filter: 'blur(100px)',
          borderRadius: '50%',
        }}
      />

      {/* ── Gold ember center glow ────────────────────────────── */}
      <div
        className="absolute pointer-events-none secret-glow-c"
        style={{
          top: '30%', left: '35%',
          width: 400, height: 300,
          background: 'radial-gradient(ellipse, rgba(180,120,30,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* ── Floating embers ──────────────────────────────────── */}
      {embers.map((e, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            top: e.top, left: e.left,
            width: e.size, height: e.size,
            background: i % 3 === 0
              ? 'rgba(220,160,60,0.6)'
              : i % 3 === 1
              ? 'rgba(200,60,80,0.5)'
              : 'rgba(255,255,255,0.2)',
            animation: `secret-float ${e.dur} ease-in-out ${e.delay} infinite`,
          }}
        />
      ))}

      {/* ── Thin horizontal rule ─────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(to right, transparent, rgba(180,120,30,0.3), transparent)' }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(to right, transparent, rgba(180,120,30,0.3), transparent)' }}
      />

      {/* ── Main content ─────────────────────────────────────── */}
      <div
        className={`relative z-10 text-center px-8 max-w-2xl mx-auto secret-content ${revealed ? 'secret-revealed' : ''}`}
      >
        {/* Eyebrow */}
        <p
          className="secret-eyebrow mb-8"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '9px',
            letterSpacing: '0.55em',
            textTransform: 'uppercase',
            color: 'rgba(180,120,30,0.7)',
            fontWeight: 300,
          }}
        >
          for your eyes only
        </p>

        {/* Headline */}
        <h1
          className="secret-headline"
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            lineHeight: 1.05,
            color: '#F5ECD6',
            textShadow: '0 0 80px rgba(180,120,30,0.25), 0 2px 40px rgba(140,20,30,0.15)',
          }}
        >
          just us
        </h1>

        {/* Divider */}
        <div className="secret-divider flex items-center justify-center gap-4 my-10">
          <div style={{ width: 60, height: 1, background: 'linear-gradient(to right, transparent, rgba(180,120,30,0.4))' }} />
          <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(180,120,30,0.6)' }} />
          <div style={{ width: 60, height: 1, background: 'linear-gradient(to left, transparent, rgba(180,120,30,0.4))' }} />
        </div>

        {/* Quote */}
        <p
          className="secret-quote"
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
            lineHeight: 1.75,
            color: 'rgba(245,236,214,0.65)',
            fontWeight: 400,
          }}
        >
          &ldquo;In another life, I would have loved
          just doing this — being here, close to you,
          with nowhere else to be.&rdquo;
        </p>

        {/* Subtext */}
        <p
          className="secret-subtext mt-10"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(180,120,30,0.45)',
            fontWeight: 300,
          }}
        >
          Teo &amp; Noelle · always
        </p>

        {/* Secret cards */}
        <div className="secret-cards grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16">
          {[
            {
              label: 'what i love',
              text: 'the way you look at me like I\'m the only thing in the room.',
            },
            {
              label: 'a secret',
              text: 'I think about you in the quiet moments more than you know.',
            },
            {
              label: 'always',
              text: 'no matter the distance, you\'re right here with me.',
            },
          ].map(({ label, text }, i) => (
            <div
              key={i}
              className="secret-card"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(180,120,30,0.15)',
                borderRadius: '16px',
                padding: '28px 20px',
                backdropFilter: 'blur(8px)',
                animationDelay: `${0.2 + i * 0.12}s`,
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '8px',
                  letterSpacing: '0.5em',
                  textTransform: 'uppercase',
                  color: 'rgba(180,120,30,0.55)',
                  marginBottom: '12px',
                  fontWeight: 400,
                }}
              >
                {label}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: '14px',
                  lineHeight: 1.7,
                  color: 'rgba(245,236,214,0.6)',
                }}
              >
                {text}
              </p>
            </div>
          ))}
        </div>

        {/* Wishlist */}
        <WishlistCard />

        {/* Back link */}
        <div className="secret-back mt-4">
          <Link
            href="/"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '9px',
              letterSpacing: '0.45em',
              textTransform: 'uppercase',
              color: 'rgba(180,120,30,0.35)',
              textDecoration: 'none',
              fontWeight: 300,
              transition: 'color 0.4s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(180,120,30,0.75)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(180,120,30,0.35)')}
          >
            ← leave quietly
          </Link>
        </div>
      </div>

      {/* ── Inline styles ─────────────────────────────────────── */}
      <style>{`
        .secret-root {
          color-scheme: dark;
        }
        .secret-content {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 1.2s ease-out, transform 1.2s ease-out;
        }
        .secret-revealed {
          opacity: 1;
          transform: translateY(0);
        }
        @keyframes secret-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
          40%       { transform: translateY(-22px) scale(1.3); opacity: 0.9; }
          80%       { transform: translateY(-10px) scale(0.9); opacity: 0.3; }
        }
        @keyframes secret-glow-a {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 0.9; transform: scale(1.08); }
        }
        @keyframes secret-glow-b {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes secret-glow-c {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1; }
        }
        .secret-glow-a { animation: secret-glow-a 10s ease-in-out infinite; }
        .secret-glow-b { animation: secret-glow-b 13s ease-in-out infinite; animation-delay: 3s; }
        .secret-glow-c { animation: secret-glow-c 8s ease-in-out infinite; animation-delay: 1s; }
        .secret-card {
          transition: border-color 0.4s ease, background 0.4s ease;
        }
        .secret-card:hover {
          border-color: rgba(180,120,30,0.35) !important;
          background: rgba(255,255,255,0.04) !important;
        }
      `}</style>
    </div>
  )
}
