import jsPDF from 'jspdf';
import { EnergyHistoryEntry } from '../types';
import { getEnergyHistory } from './patientContextStorage';

// Brand colours from index.css / BrandLockup.tsx
const COLORS = {
  primary: '#52796f',    // green — headers, section dividers
  accent: '#c8e44a',     // lime — highlights, zone indicators
  tertiary: '#4a6fa5',   // blue — chart accents
  bg: '#faf7f2',         // page background
  nav: '#1a2821',        // dark — footer, strong text
  surface: '#ffffff',    // card backgrounds
  text: '#1c1c1e',       // body text
  textMuted: '#6b7280',  // secondary text
  white: '#ffffff',
  black: '#000000',
} as const;

// Zone colours matching EnergyBank getZoneToneClasses
const ZONE_COLORS: Record<string, string> = {
  Green: '#10b981',
  Yellow: '#f59e0b',
  Red: '#f43f4e',
};

const getZoneLabel = (score: number): string => {
  if (score >= 7) return 'Red';
  if (score >= 4) return 'Yellow';
  return 'Green';
};

const getZoneDisplayLabel = (score: number): string => {
  if (score >= 7) return '🔴 Red — High fatigue';
  if (score >= 4) return '🟡 Yellow — Treatment / moderate fatigue';
  return '🟢 Green — Stable';
};

const formatDate = (isoDate: string) =>
  new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate));

const formatShortDate = (isoDate: string) =>
  new Intl.DateTimeFormat('en-AU', { month: 'short', day: 'numeric' }).format(new Date(isoDate));

const pad = (mm: number) => Math.max(0.3, mm);

