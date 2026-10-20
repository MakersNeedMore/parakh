'use client';
import { useState } from 'react';
import Link from 'next/link';
import SculptureHero from '../components/ui/liquid-sculpture-hero';
export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showScorecard, setShowScorecard] = useState(false);
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setShowScorecard(false);
      setProgress(0);
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setShowScorecard(false);
      setProgress(0);
    }
  };
  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (previewUrl && previewUrl !== '/landing page.png') {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setShowScorecard(false);
    setProgress(0);
  };
  const handleRunAnalysis = () => {
    if (!previewUrl) {
      setPreviewUrl('/landing page.png');
      setSelectedFile({ name: 'sample_forensic_frame_01.png', size: 1411186 });
    }
    setShowScorecard(false);
    setProgress(0);
    setIsAnalyzing(true);
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 8) + 6;
      if (current >= 100) {
        current = 100;
        setProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          setIsAnalyzing(false);
          setShowScorecard(true);
        }, 320);
      } else {
        setProgress(current);
      }
    }, 100);
  };
  const forensicMetrics = [
    {
      id: 'neural-synth',
      name: 'Neural Synthesis Likelihood',
      value: 88,
      benchmark: 'FaceForensics++ c23 baseline',
      description: 'Convolutional & generative diffusion latent residuals'
    },
    {
      id: 'boundary-art',
      name: 'Facial Boundary Artifacts',
      value: 74,
      benchmark: 'Alpha matte edge variance',
      description: 'Splicing margin feathering & interpolation discrepancies'
    },
    {
      id: 'spectral-freq',
      name: 'Spectral Frequency Discontinuity',
      value: 46,
      benchmark: '2D Azimuth FFT residual',
      description: 'High-frequency cross-spectral power spectrum anomalies'
    },
    {
      id: 'biometric-mesh',
      name: 'Biometric Geometry Drift',
      value: 14,
      benchmark: '68-point 3D vertex mesh',
      description: 'Facial landmark triangulation & ocular symmetry alignment'
    }
  ];
  const getMetricStyle = (val) => {
    if (val < 30) {
      return {
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.08)',
        border: 'rgba(16, 185, 129, 0.25)',
        status: 'Authentic (Low Risk)'
      };
    }
    if (val < 60) {
      return {
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.08)',
        border: 'rgba(245, 158, 11, 0.25)',
        status: 'Anomalous (Moderate)'
      };
    }
    return {
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.25)',
      status: 'Synthetic (High Risk)'
    };
  };
  const teamMembers = [
    { name: 'Agrima Tripathi', role: 'Technical Writer', img: '/assets/team/agrima-tripathi.jpg' },
    { name: 'Anurag Verma', role: 'Frontend Developer', img: '/assets/team/anurag-verma.jpg' },
    { name: 'Nishu Kumari', role: 'Frontend Developer', img: '/assets/team/nishu.jpg' },
    { name: 'Shivang Saxena', role: 'Backend & Auth', img: '/assets/team/shivang-saxena.png' },
    { name: 'Tanu Thakur', role: 'Backend, Database & Auth', img: '/assets/team/tanu.jpg' },
    { name: 'Yash Gupta', role: 'Frontend Developer', img: '/assets/team/yash-gupta.jpg' },
    { name: 'Charvi Goyal', role: 'Data Science & Database', img: '/assets/team/charvi-goyal.jpg' },
    { name: 'Aditya Verma', role: 'AI/ML & Backend', img: '/assets/team/aditya-verma.jpg' }
  ];
  return (
    <div className="app-container">
      <main className="landing-main">
        <SculptureHero
          src="/sculpture-rotated.png"
          imageBackground="#ffffff"
          showNav={true}
          themeToggle={false}
          brand="Parakh"
          navLinks={[
            { label: 'About', href: '#about' },
            { label: 'Analyse', href: '#services' },
            { label: 'Capabilities', href: '#capabilities' },
            { label: 'Team', href: '#mnm' },
          ]}
          navCta={{ label: 'Log In', href: '#login' }}
          eyebrow="Forensic Neural Verification — MnM Developers"
          headline={"Detecting Synthetic Realities.\nRestoring Digital Trust."}
          headlineAccent="Restoring Digital Trust."
          body="Forensic-grade neural verification engineered to expose deepfakes and facial manipulation in real time — safeguarding visual authenticity."
          primaryCta={{ label: 'Run Analysis', href: '#services' }}
          secondaryCta={{ label: 'Learn more', href: '#capabilities' }}
          hint="Move across the image"
          hintTouch="Touch the image"
          background="#ffffff"
          darkBackground="#09090b"
          textColor="#09090b"
          accentColor="#09090b"
          headingFont="'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif"
          accentFont="'Instrument Serif', 'Times New Roman', serif"
          bodyFont="'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif"
          intro={true}
          streaks={true}
          liquid={1}
          turbulence={1}
          strength={1}
          showCredit={false}
          height="100svh"
          backdropText="pixpect"
          backdropScale={1.1}
          sculptureScale={0.65}
          mobileSculptureScale={0.75}
          id="about"
        />
        <section className="upload-section" id="services">
          <div className="upload-container">
            <div
              className={`upload-dropzone ${isDragging ? 'dropzone-active' : ''} ${previewUrl ? 'has-preview' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('image-upload-input')?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  document.getElementById('image-upload-input')?.click();
                }
              }}
              aria-label="Upload a picture or drag one here"
            >
              <input
                type="file"
                id="image-upload-input"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
              />
              {previewUrl ? (
                <div className="upload-preview-wrap">
                  <div className={`preview-media-box ${isAnalyzing ? 'is-scanning' : ''}`}>
                    <img src={previewUrl} alt="Target Media Preview" className="upload-preview-img" />
                    {isAnalyzing && (
                      <div className="scan-overlay" aria-hidden="true">
                        <div className="scan-3d-grid" />
                        <div className="scan-laser-beam" />
                        <svg className="scan-biometric-mesh" viewBox="0 0 240 240" fill="none">
                          <polygon points="120,38 152,54 174,96 168,162 120,204 72,162 66,96 88,54" stroke="#10b981" strokeOpacity="0.4" strokeWidth="1.2" strokeDasharray="3 3" />
                          <polygon points="120,70 142,86 152,116 142,154 120,172 98,154 88,116 98,86" stroke="#10b981" strokeOpacity="0.6" strokeWidth="1" />
                          <line x1="102" y1="104" x2="138" y2="104" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.7" />
                          <line x1="120" y1="104" x2="120" y2="134" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.7" />
                          <line x1="106" y1="154" x2="134" y2="154" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.7" />
                          <circle cx="120" cy="38" r="3" fill="#10b981" />
                          <circle cx="152" cy="54" r="2.5" fill="#10b981" />
                          <circle cx="174" cy="96" r="3" fill="#10b981" />
                          <circle cx="168" cy="162" r="2.5" fill="#10b981" />
                          <circle cx="120" cy="204" r="3.5" fill="#34d399" />
                          <circle cx="72" cy="162" r="2.5" fill="#10b981" />
                          <circle cx="66" cy="96" r="3" fill="#10b981" />
                          <circle cx="88" cy="54" r="2.5" fill="#10b981" />
                          <circle cx="102" cy="104" r="3.5" fill="#34d399" />
                          <circle cx="138" cy="104" r="3.5" fill="#34d399" />
                          <circle cx="120" cy="134" r="3" fill="#10b981" />
                          <circle cx="106" cy="154" r="2.5" fill="#10b981" />
                          <circle cx="134" cy="154" r="2.5" fill="#10b981" />
                        </svg>
                        <div className="scan-hud-corners">
                          <span className="hud-corner hud-tl" />
                          <span className="hud-corner hud-tr" />
                          <span className="hud-corner hud-bl" />
                          <span className="hud-corner hud-br" />
                        </div>
                        <div className="scan-hud-badge">
                          <span className="hud-live-dot" />
                          <span className="hud-text">3D NEURAL MESH SCAN</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="upload-file-meta">
                    <span className="upload-file-name">{selectedFile?.name || 'sample_forensic_frame.png'}</span>
                    <span className="upload-file-size">{((selectedFile?.size || 1411186) / (1024 * 1024)).toFixed(2)} MB</span>
                    <button
                      type="button"
                      className="upload-remove-btn"
                      onClick={handleRemoveFile}
                      aria-label="Remove uploaded image"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="upload-empty-state">
                  <div className="folder-3d-wrap">
                    <svg className="folder-3d-svg" width="96" height="84" viewBox="0 0 96 84" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <ellipse cx="48" cy="76" rx="36" ry="6" fill="black" fillOpacity="0.08" />
                      <path d="M12 24C12 20.6863 14.6863 18 18 18H36.8284C38.42 18 39.9464 18.6321 41.0711 19.7574L45.2426 23.9289C46.3679 25.0536 47.8943 25.6857 49.4853 25.6857H78C81.3137 25.6857 84 28.372 84 31.6857V64C84 67.3137 81.3137 70 78 70H18C14.6863 70 12 67.3137 12 64V24Z" fill="url(#folder_back)" />
                      <rect x="22" y="14" width="52" height="40" rx="6" fill="url(#sheet_grad)" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.5" />
                      <line x1="30" y1="24" x2="54" y2="24" stroke="#d4d4d8" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="30" y1="31" x2="66" y2="31" stroke="#e4e4e7" strokeWidth="2" strokeLinecap="round" />
                      <line x1="30" y1="37" x2="48" y2="37" stroke="#e4e4e7" strokeWidth="2" strokeLinecap="round" />
                      <path d="M8 38C8 34.6863 10.6863 32 14 32H82C85.3137 32 88 34.6863 88 38V66C88 69.3137 85.3137 72 82 72H14C10.6863 72 8 69.3137 8 66V38Z" fill="url(#folder_front)" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1" />
                      <path d="M9 34H87" stroke="url(#sheen_grad)" strokeWidth="1.5" strokeLinecap="round" />
                      <defs>
                        <linearGradient id="folder_back" x1="12" y1="18" x2="84" y2="70" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#27272a" />
                          <stop offset="1" stopColor="#09090b" />
                        </linearGradient>
                        <linearGradient id="sheet_grad" x1="22" y1="14" x2="74" y2="54" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#ffffff" />
                          <stop offset="1" stopColor="#f4f4f5" />
                        </linearGradient>
                        <linearGradient id="folder_front" x1="8" y1="32" x2="88" y2="72" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#3f3f46" />
                          <stop offset="0.4" stopColor="#27272a" />
                          <stop offset="1" stopColor="#18181b" />
                        </linearGradient>
                        <linearGradient id="sheen_grad" x1="9" y1="34" x2="87" y2="34" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#ffffff" stopOpacity="0.4" />
                          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.8" />
                          <stop offset="1" stopColor="#ffffff" stopOpacity="0.1" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="upload-prompt-text">
                    <span className="upload-title">Upload a picture, or drag one here</span>
                    <span className="upload-subtitle">Supports JPEG, PNG, or WEBP</span>
                  </div>
                </div>
              )}
            </div>
            <div className="upload-actions">
              <button
                type="button"
                className={`btn-run-analysis ${isAnalyzing ? 'btn-analyzing' : ''}`}
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <span className="analysis-progress-val">{progress}%</span>
                ) : showScorecard ? (
                  'Re-run Analysis'
                ) : (
                  'Run Analysis'
                )}
              </button>
            </div>
            {showScorecard && (
              <div className="scorecard-container" id="forensic-scorecard">
                <div className="scorecard-header">
                  <div className="scorecard-header-left">
                    <span className="scorecard-badge">Forensic Verification Report</span>
                    <h2 className="scorecard-title">Neural Media Diagnostic Scorecard</h2>
                    <p className="scorecard-subtitle">Media benchmarked across multi-layer convolutional &amp; frequency classification models</p>
                  </div>
                  <div className="scorecard-verdict-box">
                    <span className="verdict-label">Aggregate Verdict</span>
                    <span className="verdict-val verdict-danger">Synthetic Artifacts Detected</span>
                  </div>
                </div>
                <div className="scorecard-grid">
                  {forensicMetrics.map((metric) => {
                    const theme = getMetricStyle(metric.value);
                    const circumference = 238.76;
                    const strokeOffset = circumference - (circumference * metric.value) / 100;
                    return (
                      <div key={metric.id} className="scorecard-card">
                        <div className="gauge-wrap">
                          <svg className="gauge-svg" width="96" height="96" viewBox="0 0 96 96">
                            <circle
                              className="gauge-track"
                              cx="48"
                              cy="48"
                              r="38"
                              fill="none"
                              strokeWidth="7"
                            />
                            <circle
                              className="gauge-progress-bar"
                              cx="48"
                              cy="48"
                              r="38"
                              fill="none"
                              strokeWidth="7"
                              stroke={theme.color}
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeOffset}
                              strokeLinecap="round"
                              transform="rotate(-90 48 48)"
                            />
                            <text
                              x="48"
                              y="53"
                              textAnchor="middle"
                              className="gauge-val-text"
                            >
                              {metric.value}%
                            </text>
                          </svg>
                        </div>
                        <div className="metric-details">
                          <span className="metric-name">{metric.name}</span>
                          <span
                            className="metric-status-pill"
                            style={{
                              color: theme.color,
                              backgroundColor: theme.bg,
                              borderColor: theme.border
                            }}
                          >
                            {theme.status}
                          </span>
                          <span className="metric-desc">{metric.description}</span>
                          <span className="metric-benchmark">{metric.benchmark}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
        <section className="trust-explore-section" id="capabilities">
          <div className="trust-explore-container">
            <div className="trust-explore-grid">
              <div className="feature-trust-card explore-card">
                <div className="card-top-header">
                  <span className="card-kicker-badge">Extended Forensic Suite</span>
                  <h3 className="card-kicker-title">Explore More From Us</h3>
                  <p className="card-kicker-desc">
                    Unlock comprehensive multi-modal forensic inspection and cryptographically verifiable audit reports for sensitive media.
                  </p>
                </div>
                <div className="feature-list">
                  <div className="feature-item">
                    <div className="feature-icon-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="m9 8 6 4-6 4Z" />
                      </svg>
                    </div>
                    <div className="feature-text">
                      <span className="feature-title">Video Analysis</span>
                      <p className="feature-desc">Frame-by-frame temporal verification scanning across video streams to detect facial flicker and inter-frame warping.</p>
                    </div>
                  </div>
                  <div className="feature-item">
                    <div className="feature-icon-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <path d="M12 18v-6" />
                        <path d="m9 15 3 3 3-3" />
                      </svg>
                    </div>
                    <div className="feature-text">
                      <span className="feature-title">Download Audit Report</span>
                      <p className="feature-desc">Export certified diagnostic PDF and JSON reports with layer activations, confidence distributions, and media hashes.</p>
                    </div>
                  </div>
                  <div className="feature-item">
                    <div className="feature-icon-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                        <polyline points="2 17 12 22 22 17" />
                        <polyline points="2 12 12 17 22 12" />
                      </svg>
                    </div>
                    <div className="feature-text">
                      <span className="feature-title">Deep Multi-Layer Scans</span>
                      <p className="feature-desc">Run extended scans on images, including high-frequency 2D Fourier spectrograms, blending contours, and 3D facial mesh analysis.</p>
                    </div>
                  </div>
                </div>
                <div className="card-footer-action">
                  <span className="action-hint">Log in to unlock these extended features and run high-depth scans.</span>
                  <Link href="#login" className="btn-explore-login">
                    <span>Log In to Try Features</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
              <div className="feature-trust-card trust-card">
                <div className="card-top-header">
                  <span className="card-kicker-badge badge-emerald">Privacy &amp; Data Integrity</span>
                  <h3 className="card-kicker-title">No Media Leaves Your Device</h3>
                  <p className="card-kicker-desc">
                    Engineered with strict zero-retention architecture. Your images and personal biometric data never touch external infrastructure.
                  </p>
                </div>
                <div className="feature-list">
                  <div className="feature-item">
                    <div className="feature-icon-box icon-emerald">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="16" height="16" x="4" y="4" rx="2" />
                        <rect width="6" height="6" x="9" y="9" rx="1" />
                        <path d="M15 2v2" />
                        <path d="M15 20v2" />
                        <path d="M2 15h2" />
                        <path d="M2 9h2" />
                        <path d="M20 15h2" />
                        <path d="M20 9h2" />
                        <path d="M9 2v2" />
                        <path d="M9 20v2" />
                      </svg>
                    </div>
                    <div className="feature-text">
                      <span className="feature-title">100% On-Edge Implementation</span>
                      <p className="feature-desc">All deep learning models, binary classification networks, and landmark estimators execute locally inside your browser via WebGL and WebAssembly.</p>
                    </div>
                  </div>
                  <div className="feature-item">
                    <div className="feature-icon-box icon-emerald">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <ellipse cx="12" cy="5" rx="9" ry="3" />
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                        <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
                        <line x1="2" y1="2" x2="22" y2="22" stroke="#ef4444" strokeWidth="2.5" />
                      </svg>
                    </div>
                    <div className="feature-text">
                      <span className="feature-title">No Database to Store Your Data</span>
                      <p className="feature-desc">Zero persistence infrastructure. There are no databases, external buckets, or cloud servers storing, indexing, or harvesting your uploads.</p>
                    </div>
                  </div>
                  <div className="feature-item">
                    <div className="feature-icon-box icon-emerald">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </div>
                    <div className="feature-text">
                      <span className="feature-title">Ephemeral Memory Sandboxing</span>
                      <p className="feature-desc">Media buffers exist only in volatile client-side memory while the forensic scan runs and are immediately evicted upon session completion.</p>
                    </div>
                  </div>
                </div>
                <div className="trust-cert-strip">
                  <div className="trust-cert-item">
                    <span className="cert-check">✓</span>
                    <span>100% Client-Side Inference</span>
                  </div>
                  <div className="trust-cert-item">
                    <span className="cert-check">✓</span>
                    <span>Zero Data Storage</span>
                  </div>
                  <div className="trust-cert-item">
                    <span className="cert-check">✓</span>
                    <span>No Media Uploads</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="team-section" id="mnm">
          <div className="team-box">
            <div className="team-box-header">
              <div className="mnm-brand-wrap">
                <img src="/assets/mnm-logo.png" alt="MnM Developers Logo" className="mnm-logo-img" />
                <div className="mnm-text-group">
                  <span className="team-main-title">MnM Developers</span>
                </div>
              </div>
              <span className="team-unit-badge">8 Members</span>
            </div>
            <div className="team-members-container">
              <div className="team-grid">
                {teamMembers.map((member) => (
                  <div key={member.name} className="team-member-card">
                    <div className="member-avatar-wrap">
                      <img src={member.img} alt={member.name} className="member-avatar-img" />
                    </div>
                    <div className="member-info">
                      <span className="member-name">{member.name}</span>
                      <span className="member-role">{member.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <section className="sr-only" aria-label="Deepfake Detection Technical Specifications, FAQ and Documentation">
        <h2>Parakh Deepfake &amp; Synthetic Media Detection System</h2>
        <p>
          Parakh is an advanced artificial intelligence platform developed under the Pixpect brand by MnM Developers, engineered to detect deepfake images, manipulated facial videos, and synthetic generative media. Operating with a high-accuracy binary classification model trained and benchmarked against FaceForensics++, Parakh identifies subtle pixel distortions, frequency-domain anomalies, and facial boundary artifacts.
        </p>
        <h3>Core Detection Methodologies</h3>
        <ul>
          <li><strong>Image Binary Classification:</strong> Evaluates single-frame facial media with high-precision confidence scoring and spatial anomaly detection.</li>
          <li><strong>Temporal Video Aggregation:</strong> Sequentially extracts and processes MP4 video frames to detect temporal flicker, inconsistent blinking, and frame-to-frame manipulation segments.</li>
          <li><strong>Spatial Attention Heatmaps:</strong> Visualizes the exact regions influencing model predictions through gradient-weighted class activation mapping.</li>
          <li><strong>Robustness &amp; Degradation Testing:</strong> Validated against heavy JPEG compression, Gaussian blur, and video re-encoding artifacts.</li>
        </ul>
        <h3>Benchmarked Facial Forgery Techniques</h3>
        <dl>
          <dt>Deepfakes</dt>
          <dd>Autoencoder-based facial replacements and neural synthesis.</dd>
          <dt>Face2Face</dt>
          <dd>Real-time facial reenactment and expression transfer.</dd>
          <dt>FaceSwap</dt>
          <dd>Graphics-based 3D face swapping and blending pipelines.</dd>
          <dt>NeuralTextures</dt>
          <dd>Neural rendering manipulation altering facial expressions and mouth movements.</dd>
        </dl>
        <h3>Frequently Asked Questions</h3>
        <dl>
          <dt>What is Parakh?</dt>
          <dd>Parakh is a specialized deepfake detection and synthetic media verification system designed to protect visual integrity online.</dd>
          <dt>What are the official domains for the project?</dt>
          <dd>The project domains are parakh.xyz and pixpect.xyz.</dd>
          <dt>Who is developing the Parakh platform?</dt>
          <dd>Parakh is engineered by MnM Developers: Aditya Verma (AI/ML &amp; Backend), Charvi Goyal (Data Science &amp; Database), Agrima Tripathi (Technical Writer), Anurag Verma (Frontend Developer), Nishu Kumari (Frontend Developer), Shivang Saxena (Backend &amp; Auth), Tanu Thakur (Backend, Database &amp; Auth), and Yash Gupta (Frontend Developer).</dd>
        </dl>
      </section>
    </div>
  );
}
