/**
 * PowerPoint Export Utility
 * Exports ward presentations to PPTX format
 */

/**
 * Export presentation to PowerPoint
 * @param {Object} presentation - Presentation data
 * @param {Object} options - Export options
 * @returns {Promise<void>}
 */
export async function exportToPPTX(presentation, options = {}) {
  // Only import when actually called (client-side only)
  if (typeof window === 'undefined') {
    throw new Error('PowerPoint export only works in browser');
  }

  const {
    fileName = 'ward-presentation.pptx',
    theme = 'professional'
  } = options;

  // Dynamic import to avoid SSR issues
  const pptxgen = await import('pptxgenjs');
  const pptx = new pptxgen.default();

  // Theme colors
  const themes = {
    professional: {
      primary: '2563EB', // Blue
      secondary: '475569', // Slate
      accent: '10B981', // Green
      background: 'FFFFFF',
      text: '1E293B'
    },
    medical: {
      primary: '0891B2', // Cyan
      secondary: '64748B',
      accent: 'DC2626', // Red
      background: 'FFFFFF',
      text: '1E293B'
    }
  };

  const colors = themes[theme] || themes.professional;

  // Set default styles
  pptx.author = 'MedWard';
  pptx.subject = 'Ward Presentation';
  pptx.title = 'Medical Ward Presentation';

  // Slide 1: Title Slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: colors.primary };

  titleSlide.addText('Ward Presentation', {
    x: 0.5,
    y: 2,
    w: 9,
    h: 1.5,
    fontSize: 44,
    bold: true,
    color: 'FFFFFF',
    align: 'center'
  });

  if (presentation.oneLiner) {
    titleSlide.addText(presentation.oneLiner, {
      x: 1,
      y: 3.8,
      w: 8,
      h: 1,
      fontSize: 20,
      color: 'FFFFFF',
      align: 'center',
      italic: true
    });
  }

  if (presentation.generatedAt) {
    titleSlide.addText(`Generated: ${new Date(presentation.generatedAt).toLocaleDateString()}`, {
      x: 0.5,
      y: 5.2,
      w: 9,
      h: 0.3,
      fontSize: 12,
      color: 'E2E8F0',
      align: 'center'
    });
  }

  // Slide 2: One-Liner
  if (presentation.oneLiner) {
    const oneLinerSlide = pptx.addSlide();
    oneLinerSlide.addText('One-Liner', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.7,
      fontSize: 32,
      bold: true,
      color: colors.primary
    });

    oneLinerSlide.addText(presentation.oneLiner, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 2,
      fontSize: 24,
      color: colors.text,
      valign: 'middle'
    });
  }

  // Helper function to add SOAP section slide
  const addSOAPSlide = (title, content) => {
    if (!content) return;

    const slide = pptx.addSlide();

    // Title bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.8,
      fill: { color: colors.primary }
    });

    slide.addText(title, {
      x: 0.5,
      y: 0.15,
      w: 9,
      h: 0.5,
      fontSize: 28,
      bold: true,
      color: 'FFFFFF'
    });

    // Content
    const contentLines = content.split('\n').filter(line => line.trim());
    let yPos = 1.2;

    contentLines.forEach((line, index) => {
      if (yPos > 5) return; // Don't overflow slide

      const isBold = line.endsWith(':') || line.match(/^[A-Z\s]+:$/);
      const isListItem = line.trim().startsWith('•') || line.trim().startsWith('-') || line.match(/^\d+\./);

      slide.addText(line, {
        x: isListItem ? 1 : 0.5,
        y: yPos,
        w: 9,
        fontSize: isBold ? 16 : 14,
        bold: isBold,
        color: isBold ? colors.primary : colors.text,
        bullet: isListItem ? { type: 'bullet' } : undefined
      });

      yPos += isBold ? 0.4 : 0.35;
    });

    // If content is too long, split into multiple slides
    if (contentLines.length > 15) {
      const slide2 = pptx.addSlide();
      slide2.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: '100%',
        h: 0.8,
        fill: { color: colors.primary }
      });

      slide2.addText(`${title} (cont.)`, {
        x: 0.5,
        y: 0.15,
        w: 9,
        h: 0.5,
        fontSize: 28,
        bold: true,
        color: 'FFFFFF'
      });

      yPos = 1.2;
      contentLines.slice(15).forEach(line => {
        if (yPos > 5) return;

        const isBold = line.endsWith(':') || line.match(/^[A-Z\s]+:$/);
        const isListItem = line.trim().startsWith('•') || line.trim().startsWith('-') || line.match(/^\d+\./);

        slide2.addText(line, {
          x: isListItem ? 1 : 0.5,
          y: yPos,
          w: 9,
          fontSize: isBold ? 16 : 14,
          bold: isBold,
          color: isBold ? colors.primary : colors.text,
          bullet: isListItem ? { type: 'bullet' } : undefined
        });

        yPos += isBold ? 0.4 : 0.35;
      });
    }
  };

  // SOAP Slides
  addSOAPSlide('SUBJECTIVE', presentation.subjective);
  addSOAPSlide('OBJECTIVE', presentation.objective);
  addSOAPSlide('ASSESSMENT', presentation.assessment);
  addSOAPSlide('PLAN', presentation.plan);

  // Clinical Pearls
  if (presentation.pearls && presentation.pearls.length > 0) {
    const pearlsSlide = pptx.addSlide();
    pearlsSlide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.8,
      fill: { color: colors.accent }
    });

    pearlsSlide.addText('💎 Clinical Pearls', {
      x: 0.5,
      y: 0.15,
      w: 9,
      h: 0.5,
      fontSize: 28,
      bold: true,
      color: 'FFFFFF'
    });

    let yPos = 1.2;
    const pearlsPerSlide = 3;
    let currentSlide = pearlsSlide;
    let pearlCount = 0;

    presentation.pearls.forEach((pearl, index) => {
      if (pearlCount >= pearlsPerSlide) {
        // Create new slide
        currentSlide = pptx.addSlide();
        currentSlide.addShape(pptx.ShapeType.rect, {
          x: 0,
          y: 0,
          w: '100%',
          h: 0.8,
          fill: { color: colors.accent }
        });

        currentSlide.addText('💎 Clinical Pearls (cont.)', {
          x: 0.5,
          y: 0.15,
          w: 9,
          h: 0.5,
          fontSize: 28,
          bold: true,
          color: 'FFFFFF'
        });

        yPos = 1.2;
        pearlCount = 0;
      }

      // Pearl box
      currentSlide.addShape(pptx.ShapeType.roundRect, {
        x: 0.5,
        y: yPos,
        w: 9,
        h: 1.2,
        fill: { color: 'F8FAFC' },
        line: { color: colors.accent, width: 2 }
      });

      currentSlide.addText(pearl.pearl || pearl, {
        x: 0.7,
        y: yPos + 0.1,
        w: 8.6,
        h: 0.6,
        fontSize: 14,
        bold: true,
        color: colors.text
      });

      if (pearl.relevance) {
        currentSlide.addText(pearl.relevance, {
          x: 0.7,
          y: yPos + 0.65,
          w: 8.6,
          h: 0.45,
          fontSize: 11,
          color: colors.secondary,
          italic: true
        });
      }

      yPos += 1.35;
      pearlCount++;
    });
  }

  // Teaching Questions
  if (presentation.questions && presentation.questions.length > 0) {
    presentation.questions.forEach((q, index) => {
      // Question slide
      const qSlide = pptx.addSlide();
      qSlide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: '100%',
        h: 0.8,
        fill: { color: colors.primary }
      });

      qSlide.addText(`Question ${index + 1}`, {
        x: 0.5,
        y: 0.15,
        w: 9,
        h: 0.5,
        fontSize: 28,
        bold: true,
        color: 'FFFFFF'
      });

      qSlide.addText(q.question || q, {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 2,
        fontSize: 20,
        color: colors.text,
        valign: 'middle'
      });

      // Answer slide
      if (q.answer) {
        const aSlide = pptx.addSlide();
        aSlide.addShape(pptx.ShapeType.rect, {
          x: 0,
          y: 0,
          w: '100%',
          h: 0.8,
          fill: { color: colors.accent }
        });

        aSlide.addText(`Answer ${index + 1}`, {
          x: 0.5,
          y: 0.15,
          w: 9,
          h: 0.5,
          fontSize: 28,
          bold: true,
          color: 'FFFFFF'
        });

        aSlide.addText(q.answer, {
          x: 0.5,
          y: 1.2,
          w: 9,
          h: 1.5,
          fontSize: 16,
          color: colors.text
        });

        if (q.teachingPoint) {
          aSlide.addShape(pptx.ShapeType.roundRect, {
            x: 0.5,
            y: 3.5,
            w: 9,
            h: 1.8,
            fill: { color: 'FEF3C7' }
          });

          aSlide.addText('💡 Teaching Point', {
            x: 0.7,
            y: 3.6,
            w: 8.6,
            h: 0.3,
            fontSize: 14,
            bold: true,
            color: '92400E'
          });

          aSlide.addText(q.teachingPoint, {
            x: 0.7,
            y: 4,
            w: 8.6,
            h: 1.2,
            fontSize: 13,
            color: '78350F'
          });
        }
      }
    });
  }

  // Download the file
  await pptx.writeFile({ fileName });
}

/**
 * Download PowerPoint file
 * @param {Object} presentation - Presentation data
 * @param {string} fileName - File name
 */
export async function downloadPPTX(presentation, fileName = 'ward-presentation.pptx') {
  await exportToPPTX(presentation, { fileName });
}
