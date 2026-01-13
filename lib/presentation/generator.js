/**
 * Generate ward presentation from report interpretation
 * Creates structured SOAP format presentation
 */

/**
 * Generate a complete ward presentation
 * @param {Object} report - Report with interpretation, pearls, and questions
 * @param {Object} patient - Patient information
 * @returns {Object} - Structured presentation
 */
export function generatePresentation(report, patient = null) {
  const interpretation = report.interpretation || {};
  const pearls = report.clinicalPearls || {};
  const questions = report.potentialQuestions || {};

  // Generate one-liner
  const oneLiner = generateOneLiner(patient, interpretation);

  // Generate SOAP components
  const subjective = generateSubjective(patient, interpretation);
  const objective = generateObjective(report, interpretation);
  const assessment = generateAssessment(interpretation);
  const plan = generatePlan(interpretation);

  return {
    oneLiner,
    subjective,
    objective,
    assessment,
    plan,
    pearls: pearls.pearls || [],
    questions: questions.questions || [],
    generatedAt: new Date().toISOString()
  };
}

/**
 * Generate one-liner summary
 * @param {Object} patient - Patient info
 * @param {Object} interpretation - Report interpretation
 * @returns {string} - One-liner
 */
function generateOneLiner(patient, interpretation) {
  const age = patient?.age || 'XX';
  const gender = patient?.gender === 'male' ? 'M' : patient?.gender === 'female' ? 'F' : 'X';
  const chiefComplaint = patient?.chiefComplaint || 'presenting complaint';
  const summary = interpretation.summary || '';

  return `${age}yo ${gender} with ${chiefComplaint}. ${summary}`;
}

/**
 * Generate subjective section
 * @param {Object} patient - Patient info
 * @param {Object} interpretation - Report interpretation
 * @returns {string} - Subjective section
 */
function generateSubjective(patient, interpretation) {
  let text = '';

  if (patient?.chiefComplaint) {
    text += `Chief Complaint: ${patient.chiefComplaint}\n\n`;
  }

  if (patient?.admissionDate) {
    const dayCount = Math.ceil((Date.now() - new Date(patient.admissionDate).getTime()) / (1000 * 60 * 60 * 24));
    text += `Hospital Day ${dayCount}\n\n`;
  }

  text += `Relevant History:\n`;
  text += interpretation.summary || 'See chart for details.';

  return text.trim();
}

/**
 * Generate objective section
 * @param {Object} report - Full report
 * @param {Object} interpretation - Report interpretation
 * @returns {string} - Objective section
 */
function generateObjective(report, interpretation) {
  let text = `Report Type: ${formatReportType(report.type)}\n\n`;

  // Add structured data if available
  if (report.structuredData) {
    text += formatStructuredData(report.structuredData, report.type);
  }

  // Add key findings
  if (interpretation.findings && interpretation.findings.length > 0) {
    text += `\n\nKey Findings:\n`;
    interpretation.findings.forEach((finding, index) => {
      const status = finding.status === 'critical' ? '🔴' :
                    finding.status === 'abnormal' ? '🟡' : '🟢';
      text += `${status} ${finding.finding}`;
      if (finding.value) text += `: ${finding.value}`;
      if (finding.reference) text += ` (${finding.reference})`;
      text += `\n`;
    });
  }

  return text.trim();
}

/**
 * Generate assessment section
 * @param {Object} interpretation - Report interpretation
 * @returns {string} - Assessment section
 */
function generateAssessment(interpretation) {
  let text = '';

  // Critical alerts
  if (interpretation.criticalAlerts && interpretation.criticalAlerts.length > 0) {
    text += `⚠️ CRITICAL ALERTS:\n`;
    interpretation.criticalAlerts.forEach(alert => {
      text += `  • ${alert}\n`;
    });
    text += '\n';
  }

  // Summary
  text += `Summary:\n${interpretation.summary}\n\n`;

  // Differential considerations
  if (interpretation.differentialConsiderations && interpretation.differentialConsiderations.length > 0) {
    text += `Differential Considerations:\n`;
    interpretation.differentialConsiderations.forEach((dx, index) => {
      text += `${index + 1}. ${dx}\n`;
    });
  }

  return text.trim();
}

/**
 * Generate plan section
 * @param {Object} interpretation - Report interpretation
 * @returns {string} - Plan section
 */
function generatePlan(interpretation) {
  let text = '';

  if (interpretation.recommendedActions && interpretation.recommendedActions.length > 0) {
    text += `Recommended Actions:\n`;
    interpretation.recommendedActions.forEach((action, index) => {
      text += `${index + 1}. ${action}\n`;
    });
  } else {
    text += `• Continue current management\n`;
    text += `• Monitor closely for changes\n`;
    text += `• Repeat studies as clinically indicated\n`;
  }

  if (interpretation.additionalNotes) {
    text += `\nAdditional Notes:\n${interpretation.additionalNotes}`;
  }

  return text.trim();
}

/**
 * Format report type for display
 * @param {string} type - Report type
 * @returns {string} - Formatted type
 */
function formatReportType(type) {
  const types = {
    lab: 'Laboratory Results',
    imaging: 'Imaging Study',
    note: 'Clinical Note',
    ecg: 'Electrocardiogram',
    general: 'Medical Report'
  };
  return types[type] || type.toUpperCase();
}

/**
 * Format structured data based on type
 * @param {Object} data - Structured data
 * @param {string} type - Report type
 * @returns {string} - Formatted data
 */
function formatStructuredData(data, type) {
  let text = '';

  if (type === 'lab' && data.results) {
    text += `Laboratory Results (${data.results.length} tests):\n`;
    data.results.slice(0, 10).forEach(result => {
      text += `  ${result.test}: ${result.value} ${result.unit}`;
      if (result.referenceRange) {
        text += ` (Ref: ${result.referenceRange})`;
      }
      text += '\n';
    });
  } else if (type === 'imaging') {
    if (data.modality) text += `Modality: ${data.modality}\n`;
    if (data.indication) text += `Indication: ${data.indication}\n`;
    if (data.technique) text += `\nTechnique:\n${data.technique}\n`;
  } else if (type === 'ecg' && data.rate) {
    text += `Rate: ${data.rate} bpm\n`;
    if (data.rhythm) text += `Rhythm: ${data.rhythm}\n`;
    if (data.axis) text += `Axis: ${data.axis}\n`;
    if (data.intervals) {
      text += `Intervals: PR ${data.intervals.pr || 'N/A'}, QRS ${data.intervals.qrs || 'N/A'}, QT ${data.intervals.qt || 'N/A'}\n`;
    }
  }

  return text;
}

/**
 * Generate a quick summary for notifications
 * @param {Object} report - Report
 * @returns {string} - Quick summary
 */
export function generateQuickSummary(report) {
  const interpretation = report.interpretation || {};

  let summary = interpretation.summary || 'Report processed';

  if (interpretation.criticalAlerts && interpretation.criticalAlerts.length > 0) {
    summary = `⚠️ CRITICAL: ${interpretation.criticalAlerts[0]}`;
  }

  return summary.substring(0, 200);
}

export default {
  generatePresentation,
  generateQuickSummary
};
