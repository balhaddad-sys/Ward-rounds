/**
 * PDF Export Utility
 * Exports ward presentations to PDF format
 */

/**
 * Export presentation to PDF
 * @param {Object} presentation - Presentation data
 * @param {Object} options - Export options
 * @returns {Promise<Blob>} - PDF blob
 */
export async function exportToPDF(presentation, options = {}) {
  const {
    fileName = 'ward-presentation.pdf',
    includeMetadata = true,
    format = 'a4',
    orientation = 'portrait'
  } = options;

  // Dynamic import to avoid SSR issues
  const [{ jsPDF }, html2canvas] = await Promise.all([
    import('jspdf'),
    import('html2canvas')
  ]);

  const pdf = new jsPDF.jsPDF({
    orientation,
    unit: 'mm',
    format
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (2 * margin);
  let yPosition = margin;

  // Helper function to add text with word wrap
  const addText = (text, fontSize, isBold = false, color = [0, 0, 0]) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    pdf.setTextColor(...color);

    const lines = pdf.splitTextToSize(text, contentWidth);

    lines.forEach(line => {
      if (yPosition + 10 > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    });

    yPosition += 5; // Extra spacing after text block
  };

  // Helper function to add horizontal line
  const addLine = () => {
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
  };

  // Title
  pdf.setFillColor(37, 99, 235); // Primary blue
  pdf.rect(0, 0, pageWidth, 35, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Ward Presentation', margin, 20);

  yPosition = 45;

  // Metadata
  if (includeMetadata && presentation.generatedAt) {
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date(presentation.generatedAt).toLocaleString()}`, margin, yPosition);
    yPosition += 10;
  }

  // One-Liner
  if (presentation.oneLiner) {
    addText('ONE-LINER', 14, true, [37, 99, 235]);
    addText(presentation.oneLiner, 11, false);
    addLine();
  }

  // SOAP Sections
  const sections = [
    { title: 'SUBJECTIVE', content: presentation.subjective },
    { title: 'OBJECTIVE', content: presentation.objective },
    { title: 'ASSESSMENT', content: presentation.assessment },
    { title: 'PLAN', content: presentation.plan }
  ];

  sections.forEach(section => {
    if (section.content) {
      addText(section.title, 14, true, [37, 99, 235]);
      addText(section.content, 10, false);
      addLine();
    }
  });

  // Clinical Pearls
  if (presentation.pearls && presentation.pearls.length > 0) {
    pdf.addPage();
    yPosition = margin;

    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 0, pageWidth, 25, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.text('Clinical Pearls', margin, 15);

    yPosition = 35;

    presentation.pearls.forEach((pearl, index) => {
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = margin;
      }

      // Pearl number
      pdf.setFillColor(37, 99, 235);
      pdf.circle(margin + 3, yPosition + 2, 3, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.text(`${index + 1}`, margin + 3, yPosition + 3, { align: 'center' });

      // Pearl content
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      const pearlLines = pdf.splitTextToSize(pearl.pearl || pearl, contentWidth - 10);
      pearlLines.forEach((line, lineIndex) => {
        pdf.text(line, margin + 10, yPosition + (lineIndex === 0 ? 4 : 4 + lineIndex * 5));
      });
      yPosition += pearlLines.length * 5 + 2;

      // Relevance
      if (pearl.relevance) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        const relevanceLines = pdf.splitTextToSize(pearl.relevance, contentWidth - 10);
        relevanceLines.forEach((line, lineIndex) => {
          pdf.text(line, margin + 10, yPosition + lineIndex * 4);
        });
        yPosition += relevanceLines.length * 4;
      }

      // Tags
      if (pearl.difficulty || pearl.category) {
        pdf.setFontSize(8);
        let tagX = margin + 10;

        if (pearl.difficulty) {
          const difficultyColors = {
            basic: [34, 197, 94],
            intermediate: [234, 179, 8],
            advanced: [239, 68, 68]
          };
          const color = difficultyColors[pearl.difficulty] || [100, 100, 100];
          pdf.setFillColor(...color);
          pdf.roundedRect(tagX, yPosition, 25, 5, 2, 2, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.text(pearl.difficulty.toUpperCase(), tagX + 2, yPosition + 3.5);
          tagX += 28;
        }

        if (pearl.category) {
          pdf.setFillColor(200, 200, 200);
          pdf.roundedRect(tagX, yPosition, 30, 5, 2, 2, 'F');
          pdf.setTextColor(50, 50, 50);
          pdf.text(pearl.category.toUpperCase(), tagX + 2, yPosition + 3.5);
        }

        yPosition += 7;
      }

      yPosition += 8; // Space between pearls
    });
  }

  // Teaching Questions
  if (presentation.questions && presentation.questions.length > 0) {
    pdf.addPage();
    yPosition = margin;

    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 0, pageWidth, 25, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.text('Teaching Questions', margin, 15);

    yPosition = 35;

    presentation.questions.forEach((q, index) => {
      if (yPosition > pageHeight - 70) {
        pdf.addPage();
        yPosition = margin;
      }

      // Question
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      const questionText = `${index + 1}. ${q.question || q}`;
      const questionLines = pdf.splitTextToSize(questionText, contentWidth);
      questionLines.forEach((line, lineIndex) => {
        pdf.text(line, margin, yPosition + lineIndex * 5);
      });
      yPosition += questionLines.length * 5 + 3;

      // Answer
      if (q.answer) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(50, 50, 50);
        pdf.text('Answer:', margin + 5, yPosition);
        yPosition += 5;

        const answerLines = pdf.splitTextToSize(q.answer, contentWidth - 5);
        answerLines.forEach((line, lineIndex) => {
          pdf.text(line, margin + 5, yPosition + lineIndex * 4.5);
        });
        yPosition += answerLines.length * 4.5 + 3;
      }

      // Teaching Point
      if (q.teachingPoint) {
        pdf.setFillColor(240, 240, 240);
        const teachingPointLines = pdf.splitTextToSize(q.teachingPoint, contentWidth - 10);
        const boxHeight = teachingPointLines.length * 4.5 + 6;
        pdf.roundedRect(margin, yPosition, contentWidth, boxHeight, 2, 2, 'F');

        pdf.setTextColor(37, 99, 235);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Teaching Point:', margin + 3, yPosition + 4);

        pdf.setTextColor(50, 50, 50);
        pdf.setFont('helvetica', 'normal');
        teachingPointLines.forEach((line, lineIndex) => {
          pdf.text(line, margin + 3, yPosition + 8 + lineIndex * 4.5);
        });

        yPosition += boxHeight + 3;
      }

      yPosition += 8; // Space between questions
    });
  }

  // Footer on all pages
  const pageCount = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `MedWard - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  return pdf;
}

/**
 * Download PDF file
 * @param {Object} presentation - Presentation data
 * @param {string} fileName - File name
 */
export async function downloadPDF(presentation, fileName = 'ward-presentation.pdf') {
  const pdf = await exportToPDF(presentation, { fileName });
  pdf.save(fileName);
}

/**
 * Get PDF as blob for sharing
 * @param {Object} presentation - Presentation data
 * @returns {Promise<Blob>} - PDF blob
 */
export async function getPDFBlob(presentation) {
  const pdf = await exportToPDF(presentation);
  return pdf.output('blob');
}

/**
 * Open PDF in new tab
 * @param {Object} presentation - Presentation data
 */
export async function openPDFInNewTab(presentation) {
  const pdf = await exportToPDF(presentation);
  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
