'use client';
import { useState } from 'react';
export default function Home() {
  const [toastText, setToastText] = useState('');
  const [showToast, setShowToast] = useState(false);
  const copyDomain = (domain) => {
    navigator.clipboard.writeText(domain).then(() => {
      triggerToast(domain + ' copied to clipboard');
    }).catch(() => {
      triggerToast(domain);
    });
  };
  const triggerToast = (text) => {
    setToastText(text);
    setShowToast(true);
    clearTimeout(window.__toastTimeout);
    window.__toastTimeout = setTimeout(() => {
      setShowToast(false);
    }, 2200);
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
      <header className="top-nav">
        <div className="pulse-badge">
          <svg className="pulse-svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle className="pulse-wave" cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"></circle>
            <circle className="pulse-dot" cx="12" cy="12" r="4.5" fill="currentColor"></circle>
          </svg>
          <span>Coming Soon</span>
        </div>
        <div className="domains-wrapper">
          <span className="domain-label">Reserved Domains</span>
          <span className="domain-item" onClick={() => copyDomain('parakh.xyz')} title="Click to copy domain">
            parakh.xyz
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </span>
          <span className="domain-bullet">•</span>
          <span className="domain-item" onClick={() => copyDomain('pixpect.xyz')} title="Click to copy domain">
            pixpect.xyz
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </span>
        </div>
      </header>
      <main className="main-viewport">
        <section className="project-column">
          <div className="logo-card">
            <img src="/assets/long logo darkkkk.png" alt="Pixpect Platform Logo" className="brand-hero-logo" />
          </div>
          <div className="overview-card">
            <div className="overview-top-bar">
              <span className="system-tag">Project Overview</span>
              <span className="benchmark-badge">Dataset: FaceForensics++</span>
            </div>
            <h1 className="project-headline">Deepfake Face Detection System</h1>
            <p className="project-desc">
              A specialized platform engineered to detect deep fake pictures, morphed images, and synthetic or AI-manipulated video frames. The system applies a binary classification model to distinguish between authentic and manipulated facial media. For video streams, it sequentially inspects frames, aggregates confidence scores, and highlights segments that appear suspicious.
            </p>
            <div className="specs-grid">
              <div className="spec-item">
                <div className="spec-title">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                  <span>Binary Classification</span>
                </div>
                <p className="spec-text">Distinguishes authentic from manipulated faces with confidence scoring.</p>
              </div>
              <div className="spec-item">
                <div className="spec-title">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg>
                  <span>Temporal Frame Aggregation</span>
                </div>
                <p className="spec-text">Sequentially parses MP4 frames to isolate high-risk video segments.</p>
              </div>
              <div className="spec-item">
                <div className="spec-title">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  <span>Attention Heatmaps</span>
                </div>
                <p className="spec-text">Visualises spatial facial regions influencing model predictions.</p>
              </div>
              <div className="spec-item">
                <div className="spec-title">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
                  <span>Robustness Evaluation</span>
                </div>
                <p className="spec-text">Resilience testing across JPEG compression and Gaussian blur.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="team-column">
          <div className="team-box">
            <div className="team-box-header">
              <div className="mnm-brand-wrap">
                <img src="/assets/mnm-logo.png" alt="MnM Developers" className="mnm-logo-img" />
                <div className="mnm-text-group">
                  <span className="team-main-title">Our Developers</span>
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
      <div className={`toast-msg ${showToast ? 'show' : ''}`}>{toastText}</div>
    </div>
  );
}
