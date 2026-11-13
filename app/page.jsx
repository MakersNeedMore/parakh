'use client';
import Link from 'next/link';
import SculptureHero from '../components/ui/liquid-sculpture-hero';
export default function Home() {
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
            { label: 'About', href: '/about' },
            { label: 'Analyse', href: '/analyze' },
            { label: 'Capabilities', href: '#capabilities' },
          ]}
          navCta={{ label: 'Log In', href: '/login' }}
          eyebrow="Forensic Neural Verification — MnM Developers"
          headline={"Detecting Synthetic Realities.\nRestoring Digital Trust."}
          headlineAccent="Restoring Digital Trust."
          body="Forensic-grade neural verification engineered to expose deepfakes and facial manipulation in real time — safeguarding visual authenticity."
          primaryCta={{ label: 'Run Analysis', href: '/analyze' }}
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
        <section className="how-section" id="how-it-works">
          <div className="how-container">
            <div className="how-head">
              <span className="card-kicker-badge">How it works</span>
              <h2 className="how-title">From upload to report in three steps</h2>
            </div>
            <div className="how-grid">
              <div className="how-card">
                <span className="how-num">01</span>
                <h3>Upload an image</h3>
                <p>Drop in a JPEG, PNG or WEBP picture you want to verify.</p>
              </div>
              <div className="how-card">
                <span className="how-num">02</span>
                <h3>Run the analysis</h3>
                <p>Our AI/ML models and provenance checks examine the image for signs of synthetic generation.</p>
              </div>
              <div className="how-card">
                <span className="how-num">03</span>
                <h3>Get your report</h3>
                <p>See the result with confidence scores, and download it as a PDF after logging in.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="how-section">
          <div className="how-container">
            <div className="cta-band">
              <div>
                <h2 className="how-title">Ready to check an image?</h2>
                <p className="cta-sub">It takes less than a minute.</p>
              </div>
              <Link href="/analyze" className="btn-explore-login"><span>Start Analysis</span></Link>
            </div>
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
                  <span className="action-hint">Log in to unlock these extended features and download PDF reports.</span>
                  <Link href="/login" className="btn-explore-login">
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
          <dd>Parakh is engineered by MnM Developers: Aditya Verma (AI/ML &amp; Backend), Charvi Goyal (Data Science &amp; Database), Agrima Tripathi (Technical Writer), Shivang Saxena (Backend &amp; Auth), Tanu Thakur (Backend, Database &amp; Auth), and Yash Gupta (Frontend Developer).</dd>
        </dl>
      </section>
    </div>
  );
}