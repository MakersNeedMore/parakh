'use client';
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { setSession } from '../../lib/auth';
import './login.css';

// view: 'login' | 'register' | 'forgot'
export default function LoginPage() {
  const [view, setView] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState(null); // { type: 'error' | 'success', text }
  const [loading, setLoading] = useState(false);

  const switchView = (next) => {
    setView(next);
    setMessage(null);
    setPassword('');
    setConfirm('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (view === 'register') {
      if (password.length < 8) return setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      if (password !== confirm) return setMessage({ type: 'error', text: 'Passwords do not match.' });
    }

    setLoading(true);
    try {
      // TODO: connect to the backend auth endpoints once they are ready, e.g.
      // const res = await fetch(`${process.env.NEXT_PUBLIC_PARAKH_BACKEND}/v1/auth/login`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password }),
      // });
      await new Promise((r) => setTimeout(r, 600)); // placeholder

      if (view === 'forgot') {
        setMessage({ type: 'success', text: 'If this email is registered, a reset link will be sent.' });
      } else {
        // Replace with the real backend response once auth is ready.
        setSession({ email, name: view === 'register' ? name : undefined });
        // Go back to where the user came from (e.g. /analyze?download=1). Only same-site paths are allowed.
        const next = new URLSearchParams(window.location.search).get('next');
        window.location.assign(next && next.startsWith('/') && !next.startsWith('//') ? next : '/analyze');
        return;
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    login: ['Welcome back', 'Log in to your Parakh account.'],
    register: ['Create an account', 'Register to start analysing images.'],
    forgot: ['Forgot password?', 'Enter your email and we will send you a reset link.'],
  };
  const buttonText = { login: 'Log In', register: 'Register', forgot: 'Send reset link' };

  return (
    <div className="app-container">
      <Navbar />
      <main className="login-main">
        <div className="login-card">
          <Link href="/" aria-label="Parakh Home" className="login-logo-link">
            <img src="/assets/parakh-logo.png" alt="Parakh" className="login-logo" />
          </Link>
          <h1 className="login-title">{titles[view][0]}</h1>
          <p className="login-subtitle">{titles[view][1]}</p>

          <form className="login-form" onSubmit={handleSubmit} noValidate={false}>
            {view === 'register' && (
              <label className="login-field">
                <span>Full name</span>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required autoComplete="name" />
              </label>
            )}

            <label className="login-field">
              <span>Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
            </label>

            {view !== 'forgot' && (
              <label className="login-field">
                <span>Password</span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete={view === 'login' ? 'current-password' : 'new-password'} />
              </label>
            )}

            {view === 'register' && (
              <label className="login-field">
                <span>Confirm password</span>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required autoComplete="new-password" />
              </label>
            )}

            {view === 'login' && (
              <button type="button" className="login-link-btn login-forgot" onClick={() => switchView('forgot')}>
                Forgot password?
              </button>
            )}

            {message && (
              <p className={`login-message login-message-${message.type}`} role="status">{message.text}</p>
            )}

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? 'Please wait…' : buttonText[view]}
            </button>
          </form>

          <div className="login-footer">
            {view === 'login' && (
              <>
                <span>New to Parakh?</span>
                <button type="button" className="login-register-btn" onClick={() => switchView('register')}>Register</button>
              </>
            )}
            {view === 'register' && (
              <>
                <span>Already have an account?</span>
                <button type="button" className="login-link-btn" onClick={() => switchView('login')}>Log in</button>
              </>
            )}
            {view === 'forgot' && (
              <button type="button" className="login-link-btn" onClick={() => switchView('login')}>Back to log in</button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}