export const generateCaregiverPdf = (currentFatigueScore: number | null): void => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ── Background fill ──
  doc.setFillColor(COLORS.bg);
  doc.rect(0, 0, pageW, pageH, 'F');

  // ── Header brand bar ──
  doc.setFillColor(COLORS.nav);
  doc.rect(0, 0, pageW, pad(8), 'F');

  // Brand mark: simplified — three small circles arranged in a triangle + centre dot
  const brandCX = margin + 4;
  const brandCY = 4.5;
  const dotR = 0.8;
  const spread = 1.8;
  // Top circle — lime
  doc.setFillColor(COLORS.accent);
  doc.circle(brandCX, brandCY - spread, dotR, 'F');
  // Bottom-left — green
  doc.setFillColor(COLORS.primary);
  doc.circle(brandCX - spread * 0.85, brandCY + spread * 0.5, dotR, 'F');
  // Bottom-right — blue
  doc.setFillColor(COLORS.tertiary);
  doc.circle(brandCX + spread * 0.85, brandCY + spread * 0.5, dotR, 'F');
  // Centre dot
  doc.setFillColor(COLORS.white);
  doc.circle(brandCX, brandCY, 0.6, 'F');

  // Brand text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.white);
  doc.text('FIT FOR CANCER', margin + 10, 5.8);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor('#c8e44a');
  doc.text('Caregiver Summary', margin + 10, pad(8.5));

  y = pad(13);

  // ── Generation date ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.textMuted);
  doc.text(
    `Generated ${new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date())}`,
    margin,
    y,
  );
  y += pad(5);

  // ── Divider ──
  doc.setDrawColor(COLORS.primary);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += pad(4);

  // ── Section: Energy Overview ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.primary);
  doc.text('Patient Energy Overview', margin, y);
  y += pad(4);

  const history = getEnergyHistory();
  const recentEntries = history.slice(-7);
  const avgScore = recentEntries.length > 0
    ? Math.round(recentEntries.reduce((a, b) => a + b.score, 0) / recentEntries.length * 10) / 10
    : null;

  // Current zone badge
  if (currentFatigueScore !== null) {
    const zoneLabel = getZoneLabel(currentFatigueScore);
    const zoneColor = ZONE_COLORS[zoneLabel];
    doc.setFillColor(zoneColor);
    doc.roundedRect(margin, y - 2, pad(20), pad(6), 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.white);
    doc.text(getZoneDisplayLabel(currentFatigueScore), margin + 2, y + 1.5);
    y += pad(8);
  }

  // Stats row
  doc.setFillColor(COLORS.surface);
  doc.roundedRect(margin, y - 2, contentW, pad(10), 1.5, 1.5, 'F');
  doc.setFillColor(COLORS.bg);
  doc.roundedRect(margin + 0.5, y - 1.5, contentW - 1, pad(9), 1, 1, 'F');

  const statX = margin;
  const statGap = contentW / 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(COLORS.text);
  doc.text(
    currentFatigueScore !== null ? `${currentFatigueScore}/10` : '—',
    statX + statGap * 0 + statGap / 2,
    y + 2,
    { align: 'center' },
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(COLORS.textMuted);
  doc.text('Current score', statX + statGap * 0 + statGap / 2, y + 5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(COLORS.text);
  doc.text(
    avgScore !== null ? `${avgScore}` : '—',
    statX + statGap * 1 + statGap / 2,
    y + 2,
    { align: 'center' },
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(COLORS.textMuted);
  doc.text('7‑day average', statX + statGap * 1 + statGap / 2, y + 5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(COLORS.text);
  doc.text(
    `${history.length}`,
    statX + statGap * 2 + statGap / 2,
    y + 2,
    { align: 'center' },
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(COLORS.textMuted);
  doc.text('Total check‑ins', statX + statGap * 2 + statGap / 2, y + 5, { align: 'center' });

  y += pad(14);

  // ── Section: Energy Trend ──
  if (history.length > 1) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.primary);
    doc.text('Energy Trend (last 14 days)', margin, y);
    y += pad(3);

    const trendData = history.slice(-14);
    const chartX = margin + pad(4);
    const chartW = contentW - pad(8);
    const chartH = pad(20);
    const chartY = y;

    // Chart background
    doc.setFillColor(COLORS.surface);
    doc.roundedRect(margin, chartY - 1, contentW, chartH + pad(6), 1.5, 1.5, 'F');

    // Y-axis labels
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(COLORS.textMuted);
    for (let i = 0; i <= 10; i += 2) {
      const labelY = chartY + chartH - (i / 10) * chartH;
      doc.text(`${i}`, margin + 2, labelY + 1);
      // Grid line
      doc.setDrawColor('#e5e7eb');
      doc.setLineWidth(0.15);
      doc.line(chartX, labelY, chartX + chartW, labelY);
    }

    // Plot line
    const pointGap = chartW / (trendData.length - 1 || 1);
    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(0.6);

    const points: { x: number; y: number }[] = trendData.map((entry, idx) => ({
      x: chartX + idx * pointGap,
      y: chartY + chartH - (entry.score / 10) * chartH,
    }));

    // Draw line segments
    for (let i = 0; i < points.length - 1; i++) {
      doc.line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
    }

    // Draw dots
    points.forEach((pt, idx) => {
      const zone = getZoneLabel(trendData[idx].score);
      doc.setFillColor(ZONE_COLORS[zone]);
      doc.circle(pt.x, pt.y, 1, 'F');
    });

    // X-axis date labels (show every ~3rd)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(COLORS.textMuted);
    trendData.forEach((entry, idx) => {
      if (idx % Math.max(1, Math.floor(trendData.length / 5)) === 0 || idx === trendData.length - 1) {
        doc.text(
          formatShortDate(entry.date),
          chartX + idx * pointGap,
          chartY + chartH + 3,
          { align: 'center' },
        );
      }
    });

    y += chartH + pad(10);
  }

  // ── Section: Recent Activity ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.primary);
  doc.text('Recent Check‑ins', margin, y);
  y += pad(3);

  const lastFive = history.slice(-5).reverse();
  if (lastFive.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.textMuted);
    doc.text('No check‑ins recorded yet.', margin, y);
    y += pad(5);
  } else {
    // Table header
    doc.setFillColor(COLORS.primary);
    doc.roundedRect(margin, y - 1.5, contentW, pad(4.5), 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(COLORS.white);
    doc.text('Date', margin + 2, y + 0.5);
    doc.text('Score', margin + pad(22), y + 0.5);
    doc.text('Zone', margin + pad(35), y + 0.5);
    doc.text('Note', margin + pad(52), y + 0.5);
    y += pad(5);

    lastFive.forEach((entry, idx) => {
      const zoneLabel = getZoneLabel(entry.score);
      const zoneColor = ZONE_COLORS[zoneLabel];

      if (idx % 2 === 0) {
        doc.setFillColor(COLORS.bg);
        doc.rect(margin, y - 1.5, contentW, pad(4.5), 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(COLORS.text);
      doc.text(formatDate(entry.date), margin + 2, y + 0.5);
      doc.text(`${entry.score}/10`, margin + pad(22), y + 0.5);

      // Zone dot
      doc.setFillColor(zoneColor);
      doc.circle(margin + pad(33), y, 1, 'F');
      doc.setTextColor(COLORS.text);
      doc.text(zoneLabel, margin + pad(35), y + 0.5);

      // Truncate note
      const note = entry.note.length > 35 ? entry.note.slice(0, 35) + '…' : entry.note;
      doc.text(note || '—', margin + pad(52), y + 0.5);

      y += pad(5);
    });
    y += pad(3);
  }

  // ── Section: Key Recommendations ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.primary);
  doc.text('Key Recommendations', margin, y);
  y += pad(3);

  const currentZone = currentFatigueScore !== null ? getZoneLabel(currentFatigueScore) : 'Green';
  const recommendations = getRecommendationsForZone(currentZone);

  recommendations.forEach((rec) => {
    // Check page overflow
    if (y > pageH - pad(25)) {
      doc.addPage();
      y = margin;
    }

    doc.setFillColor(COLORS.surface);
    doc.roundedRect(margin, y - 1.5, contentW, pad(8), 1, 1, 'F');

    // Category badge
    doc.setFillColor(COLORS.tertiary);
    doc.roundedRect(margin + 1, y - 0.5, pad(14), pad(3.5), 0.8, 0.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(COLORS.white);
    doc.text(rec.category, margin + 2, y + 1.2);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.text);
    doc.text(rec.title, margin + pad(16), y + 0.5);

    // Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(COLORS.textMuted);
    const descLines = doc.splitTextToSize(rec.description, contentW - pad(4));
    doc.text(descLines, margin + 2, y + pad(4));

    y += pad(10);
  });

  y += pad(3);

  // ── Footer ──
  if (y > pageH - pad(18)) {
    doc.addPage();
    y = margin;
  }

  doc.setDrawColor(COLORS.primary);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += pad(3);

  // Clinical disclaimer
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(COLORS.textMuted);
  doc.text('Clinical Disclaimer', margin, y);
  y += pad(2.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(COLORS.textMuted);
  const disclaimer = 'This summary is generated from patient‑reported data and is intended for informational purposes only. It does not constitute medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical decisions. Fit For Cancer is a companion tool, not a medical device.';
  const discLines = doc.splitTextToSize(disclaimer, contentW);
  doc.text(discLines, margin, y);
  y += pad(discLines.length * 2 + 2);

  // App branding footer
  doc.setFillColor(COLORS.nav);
  doc.rect(0, pageH - pad(8), pageW, pad(8), 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(COLORS.white);
  doc.text('Fit For Cancer', margin, pageH - pad(4));
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(COLORS.accent);
  doc.text('fitforcancer.vercel.app', margin, pageH - pad(2));
  doc.setTextColor(COLORS.textMuted);
  doc.text(
    `Generated ${new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}`,
    pageW - margin,
    pageH - pad(3),
    { align: 'right' },
  );

  // ── Save ──
  const filename = `FitForCancer_CaregiverSummary_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};

interface Recommendation {
  category: string;
  title: string;
  description: string;
}

const getRecommendationsForZone = (zone: string): Recommendation[] => {
  if (zone === 'Red') {
    return [
      {
        category: 'Exercise',
        title: 'Gentle movement only',
        description: 'Focus on breathing exercises, gentle stretching, and short walks as tolerated. Rest is important — listen to your body.',
      },
      {
        category: 'Exercise',
        title: 'Seated exercises',
        description: 'Seated leg raises, wall push‑ups, and pelvic tilts can maintain mobility without overexertion.',
      },
      {
        category: 'Nutrition',
        title: 'Small, frequent meals',
        description: 'Try easy‑to‑digest options like ginger & turmeric broth, protein‑packed smoothies, or fortified milky drinks. Anti‑nausea foods may help.',
      },
    ];
  }

  if (zone === 'Yellow') {
    return [
      {
        category: 'Exercise',
        title: 'Moderate activity',
        description: 'Brisk walking, chair squats, and bicep curls at low intensity. Aim for 10–15 minute sessions with rest breaks.',
      },
      {
        category: 'Exercise',
        title: 'Stay consistent',
        description: 'Regular gentle movement helps manage treatment side effects. Even light activity on tough days is beneficial.',
      },
      {
        category: 'Nutrition',
        title: 'High‑protein focus',
        description: 'Protein‑packed berry smoothies, poached chicken with steamed greens, and red lentil dahl support recovery and muscle maintenance.',
      },
    ];
  }

  // Green (stable)
  return [
    {
      category: 'Exercise',
      title: 'Maintain routine',
      description: 'Continue with brisk walking, strength exercises, and flexibility work. Aim for 20–30 minutes of moderate activity most days.',
    },
    {
      category: 'Exercise',
      title: 'Build strength',
      description: 'Bicep curls, chair squats, and wall push‑ups help maintain muscle mass during treatment.',
    },
    {
      category: 'Nutrition',
      title: 'Balanced nutrition',
      description: 'Focus on high‑protein meals, anti‑inflammatory foods (ginger, turmeric), and staying hydrated. Variety supports overall wellbeing.',
    },
  ];
};
