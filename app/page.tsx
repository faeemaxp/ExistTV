'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, Github, Play } from 'lucide-react';

const InteractiveCube = dynamic(() => import('@/components/InteractiveCube'), { ssr: false });

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const taglines = [
  "10,000+ live channels. Zero cost.",
  "News from every corner of the world.",
  "Sports. Movies. Music. Everything.",
  "No sign-up. No credit card.",
  "Just click and watch.",
];

export default function LandingPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Typewriter effect
  useEffect(() => {
    const currentTagline = taglines[currentIndex];
    const typeSpeed = isDeleting ? 28 : 48;

    if (!isDeleting && displayText === currentTagline) {
      const t = setTimeout(() => setIsDeleting(true), 2200);
      return () => clearTimeout(t);
    }
    if (isDeleting && displayText === '') {
      setIsDeleting(false);
      setCurrentIndex((prev) => (prev + 1) % taglines.length);
      return;
    }
    const t = setTimeout(() => {
      setDisplayText(
        isDeleting
          ? currentTagline.substring(0, displayText.length - 1)
          : currentTagline.substring(0, displayText.length + 1)
      );
    }, typeSpeed);
    return () => clearTimeout(t);
  }, [displayText, isDeleting, currentIndex]);

  // Cursor glow
  useEffect(() => {
    const move = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <div className="landing-root">
      {/* Cursor glow */}
      <div
        className="cursor-glow hidden md:block"
        style={{ left: mousePos.x, top: mousePos.y }}
      />

      {/* ── Nav ──────────────────────────────────────────── */}
      <nav className="landing-nav">
        <Link href="/" className="flex items-center gap-2.5 group magnetic">
          <img
            src={`${basePath}/logo.svg`}
            className="h-7 w-7 transition-transform group-hover:scale-110"
            alt="ExistTV"
          />
          <span className="text-base font-semibold group-hover:opacity-70 transition-fast">
            ExistTV
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/how-it-works"
            className="text-sm text-muted hover:text-fg transition-fast hidden sm:block"
          >
            How it works
          </Link>
          <a
            href="https://github.com/faeemxccc/ExistTV"
            target="_blank"
            rel="noreferrer"
            className="p-2 text-muted hover:text-fg transition-fast"
          >
            <Github className="h-5 w-5" />
          </a>
          <Link
            href="/watch"
            className="px-4 py-2 bg-fg text-sm font-medium rounded-full hover:opacity-90 transition-fast flex items-center gap-2 btn-press hover-lift"
            style={{ color: 'var(--bg)' }}
          >
            Watch <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      {/* ── Hero split ───────────────────────────────────── */}
      <main className="landing-hero">

        {/* Left — text column */}
        <div className="hero-text-col">
          <h1 className="hero-headline animate-up">
            Stream<br />the world.
          </h1>

          {/* Typewriter */}
          <div className="h-14 flex items-center animate-up delay-1">
            <p className="text-xl text-muted font-normal">
              {displayText}
              <span className="inline-block w-0.5 h-5 bg-fg/50 ml-1 animate-pulse" />
            </p>
          </div>

          {/* CTA buttons */}
          <div className="animate-up delay-2 flex flex-col sm:flex-row items-start gap-4">
            <Link
              href="/watch"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-fg text-lg font-semibold rounded-full hover:opacity-90 transition-fast hover-lift btn-press animate-glow"
              style={{ color: 'var(--bg)' }}
            >
              <Play className="h-5 w-5 fill-current transition-transform group-hover:scale-110" />
              Start watching
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 px-6 py-4 text-muted hover:text-fg text-lg font-medium transition-fast group"
            >
              Learn more
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Stats row */}
          <div className="animate-up delay-3 flex items-center gap-8 pt-4">
            {[['10K+', 'Channels'], ['100+', 'Countries'], ['Free', 'Forever']].map(([val, label], i) => (
              <div key={label} className="flex items-center gap-8">
                {i > 0 && <div className="w-px h-10 bg-border" />}
                <div className="text-center group cursor-default">
                  <div className="text-2xl font-bold transition-transform group-hover:scale-110">{val}</div>
                  <div className="text-sm text-muted">{label}</div>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right — cube column */}
        <div className="hero-cube-col">
          {/* Hint label */}
          <p className="cube-hint">drag to spin</p>
          <InteractiveCube />
        </div>

      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="landing-footer">
        <Link href="/how-it-works" className="hover:text-fg transition-fast">How it works</Link>
        <span className="hidden sm:block opacity-30">·</span>
        <a href="https://github.com/iptv-org/iptv" target="_blank" rel="noreferrer" className="hover:text-fg transition-fast">
          Powered by IPTV-org
        </a>
        <span className="hidden sm:block opacity-30">·</span>
        <span className="opacity-50">© 2025</span>
      </footer>
    </div>
  );
}
