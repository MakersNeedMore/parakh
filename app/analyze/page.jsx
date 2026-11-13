'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { runStep1Provenance } from '../../lib/forensics/runStep1';
import { isLoggedIn, savePendingReport, takePendingReport } from '../../lib/auth';
import { downloadReportPdf } from '../../lib/pdfReport';
import './analyze.css';

// Small JPEG copy of the uploaded image, used inside the PDF (and kept while the user logs in).
async function makeThumbnail(file) {
  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, 640 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    return c.toDataURL('image/jpeg', 0.8);
  } catch {
    return null;
  }
}

export default function AnalyzePage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showScorecard, setShowScorecard] = useState(false);
  const [report, setReport] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [thumb, setThumb] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    const sync = () => setLoggedIn(isLoggedIn());
    sync();
    window.addEventListener('parakh-auth-change', sync);
    return () => window.removeEventListener('parakh-auth-change', sync);
  }, []);

  // Coming back from /login: restore the finished report and download it.
  useEffect(() => {
    const wantsDownload = new URLSearchParams(window.location.search).get('download') === '1';
    if (!wantsDownload) return;
    const pending = takePendingReport();
    window.history.replaceState(null, '', '/analyze');
    if (!pending?.report) return;
    setReport(pending.report);
    setThumb(pending.thumb || null);
    if (pending.thumb) setPreviewUrl(pending.thumb);
    setProgress(100);
    setShowScorecard(true);
    if (isLoggedIn()) {
      downloadReportPdf(pending.report, pending.thumb).catch(() =>
        setAnalysisError('Could not create the PDF. Please try again.')
      );
    }
  }, []);

  const handleDownloadReport = async () => {
    if (!report) return;
    if (!isLoggedIn()) {
      // Not logged in: keep the report, send the user to login, then come back and download.
      savePendingReport({ report, thumb });
      router.push('/login?next=' + encodeURIComponent('/analyze?download=1'));
      return;
    }
    setDownloading(true);
    try {
      await downloadReportPdf(report, thumb);
    } catch (err) {
      setAnalysisError('Could not create the PDF: ' + String(err?.message || err));
    } finally {
      setDownloading(false);
    }
  };
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setShowScorecard(false);
      setReport(null);
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
      setReport(null);
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
    setThumb(null);
    setShowScorecard(false);
    setReport(null);
    setProgress(0);
  };
  const handleRunAnalysis = async () => {
    let file = selectedFile;
    if (!previewUrl) {
      setPreviewUrl('/landing page.png');
      file = null;
    }
    if (file && typeof file.arrayBuffer !== 'function') file = null;
    setShowScorecard(false);
    setReport(null);
    setAnalysisError(null);
    setProgress(2);
    setIsAnalyzing(true);
    try {
      if (!file) {
        const res = await fetch(previewUrl && previewUrl.startsWith('data:') ? previewUrl : '/landing page.png');
        const blob = await res.blob();
        file = new File([blob], 'sample_forensic_frame_01.png', { type: blob.type || 'image/png' });
      }
      const r = await runStep1Provenance(file, (p) => setProgress(p));
      setThumb(await makeThumbnail(file));
      setReport(r);
      setProgress(100);
      setTimeout(() => { setIsAnalyzing(false); setShowScorecard(true); }, 320);
    } catch (err) {
      setIsAnalyzing(false);
      setAnalysisError('Analysis failed: ' + String(err?.message || err));
    }
  };
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
  return (
    <div className="app-container">
      <Navbar />
      <main className="analyze-main">
        <div className="analyze-header">
          <span className="analyze-kicker">Image analysis</span>
          <h1 className="analyze-title">Check an image for deepfakes</h1>
          <p className="analyze-sub">Upload a picture, run the analysis, then download the report as a PDF.</p>
        </div>
        <section className="upload-section analyze-section" id="services">
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
                    <span className="upload-file-name">{selectedFile?.name || report?.file?.name || 'sample_forensic_frame.png'}</span>
                    <span className="upload-file-size">{((selectedFile?.size || report?.file?.size || 1411186) / (1024 * 1024)).toFixed(2)} MB</span>
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
            {analysisError && (
              <div className="scorecard-container" role="alert">
                <p className="scorecard-subtitle">{analysisError}</p>
              </div>
            )}
            {showScorecard && report && (
              <div className="scorecard-container" id="forensic-scorecard">
                <div className="scorecard-header">
                  <div className="scorecard-header-left">
                    <span className="scorecard-badge">Forensic Verification Report · Steps 1–2 Provenance + AI-Generated Detection</span>
                    <h2 className="scorecard-title">{report.overall.label}</h2>
                    <p className="scorecard-subtitle">{report.overall.note}</p>
                  </div>
                  <div className="scorecard-verdict-box">
                    <span className="verdict-label">File</span>
                    <span className="verdict-val verdict-neutral">{report.file.name}</span>
                  </div>
                </div>
                <div className="scorecard-grid">
                  {report.engines.map((eng) => {
                    const val = eng.score == null ? 0 : eng.score;
                    const theme = getMetricStyle(eng.status === 'informational' ? 50 : val);
                    const circumference = 238.76;
                    const strokeOffset = circumference - (circumference * val) / 100;
                    return (
                      <div key={eng.id} className="scorecard-card">
                        <div className="gauge-wrap">
                          <svg className="gauge-svg" width="96" height="96" viewBox="0 0 96 96">
                            <circle className="gauge-track" cx="48" cy="48" r="38" fill="none" strokeWidth="7" />
                            <circle className="gauge-progress-bar" cx="48" cy="48" r="38" fill="none" strokeWidth="7" stroke={theme.color} strokeDasharray={circumference} strokeDashoffset={strokeOffset} strokeLinecap="round" transform="rotate(-90 48 48)" />
                            <text x="48" y="53" textAnchor="middle" className="gauge-val-text">
                              {eng.score == null ? '—' : `${eng.score}%`}
                            </text>
                          </svg>
                        </div>
                        <div className="metric-details">
                          <span className="metric-name">{eng.name}</span>
                          <span className="metric-status-pill" style={{ color: theme.color, backgroundColor: theme.bg, borderColor: theme.border }}>
                            {eng.status}
                          </span>
                          {eng.details.slice(0, 4).map((d, i) => (
                            <span key={i} className="metric-desc">{d}</span>
                          ))}
                          <span className="metric-benchmark">{eng.version} · {eng.runtimeMs} ms</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="scorecard-subtitle" style={{ marginTop: 16 }}>
                  Runs on-device (edge) · {report.timing.totalMs} ms · No single averaged fake probability — each engine stands alone.
                   
                </p>
                <div className="report-download-row">
                  <button
                    type="button"
                    className="btn-download-report"
                    onClick={handleDownloadReport}
                    disabled={downloading}
                  >
                    {downloading ? 'Preparing PDF…' : 'Download PDF report'}
                  </button>
                  <span className="report-download-hint">
                    {loggedIn ? 'Includes the Parakh logo and watermark.' : 'Log in required to download the report.'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}