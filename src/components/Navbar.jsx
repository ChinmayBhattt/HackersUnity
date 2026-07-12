'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import styles from './Navbar.module.css';

const navLinks = [
  { label: 'Hackathons', href: '/hackathons' },
  { label: 'Community', href: '/community' },
  { label: 'Projects', href: '/projects' },
  // { label: 'Events', href: '/events' },
  { label: 'Podcast', href: '/podcasts' },
  { label: 'Sponsors', href: '/sponsors' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`} role="navigation" aria-label="Main navigation">
      <div className={`${styles.inner} container`}>
        {/* Logo */}
        <Link href="/" className={styles.logo} aria-label="Hacker's Unity Home">
          <img src="/logo.png" alt="Hacker's Unity Logo" className={styles.logoImage} />
          <span className={styles.logoText}>Hacker&apos;s Unity</span>
        </Link>

        {/* Desktop Nav */}
        <div className={styles.desktopNav}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={styles.navLink}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className={styles.ctaGroup}>
          <Link href="/about" className={`btn btn-ghost btn-sm ${styles.loginBtn}`}>
            About Us
          </Link>
          <Link href="/contact" className={`btn btn-primary btn-sm ${styles.joinBtn}`}>
            Join Free
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className={styles.hamburger}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <div className={`${styles.mobileDrawer} ${mobileOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.drawerContent}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.mobileLink}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className={styles.mobileCtaGroup}>
            <Link href="/about" className="btn btn-ghost" onClick={() => setMobileOpen(false)}>
              About Us
            </Link>
            <Link href="/contact" className="btn btn-primary" onClick={() => setMobileOpen(false)}>
              Join Free
            </Link>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className={styles.overlay}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </nav>
  );
}
