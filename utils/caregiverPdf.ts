import jsPDF from 'jspdf';
import { EnergyHistoryEntry } from '../types';
import { getEnergyHistory } from './patientContextStorage';

const COLORS = {
  primary: '#52796f',
  accent: '#c8e44a',
  tertiary: '#4a6fa5',
  bg: '#faf7f2',
  nav: '#1a2821',
  surface: '#ffffff',
  text: '#1c1c1e',
  textMuted: '#6b7280',
  border: '#dbe2df',
  grid: '#e5e7eb',
  white: '#ffffff',
} as const;

const ZONE_COLORS: Record<string, string> = {
  Green: '#10b981',
  Yellow: '#f59e0b',
  Red: '#f43f4e',
};

const PAGE = {
  margin: 16,
  headerHeight: 17,
  footerHeight: 10,
  contentTop: 23,
  contentBottomInset: 14,
} as const;

const PT_TO_MM = 0.352778;

interface Recommendation {
  category: string;
  title: string;
  description: string;
}

const lineHeightMm = (fontSizePt: number, factor = 1.25) => fontSizePt * PT_TO_MM * factor;

/**
 * jsPDF's built-in Helvetica font is not a Unicode font. Transliterate
 * punctuation and meaningful symbols before removing unsupported glyphs so
 * patient-entered notes remain readable rather than silently changing meaning.
 */
export const sanitisePdfText = (value: string): string =>
  value
    .replace(/\u2260/g, ' not equal to ')
    .replace(/\u226e/g, ' not less than ')
    .replace(/\u226f/g, ' not greater than ')
    .normalize('NFKD')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2044/g, '/')
    .replace(/\u00b0/g, ' deg ')
    .replace(/\u20ac/g, 'EUR ')
    .replace(/\u00a3/g, 'GBP ')
    .replace(/\u00a5/g, 'JPY ')
    .replace(/\u00a2/g, ' cents ')
    .replace(/[\u00b5\u03bc]/g, 'micro')
    .replace(/\u00d7/g, ' x ')
    .replace(/\u00b1/g, ' +/- ')
    .replace(/\u2264/g, ' <= ')
    .replace(/\u2265/g, ' >= ')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/[^\x20-\x7E\n]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();

const getZoneLabel = (score: number): string => {
  if (score >= 7) return 'Red';
  if (score >= 4) return 'Yellow';
  return 'Green';
};

const getZoneDescription = (score: number): string => {
  if (score >= 7) return 'High fatigue';
  if (score >= 4) return 'Treatment / moderate fatigue';
  return 'Stable';
};

const formatDate = (isoDate: string) =>
  new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate));

const formatShortDate = (isoDate: string) =>
  new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short' }).format(new Date(isoDate));

const formatGeneratedAt = (generatedAt: Date) =>
  new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(generatedAt);

const formatFooterDate = (generatedAt: Date) =>
  new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(generatedAt);

