'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);
  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };
  return (
    <header className={`floating-nav-wrapper ${scrolled ? 'nav-scrolled' : ''}`}>
      <nav className="floating-navbar" aria-label="Main Navigation">
        <div className="navbar-left">
          <Link href="/" className="navbar-brand-link" onClick={closeMobileMenu} aria-label="Parakh Home">
            <img
              src="/assets/brand-logo.png"
              alt="Parakh Logo"
              className="navbar-brand-logo"
            />
          </Link>
        </div>
        <div className="navbar-center-desktop">
          <Link href="#services" className="nav-link" onClick={closeMobileMenu}>
            Services
          </Link>
          <Link href="#about" className="nav-link" onClick={closeMobileMenu}>
            About
          </Link>
          <Link href="#mnm" className="nav-link" onClick={closeMobileMenu}>
            MnM
          </Link>
        </div>
        <div className="navbar-right-desktop">
          <Link href="#login" className="nav-btn-login" onClick={closeMobileMenu}>
            Login
          </Link>
        </div>
        <button
          type="button"
          className="navbar-mobile-toggle"
          onClick={toggleMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileMenuOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="7" x2="20" y2="7"></line>
              <line x1="4" y1="12" x2="20" y2="12"></line>
              <line x1="4" y1="17" x2="20" y2="17"></line>
            </svg>
          )}
        </button>
      </nav>
      {mobileMenuOpen && (
        <div className="navbar-mobile-menu" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
          <div className="navbar-mobile-links">
            <Link href="#services" className="mobile-nav-link" onClick={closeMobileMenu}>
              Services
            </Link>
            <Link href="#about" className="mobile-nav-link" onClick={closeMobileMenu}>
              About
            </Link>
            <Link href="#mnm" className="mobile-nav-link" onClick={closeMobileMenu}>
              MnM
            </Link>
            <div className="mobile-nav-divider"></div>
            <Link href="#login" className="mobile-nav-btn-login" onClick={closeMobileMenu}>
              Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
