import jsPDF from 'jspdf';

interface ChatPdfLink {
  title: string;
  url: string;
}

// Brand colours — must match caregiverPdf.ts and BrandLockup
const COLORS = {
  primary: '#52796f',
  accent: '#c8e44a',
  tertiary: '#4a6fa5',
  bg: '#faf7f2',
  nav: '#1a2821',
  surface: '#ffffff',
  text: '#1c1c1e',
  textMuted: '#6b7280',
  white: '#ffffff',
} as const;

const pad = (mm: number) => Math.max(0.3, mm);

// Simple markdown line → styled text segments
interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

const parseInline = (line: string): TextSegment[] => {
  const segments: TextSegment[] = [];
  // Match **bold**, *italic*, and plain text
  const regex = /\*\*(.+?)\*\*|\*(.+?)\\*|([^*]+)/g;
  let match;
  while ((match = regex.exec(line)) !== null) {
    if (match[1]) {
      segments.push({ text: match[1], bold: true });
    } else if (match[2]) {
      segments.push({ text: match[2], italic: true });
    } else if (match[3]) {
      segments.push({ text: match[3] });
    }
  }
  return segments.length > 0 ? segments : [{ text: line }];
};

export const generateChatPdf = (cleanText: string, links: ChatPdfLink[]): void => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ── Background ──
  doc.setFillColor(COLORS.bg);
  doc.rect(0, 0, pageW, pageH, 'F');

  // ── Header brand bar ──
  doc.setFillColor(COLORS.nav);
  doc.rect(0, 0, pageW, pad(8), 'F');

  // Brand mark (simplified dot triangle)
  const brandCX = margin + 4;
  const brandCY = 4.5;
  const dotR = 0.8;
  const spread = 1.8;
  doc.setFillColor(COLORS.accent);
  doc.circle(brandCX, brandCY - spread, dotR, 'F');
  doc.setFillColor(COLORS.primary);
  doc.circle(brandCX - spread * 0.85, brandCY + spread * 0.5, dotR, 'F');
  doc.setFillColor(COLORS.tertiary);
  doc.circle(brandCX + spread * 0.85, brandCY + spread * 0.5, dotR, 'F');
  doc.setFillColor(COLORS.white);
  doc.circle(brandCX, brandCY, 0.6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.white);
  doc.text('FIT FOR CANCER', margin + 10, 5.8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(COLORS.accent);
  doc.text('Health Assistant Summary', margin + 10, pad(8.5));

  y = pad(13);

  // ── Generation date ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.textMuted);
  doc.text(
    `Generated ${new Intl.DateTimeFormat('en-AU', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    }).format(new Date())}`,
    margin, y,
  );
  y += pad(5);

  // ── Divider ──
  doc.setDrawColor(COLORS.primary);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += pad(4);

  // ── Parse and render markdown content ──
  const lines = cleanText.split('\n');
  let inList = false;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Page overflow check
    if (y > pageH - pad(18)) {
      doc.addPage();
      y = margin;
    }

    // Empty line
    if (!line.trim()) {
      y += pad(3);
      inList = false;
      continue;
    }

    // H3 heading
    if (line.startsWith('### ')) {
      y += pad(2);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(COLORS.primary);
      const headingText = line.slice(4);
      const wrapped = doc.splitTextToSize(headingText, contentW);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 3.5 + pad(2);
      inList = false;
      continue;
    }

    // H4 heading
    if (line.startsWith('#### ')) {
      y += pad(1.5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(COLORS.tertiary);
      const headingText = line.slice(5);
      const wrapped = doc.splitTextToSize(headingText, contentW);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 3 + pad(1.5);
      inList = false;
      continue;
    }

    // Unordered list item
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const itemText = line.slice(2);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(COLORS.text);

      // Bullet
      doc.setFillColor(COLORS.primary);
      doc.circle(margin + 1.5, y - 0.3, 0.6, 'F');

      // Text with inline formatting
      const segments = parseInline(itemText);
      let xOff = margin + 4;
      const maxWidth = contentW - 4;
      const wrapped = doc.splitTextToSize(itemText, maxWidth);
      doc.text(wrapped, xOff, y);
      y += wrapped.length * 3 + pad(1.5);
      inList = true;
      continue;
    }

    // Ordered list item
    const orderedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (orderedMatch) {
      const num = orderedMatch[1];
      const itemText = orderedMatch[2];
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(COLORS.primary);
      doc.text(`${num}.`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.text);
      const xOff = margin + 5;
      const wrapped = doc.splitTextToSize(itemText, contentW - 5);
      doc.text(wrapped, xOff, y);
      y += wrapped.length * 3 + pad(1.5);
      inList = true;
      continue;
    }

    // Table row
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').filter(Boolean).map(c => c.trim());
      // Skip separator rows like |---|---|
      if (cells.every(c => /^[-:]+$/.test(c))) {
        y += pad(1);
        continue;
      }

      const cellW = contentW / cells.length;
      const rowPad = 2;

      // Measure row height
      let maxLines = 1;
      cells.forEach((cell, i) => {
        const wrapped = doc.splitTextToSize(cell, cellW - rowPad * 2);
        maxLines = Math.max(maxLines, wrapped.length);
      });
      const rowH = maxLines * 3 + rowPad * 2;

      // Check page overflow
      if (y + rowH > pageH - pad(12)) {
        doc.addPage();
        y = margin;
      }

      // Draw row background (alternating)
      doc.setFillColor(COLORS.surface);
      doc.roundedRect(margin, y - 1, contentW, rowH, 0.5, 0.5, 'F');

      // Draw cells
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(COLORS.text);
      cells.forEach((cell, i) => {
        doc.text(cell, margin + cellW * i + rowPad, y + rowPad + 2);
      });

      y += rowH + pad(0.5);
      inList = false;
      continue;
    }

    // Horizontal rule
    if (line === '---' || line === '***') {
      doc.setDrawColor(COLORS.textMuted);
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageW - margin, y);
      y += pad(3);
      inList = false;
      continue;
    }

    // Plain paragraph
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.text);
    const segments = parseInline(line);
    // Render with inline bold/italic support
    let xCursor = margin;
    const lineHeight = 3.2;
    for (const seg of segments) {
      doc.setFont('helvetica', seg.bold ? 'bold' : seg.italic ? 'italic' : 'normal');
      doc.setTextColor(seg.bold ? COLORS.text : seg.italic ? COLORS.textMuted : COLORS.text);
      const wrapped = doc.splitTextToSize(seg.text, contentW - (xCursor - margin));
      doc.text(wrapped, xCursor, y);
      // For single-line segments, advance x; for multi-line, advance y
      if (wrapped.length <= 1) {
        xCursor += doc.getTextWidth(seg.text) + 1;
      } else {
        y += (wrapped.length - 1) * lineHeight;
        xCursor = margin;
      }
    }
    y += lineHeight + pad(2);
    inList = false;
  }

  // ── Verified Resources section ──
  if (links.length > 0) {
    y += pad(3);

    // Check page overflow
    if (y > pageH - pad(25)) {
      doc.addPage();
      y = margin;
    }

    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += pad(4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.primary);
    doc.text('Verified Resources', margin, y);
    y += pad(4);

    links.forEach((link) => {
      // Check page overflow
      if (y > pageH - pad(15)) {
        doc.addPage();
        y = margin;
      }

      // Resource card
      const titleLines = doc.splitTextToSize(link.title, contentW - pad(4));
      const cardH = titleLines.length * 3 + pad(4);

      doc.setFillColor(COLORS.surface);
      doc.roundedRect(margin, y - 1, contentW, cardH, 1, 1, 'F');

      // Link icon (small circle)
      doc.setFillColor(COLORS.tertiary);
      doc.circle(margin + 3, y + 1, 1, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(COLORS.text);
      doc.text(titleLines, margin + 6, y + 1.5);

      // URL below title
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(COLORS.textMuted);
      const urlLines = doc.splitTextToSize(link.url, contentW - pad(4));
      doc.text(urlLines, margin + 6, y + 1.5 + titleLines.length * 3);

      y += cardH + pad(2);
    });
  }

  // ── Disclaimer ──
  y += pad(3);
  if (y > pageH - pad(18)) {
    doc.addPage();
    y = margin;
  }

  doc.setDrawColor(COLORS.primary);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += pad(3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(COLORS.textMuted);
  doc.text('Clinical Disclaimer', margin, y);
  y += pad(2.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(COLORS.textMuted);
  const disclaimer =
    'This summary is generated from AI-assisted health information and is intended for educational purposes only. It does not constitute medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical decisions. Fit For Cancer is a companion tool, not a medical device.';
  const discLines = doc.splitTextToSize(disclaimer, contentW);
  doc.text(discLines, margin, y);
  y += discLines.length * 2.5 + pad(2);

  // ── Footer ──
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
    `Generated ${new Intl.DateTimeFormat('en-AU', {
      day: 'numeric', month: 'short', year: 'numeric',
    }).format(new Date())}`,
    pageW - margin,
    pageH - pad(3),
    { align: 'right' },
  );

  // ── Save ──
  const filename = `FitForCancer_HealthPlan_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};