const drawPageChrome = (doc: jsPDF, generatedAt: Date) => {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const { margin, headerHeight, footerHeight } = PAGE;

  doc.setFillColor(COLORS.bg);
  doc.rect(0, 0, pageW, pageH, 'F');

  doc.setFillColor(COLORS.nav);
  doc.rect(0, 0, pageW, headerHeight, 'F');

  const brandCX = margin + 3.5;
  const brandCY = 8;
  const spread = 1.8;
  doc.setFillColor(COLORS.accent);
  doc.circle(brandCX, brandCY - spread, 0.8, 'F');
  doc.setFillColor(COLORS.primary);
  doc.circle(brandCX - spread * 0.85, brandCY + spread * 0.5, 0.8, 'F');
  doc.setFillColor(COLORS.tertiary);
  doc.circle(brandCX + spread * 0.85, brandCY + spread * 0.5, 0.8, 'F');
  doc.setFillColor(COLORS.white);
  doc.circle(brandCX, brandCY, 0.6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(COLORS.white);
  doc.text('FIT FOR CANCER', margin + 9, 7.4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(COLORS.accent);
  doc.text('Caregiver Summary', margin + 9, 11.8);

  doc.setFillColor(COLORS.nav);
  doc.rect(0, pageH - footerHeight, pageW, footerHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(COLORS.white);
  doc.text('Fit For Cancer', margin, pageH - 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(COLORS.accent);
  doc.text('fitforcancer.com.au', margin, pageH - 2.7);

  doc.setTextColor('#9ca3af');
  doc.text(`Generated ${formatFooterDate(generatedAt)}`, pageW - margin, pageH - 4.2, { align: 'right' });
};

const drawSectionHeading = (doc: jsPDF, title: string, y: number) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.text(title, PAGE.margin, y);
};

const getRecommendationsForZone = (zone: string): Recommendation[] => {
  if (zone === 'Red') {
    return [
      {
        category: 'Exercise',
        title: 'Gentle movement only',
        description: 'Focus on breathing exercises, gentle stretching, and short walks as tolerated. Rest is important - listen to your body.',
      },
      {
        category: 'Exercise',
        title: 'Seated exercises',
        description: 'Seated leg raises, wall push-ups, and pelvic tilts can maintain mobility without overexertion.',
      },
      {
        category: 'Nutrition',
        title: 'Small, frequent meals',
        description: 'Try easy-to-digest options like ginger and turmeric broth, protein-packed smoothies, or fortified milky drinks. Anti-nausea foods may help.',
      },
    ];
  }

  if (zone === 'Yellow') {
    return [
      {
        category: 'Exercise',
        title: 'Moderate activity',
        description: 'Brisk walking, chair squats, and bicep curls at low intensity. Aim for 10-15 minute sessions with rest breaks.',
      },
      {
        category: 'Exercise',
        title: 'Stay consistent',
        description: 'Regular gentle movement helps manage treatment side effects. Even light activity on tough days is beneficial.',
      },
      {
        category: 'Nutrition',
        title: 'High-protein focus',
        description: 'Protein-packed berry smoothies, poached chicken with steamed greens, and red lentil dahl support recovery and muscle maintenance.',
      },
    ];
  }

  return [
    {
      category: 'Exercise',
      title: 'Build gradually',
      description: 'Brisk walking, sit-to-stands, wall push-ups, and light resistance work can help maintain strength and stamina.',
    },
    {
      category: 'Exercise',
      title: 'Keep moving regularly',
      description: 'Short, consistent sessions are useful. Increase duration or resistance gradually and keep rest available when treatment catches up with you.',
    },
    {
      category: 'Nutrition',
      title: 'Balanced recovery meals',
      description: 'Aim for protein, carbohydrate, vegetables or fruit, and enough fluid. Simple options still count when energy is limited.',
    },
  ];
};

const splitSafeText = (doc: jsPDF, value: string, width: number): string[] =>
  doc.splitTextToSize(sanitisePdfText(value), width) as string[];

const drawRecommendationCard = (
  doc: jsPDF,
  rec: Recommendation,
  y: number,
  contentW: number,
): number => {
  const categoryFont = 7;
  const titleFont = 9.5;
  const descriptionFont = 8.2;
  const categoryLine = lineHeightMm(categoryFont, 1.15);
  const titleLine = lineHeightMm(titleFont, 1.22);
  const descriptionLine = lineHeightMm(descriptionFont, 1.28);
  const horizontalPadding = 4;
  const topPadding = 4;
  const bottomPadding = 4;
  const innerW = contentW - horizontalPadding * 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(titleFont);
  const titleLines = splitSafeText(doc, rec.title, innerW);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(descriptionFont);
  const descriptionLines = splitSafeText(doc, rec.description, innerW);

  const cardHeight =
    topPadding +
    categoryLine +
    1.2 +
    titleLines.length * titleLine +
    1.2 +
    descriptionLines.length * descriptionLine +
    bottomPadding;

  doc.setFillColor(COLORS.surface);
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(PAGE.margin, y, contentW, cardHeight, 1.5, 1.5, 'FD');

  const categoryColor = rec.category === 'Nutrition' ? COLORS.primary : COLORS.tertiary;
  let cursorY = y + topPadding;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(categoryFont);
  doc.setTextColor(categoryColor);
  cursorY += categoryLine * 0.78;
  doc.text(sanitisePdfText(rec.category).toUpperCase(), PAGE.margin + horizontalPadding, cursorY);

  cursorY += categoryLine * 0.22 + 1.2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(titleFont);
  doc.setTextColor(COLORS.text);
  cursorY += titleLine * 0.78;
  doc.text(titleLines, PAGE.margin + horizontalPadding, cursorY, { lineHeightFactor: 1.22 });

  cursorY += titleLine * (titleLines.length - 0.78) + 1.2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(descriptionFont);
  doc.setTextColor(COLORS.textMuted);
  cursorY += descriptionLine * 0.78;
  doc.text(descriptionLines, PAGE.margin + horizontalPadding, cursorY, { lineHeightFactor: 1.28 });

  return cardHeight;
};

export const buildCaregiverPdf = (
  currentFatigueScore: number | null,
  history: EnergyHistoryEntry[] = getEnergyHistory(),
  generatedAt = new Date(),
): jsPDF => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - PAGE.margin * 2;
  const contentBottom = pageH - PAGE.footerHeight - PAGE.contentBottomInset;
  let y = PAGE.contentTop;

  const addFreshPage = () => {
    doc.addPage();
    drawPageChrome(doc, generatedAt);
    y = PAGE.contentTop;
  };

  const ensureSpace = (requiredHeight: number) => {
    if (y + requiredHeight > contentBottom) addFreshPage();
  };

  drawPageChrome(doc, generatedAt);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(COLORS.textMuted);
  doc.text(`Generated ${sanitisePdfText(formatGeneratedAt(generatedAt))}`, PAGE.margin, y);
  y += 5;

  doc.setDrawColor(COLORS.primary);
  doc.setLineWidth(0.35);
  doc.line(PAGE.margin, y, pageW - PAGE.margin, y);
  y += 6;

  drawSectionHeading(doc, 'Patient Energy Overview', y);
  y += 5.5;

  const recentEntries = history.slice(-7);
  const avgScore = recentEntries.length > 0
    ? Math.round((recentEntries.reduce((total, entry) => total + entry.score, 0) / recentEntries.length) * 10) / 10
    : null;

  if (currentFatigueScore !== null) {
    const zone = getZoneLabel(currentFatigueScore);
    const zoneColor = ZONE_COLORS[zone];
    doc.setFillColor(COLORS.surface);
    doc.setDrawColor(zoneColor);
    doc.setLineWidth(0.45);
    doc.roundedRect(PAGE.margin, y, contentW, 9, 1.5, 1.5, 'FD');
    doc.setFillColor(zoneColor);
    doc.circle(PAGE.margin + 5, y + 4.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.text);
    doc.text(`${zone} - ${getZoneDescription(currentFatigueScore)}`, PAGE.margin + 9, y + 5.6);
    y += 12;
  }

  const statsHeight = 16;
  doc.setFillColor(COLORS.surface);
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(PAGE.margin, y, contentW, statsHeight, 1.5, 1.5, 'FD');

  const statW = contentW / 3;
  const statValues = [
    currentFatigueScore !== null ? `${currentFatigueScore}/10` : '-',
    avgScore !== null ? `${avgScore}` : '-',
    `${history.length}`,
  ];
  const statLabels = ['Current score', '7-day average', 'Total check-ins'];

  statValues.forEach((value, index) => {
    const centreX = PAGE.margin + statW * index + statW / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(COLORS.text);
    doc.text(value, centreX, y + 7, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(COLORS.textMuted);
    doc.text(statLabels[index], centreX, y + 11.5, { align: 'center' });
  });
  y += statsHeight + 7;

  if (history.length > 1) {
    ensureSpace(47);
    drawSectionHeading(doc, 'Energy Trend (last 14 days)', y);
    y += 5;

    const trendData = history.slice(-14);
    const chartX = PAGE.margin + 8;
    const chartW = contentW - 12;
    const chartH = 27;
    const chartY = y;

    doc.setFillColor(COLORS.surface);
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(PAGE.margin, chartY, contentW, chartH + 9, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(COLORS.textMuted);
    for (let score = 0; score <= 10; score += 2) {
      const labelY = chartY + 3 + chartH - (score / 10) * chartH;
      doc.text(`${score}`, PAGE.margin + 3, labelY + 1);
      doc.setDrawColor(COLORS.grid);
      doc.setLineWidth(0.15);
      doc.line(chartX, labelY, chartX + chartW, labelY);
    }

    const pointGap = chartW / Math.max(1, trendData.length - 1);
    const points = trendData.map((entry, index) => ({
      x: chartX + index * pointGap,
      y: chartY + 3 + chartH - (entry.score / 10) * chartH,
    }));

    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(0.65);
    for (let index = 0; index < points.length - 1; index += 1) {
      doc.line(points[index].x, points[index].y, points[index + 1].x, points[index + 1].y);
    }

    points.forEach((point, index) => {
      doc.setFillColor(ZONE_COLORS[getZoneLabel(trendData[index].score)]);
      doc.circle(point.x, point.y, 1.15, 'F');
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(COLORS.textMuted);
    const dateStep = Math.max(1, Math.ceil(trendData.length / 4));
    trendData.forEach((entry, index) => {
      if (index % dateStep === 0 || index === trendData.length - 1) {
        doc.text(formatShortDate(entry.date), points[index].x, chartY + chartH + 7.2, { align: 'center' });
      }
    });

    y += chartH + 14;
  }

  ensureSpace(32);
  const lastFive = history.slice(-5).reverse();
  if (lastFive.length === 0) {
    drawSectionHeading(doc, 'Recent Check-ins', y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(COLORS.textMuted);
    doc.text('No check-ins recorded yet.', PAGE.margin, y + 1);
    y += 7;
  } else {
    const dateX = PAGE.margin + 3;
    const scoreX = PAGE.margin + 31;
    const zoneX = PAGE.margin + 48;
    const noteX = PAGE.margin + 71;
    const noteWidth = pageW - PAGE.margin - noteX - 2;
    const rowLine = lineHeightMm(8, 1.22);
    const rowPadding = 2.2;
    const rowBottomMargin = 1;

    const drawCheckInTableHeader = (continued = false) => {
      drawSectionHeading(doc, continued ? 'Recent Check-ins (continued)' : 'Recent Check-ins', y);
      y += 5;

      doc.setFillColor(COLORS.primary);
      doc.roundedRect(PAGE.margin, y, contentW, 6, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.setTextColor(COLORS.white);
      doc.text('Date', dateX, y + 4);
      doc.text('Score', scoreX, y + 4);
      doc.text('Zone', zoneX, y + 4);
      doc.text('Note', noteX, y + 4);
      y += 7.5;
    };

    const continueCheckInTable = () => {
      addFreshPage();
      drawCheckInTableHeader(true);
    };

    drawCheckInTableHeader(false);

    lastFive.forEach((entry, index) => {
      const noteLines = entry.note ? splitSafeText(doc, entry.note, noteWidth) : ['-'];
      let lineOffset = 0;

      while (lineOffset < noteLines.length) {
        const availableHeight = contentBottom - y;
        const maxLines = Math.floor((availableHeight - rowPadding - rowBottomMargin) / rowLine);

        if (availableHeight < 6.5 + rowBottomMargin || maxLines < 1) {
          continueCheckInTable();
          continue;
        }

        const chunkSize = Math.min(noteLines.length - lineOffset, maxLines);
        const chunkLines = noteLines.slice(lineOffset, lineOffset + chunkSize);
        const rowHeight = Math.max(6.5, chunkLines.length * rowLine + rowPadding);

        if (rowHeight + rowBottomMargin > availableHeight) {
          continueCheckInTable();
          continue;
        }

        if (index % 2 === 0) {
          doc.setFillColor('#f4f1ec');
          doc.rect(PAGE.margin, y - 1.2, contentW, rowHeight, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(COLORS.text);
        doc.text(formatDate(entry.date), dateX, y + 2.5);
        doc.text(`${entry.score}/10`, scoreX, y + 2.5);

        const zone = getZoneLabel(entry.score);
        doc.setFillColor(ZONE_COLORS[zone]);
        doc.circle(zoneX + 1, y + 1.7, 1.1, 'F');
        doc.setTextColor(COLORS.text);
        doc.text(zone, zoneX + 4.5, y + 2.5);
        doc.text(chunkLines, noteX, y + 2.5, { lineHeightFactor: 1.22 });

        lineOffset += chunkSize;
        y += rowHeight + 0.8;

        if (lineOffset < noteLines.length) {
          continueCheckInTable();
        }
      }
    });
    y += 4;
  }

  ensureSpace(30);
  drawSectionHeading(doc, 'Key Recommendations', y);
  y += 5;

  const currentZone = currentFatigueScore !== null ? getZoneLabel(currentFatigueScore) : 'Green';
  for (const recommendation of getRecommendationsForZone(currentZone)) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    const titleLines = splitSafeText(doc, recommendation.title, contentW - 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    const descriptionLines = splitSafeText(doc, recommendation.description, contentW - 8);
    const estimatedHeight =
      4 +
      lineHeightMm(7, 1.15) +
      1.2 +
      titleLines.length * lineHeightMm(9.5, 1.22) +
      1.2 +
      descriptionLines.length * lineHeightMm(8.2, 1.28) +
      4;

    ensureSpace(estimatedHeight + 3);
    const cardHeight = drawRecommendationCard(doc, recommendation, y, contentW);
    y += cardHeight + 3;
  }

  ensureSpace(29);
  y += 2;
  doc.setDrawColor(COLORS.primary);
  doc.setLineWidth(0.3);
  doc.line(PAGE.margin, y, pageW - PAGE.margin, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.textMuted);
  doc.text('Clinical Disclaimer', PAGE.margin, y);
  y += 4.5;

  const disclaimer = sanitisePdfText(
    'This summary is generated from patient-reported data and is intended for informational purposes only. It does not constitute medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical decisions. Fit For Cancer is a companion tool, not a medical device.',
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(COLORS.textMuted);
  const disclaimerLines = doc.splitTextToSize(disclaimer, contentW) as string[];
  doc.text(disclaimerLines, PAGE.margin, y, { lineHeightFactor: 1.3 });
  y += disclaimerLines.length * lineHeightMm(7.5, 1.3) + 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(COLORS.textMuted);
  doc.text('Fit For Cancer - free at fitforcancer.com.au', PAGE.margin, y);

  return doc;
};

export const generateCaregiverPdf = (currentFatigueScore: number | null): void => {
  const doc = buildCaregiverPdf(currentFatigueScore);
  const filename = `FitForCancer_CaregiverSummary_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};