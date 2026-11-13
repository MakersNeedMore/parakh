// Builds and downloads the Parakh forensic report as a PDF (client-side, jsPDF).
// Install once:  npm install jspdf

const LOGO_URL = '/assets/brand-logo.png';          // header logo
const WATERMARK_URL = '/assets/parakh-logo.png';    // faint page watermark (skipped if it fails to load)

function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve({ data: c.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function downloadReportPdf(report, thumbDataUrl) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const M = 16;
  const CW = PW - M * 2;
  let y = M;

  const [logo, watermark] = await Promise.all([loadImage(LOGO_URL), loadImage(WATERMARK_URL)]);

  const ensure = (need) => {
    if (y + need > PH - 18) {
      doc.addPage();
      y = M;
    }
  };
  const text = (str, x, size, style = 'normal', color = [9, 9, 11]) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.text(str, x, y);
  };
  const para = (str, x, width, size, color = [82, 82, 91], lh = 4.6) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(str), width);
    lines.forEach((ln) => {
      ensure(lh);
      doc.text(ln, x, y);
      y += lh;
    });
  };

  // ---- Header ----
  if (logo) {
    const lh = 12;
    doc.addImage(logo.data, 'PNG', M, y, (logo.w / logo.h) * lh, lh);
  } else {
    text('PARAKH', M, 18, 'bold');
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(113, 113, 122);
  doc.text(new Date().toLocaleString(), PW - M, y + 5, { align: 'right' });
  y += 20;
  text('Forensic Verification Report', M, 18, 'bold');
  y += 3;
  doc.setDrawColor(228, 228, 231);
  doc.line(M, y, PW - M, y);
  y += 8;

  // ---- File info (+ thumbnail) ----
  const thumbW = 44;
  const startY = y;
  const infoW = thumbDataUrl ? CW - thumbW - 6 : CW;
  const rows = [
    ['File', report.file?.name || '-'],
    ['Size', report.file?.size != null ? `${(report.file.size / (1024 * 1024)).toFixed(2)} MB` : '-'],
    ['Type', report.file?.type || '-'],
    ['Analysis time', report.timing?.totalMs != null ? `${report.timing.totalMs} ms` : '-'],
  ];
  rows.forEach(([k, v]) => {
    text(k, M, 9, 'bold', [113, 113, 122]);
    const lines = doc.splitTextToSize(String(v), infoW - 32);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(9, 9, 11);
    doc.text(lines, M + 32, y);
    y += Math.max(6, lines.length * 4.6);
  });
  if (thumbDataUrl) {
    try {
      const props = doc.getImageProperties(thumbDataUrl);
      const th = Math.min(46, (props.height / props.width) * thumbW);
      doc.addImage(thumbDataUrl, 'JPEG', PW - M - thumbW, startY, thumbW, th);
      y = Math.max(y, startY + th);
    } catch {}
  }
  y += 6;

  // ---- Overall verdict ----
  const overall = report.overall || {};
  const tones = { danger: [239, 68, 68], warn: [245, 158, 11], success: [16, 185, 129], neutral: [113, 113, 122] };
  const tone = tones[overall.tone] || tones.neutral;
  const noteLines = doc.splitTextToSize(String(overall.note || ''), CW - 10);
  const boxH = 14 + noteLines.length * 4.6;
  ensure(boxH + 4);
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(...tone);
  doc.roundedRect(M, y, CW, boxH, 2, 2, 'FD');
  doc.setFillColor(...tone);
  doc.rect(M, y, 2, boxH, 'F');
  y += 7;
  text(String(overall.label || 'Result'), M + 6, 12, 'bold');
  y += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(82, 82, 91);
  doc.text(noteLines, M + 6, y);
  y += noteLines.length * 4.6 + 6;

  // ---- Engines ----
  ensure(12);
  text('Engine results', M, 13, 'bold');
  y += 7;
  (report.engines || []).forEach((eng) => {
    ensure(28);
    doc.setDrawColor(228, 228, 231);
    doc.line(M, y, PW - M, y);
    y += 6;
    text(String(eng.name || eng.id), M, 11, 'bold');
    const score = eng.score == null ? 'n/a' : `${eng.score}%`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(9, 9, 11);
    doc.text(`${String(eng.status)}  |  score: ${score}`, PW - M, y, { align: 'right' });
    y += 5;
    para(`${eng.version || ''} · ${eng.runtimeMs ?? 0} ms`, M, CW, 8.5, [113, 113, 122]);
    (eng.details || []).forEach((d) => para(`• ${d}`, M + 2, CW - 2, 9.5));
    if (eng.limitations?.length) {
      y += 1;
      eng.limitations.forEach((l) => para(`Limitation: ${l}`, M + 2, CW - 2, 8.5, [113, 113, 122]));
    }
    y += 4;
  });

  // ---- Disclaimer ----
  ensure(16);
  y += 2;
  para(
    'This report is produced by automated forensic models. Results are probabilistic and should be treated as one signal, not proof of authenticity or forgery.',
    M, CW, 8, [113, 113, 122], 4
  );

  // ---- Watermark + footer on every page ----
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    if (watermark) {
      const w = 130;
      const h = (watermark.h / watermark.w) * w;
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.06 }));
      doc.addImage(watermark.data, 'PNG', (PW - w) / 2, (PH - h) / 2, w, h);
      doc.restoreGraphicsState();
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(113, 113, 122);
    doc.text('Generated by Parakh · parakh.xyz', M, PH - 10);
    doc.text(`Page ${p} of ${total}`, PW - M, PH - 10, { align: 'right' });
  }

  const base = String(report.file?.name || 'report').replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '_');
  doc.save(`parakh-report-${base}.pdf`);
}