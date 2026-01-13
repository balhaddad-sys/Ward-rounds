/**
 * Medical Document Interpreter
 * Generates interpretations, clinical pearls, and questions from medical documents
 *
 * UPDATED: Now uses Google Apps Script for AI interpretation with fallback to mock system
 */

/**
 * Interpret a medical document
 * @param {Object} ocrResult - Extracted text and metadata
 * @param {boolean} useGoogleScript - Whether to use Google Script (default: true)
 * @returns {Promise<Object>} Interpretation with findings, assessment, and recommendations
 */
export async function interpretDocument(ocrResult, useGoogleScript = true) {
  const { rawText, type, parsed } = ocrResult;

  console.log('[AI] Interpreting document...');

  // Try Google Apps Script first if enabled
  if (useGoogleScript) {
    try {
      console.log('[AI] Attempting Google Apps Script interpretation...');
      const { interpretWithGoogleScript } = await import('@/lib/services/googleScript');

      const result = await interpretWithGoogleScript(ocrResult, type);

      if (result && result.success) {
        console.log('[AI] ✓ Using Google Apps Script interpretation');
        return {
          ...result.interpretation,
          source: 'google_script',
          usedAI: true
        };
      }
    } catch (error) {
      console.warn('[AI] Google Script failed, falling back to mock:', error.message);
    }
  }

  // Fallback to mock system
  console.log('[AI] Using mock interpretation system');

  // Simulate processing delay
  await delay(1500);

  const interpretation = (() => {
    switch (type) {
      case 'lab':
        return interpretLabResults(parsed, rawText);
      case 'imaging':
        return interpretImagingReport(parsed, rawText);
      case 'note':
        return interpretClinicalNote(parsed, rawText);
      default:
        return interpretGeneral(rawText);
    }
  })();

  return {
    ...interpretation,
    source: 'mock',
    usedAI: false
  };
}

/**
 * Interpret lab results
 */
function interpretLabResults(parsed, rawText) {
  const findings = [];
  const abnormals = [];

  // Analyze each test result
  parsed.results?.forEach(result => {
    const value = parseFloat(result.value);
    const test = result.test.toLowerCase();

    // Simple heuristics for common labs
    if (test.includes('hemoglobin') || test.includes('hgb')) {
      if (value < 12) {
        findings.push({
          finding: `Low hemoglobin (${result.value} ${result.unit})`,
          significance: 'Suggests anemia. Further workup needed to determine etiology.',
          status: 'abnormal',
          category: 'Hematology'
        });
        abnormals.push('anemia');
      }
    } else if (test.includes('sodium') || test.includes('na')) {
      if (value < 135) {
        findings.push({
          finding: `Hyponatremia (${result.value} ${result.unit})`,
          significance: 'Low sodium. Check volume status and consider SIADH, CHF, or medications.',
          status: 'abnormal',
          category: 'Chemistry'
        });
        abnormals.push('hyponatremia');
      } else if (value > 145) {
        findings.push({
          finding: `Hypernatremia (${result.value} ${result.unit})`,
          significance: 'Elevated sodium. Assess hydration status and free water deficit.',
          status: 'abnormal',
          category: 'Chemistry'
        });
        abnormals.push('hypernatremia');
      }
    } else if (test.includes('potassium') || test.includes('k')) {
      if (value < 3.5) {
        findings.push({
          finding: `Hypokalemia (${result.value} ${result.unit})`,
          significance: 'Low potassium. Risk of arrhythmias. Check EKG and replete.',
          status: 'abnormal',
          category: 'Chemistry'
        });
        abnormals.push('hypokalemia');
      } else if (value > 5.0) {
        findings.push({
          finding: `Hyperkalemia (${result.value} ${result.unit})`,
          significance: 'Elevated potassium. Check EKG for peaked T waves. Consider treatment if >5.5.',
          status: 'critical',
          category: 'Chemistry'
        });
        abnormals.push('hyperkalemia');
      }
    } else if (test.includes('creatinine') || test.includes('cr')) {
      if (value > 1.2) {
        findings.push({
          finding: `Elevated creatinine (${result.value} ${result.unit})`,
          significance: 'Possible acute or chronic kidney injury. Calculate GFR and trend values.',
          status: 'abnormal',
          category: 'Renal'
        });
        abnormals.push('renal dysfunction');
      }
    } else if (test.includes('glucose')) {
      if (value < 70) {
        findings.push({
          finding: `Hypoglycemia (${result.value} ${result.unit})`,
          significance: 'Low blood glucose. Treat urgently if symptomatic.',
          status: 'critical',
          category: 'Endocrine'
        });
      } else if (value > 200) {
        findings.push({
          finding: `Hyperglycemia (${result.value} ${result.unit})`,
          significance: 'Elevated glucose. Consider diabetes workup or insulin adjustment.',
          status: 'abnormal',
          category: 'Endocrine'
        });
      }
    } else if (test.includes('wbc') || test.includes('white')) {
      if (value > 11) {
        findings.push({
          finding: `Leukocytosis (${result.value} ${result.unit})`,
          significance: 'Elevated WBC. Consider infection, inflammation, or stress response.',
          status: 'abnormal',
          category: 'Hematology'
        });
        abnormals.push('leukocytosis');
      }
    }
  });

  // If no abnormal findings
  if (findings.length === 0) {
    findings.push({
      finding: 'All laboratory values within normal limits',
      significance: 'No immediate concerns from lab results.',
      status: 'normal',
      category: 'General'
    });
  }

  return {
    summary: generateLabSummary(findings, abnormals),
    findings,
    assessment: generateLabAssessment(abnormals),
    recommendations: generateLabRecommendations(abnormals),
    severity: findings.some(f => f.status === 'critical') ? 'critical' :
              findings.some(f => f.status === 'abnormal') ? 'moderate' : 'low'
  };
}

/**
 * Interpret imaging report
 */
function interpretImagingReport(parsed, rawText) {
  const text = rawText.toLowerCase();
  const findings = [];

  // Pattern matching for common imaging findings
  if (text.includes('pneumonia') || text.includes('infiltrate') || text.includes('consolidation')) {
    findings.push({
      finding: 'Possible pneumonia or infiltrate',
      significance: 'Consider antibiotics if clinically indicated. Follow up imaging recommended.',
      status: 'abnormal',
      category: 'Pulmonary'
    });
  }

  if (text.includes('fracture') || text.includes('broken')) {
    findings.push({
      finding: 'Fracture identified',
      significance: 'Orthopedic consultation recommended. Immobilize and manage pain.',
      status: 'critical',
      category: 'Musculoskeletal'
    });
  }

  if (text.includes('effusion')) {
    findings.push({
      finding: 'Pleural or joint effusion noted',
      significance: 'Consider diagnostic tap if large or symptomatic.',
      status: 'abnormal',
      category: 'General'
    });
  }

  if (text.includes('mass') || text.includes('lesion') || text.includes('nodule')) {
    findings.push({
      finding: 'Mass or lesion identified',
      significance: 'Further characterization needed. Consider biopsy or advanced imaging.',
      status: 'abnormal',
      category: 'Oncology'
    });
  }

  if (text.includes('normal') && text.includes('unremarkable')) {
    findings.push({
      finding: 'Study appears normal',
      significance: 'No acute findings on imaging.',
      status: 'normal',
      category: 'General'
    });
  }

  if (findings.length === 0) {
    findings.push({
      finding: 'Imaging findings noted',
      significance: 'Review images with radiologist for detailed interpretation.',
      status: 'pending',
      category: 'General'
    });
  }

  return {
    summary: `Imaging study reviewed. ${findings.length} finding(s) identified.`,
    findings,
    assessment: generateImagingAssessment(findings),
    recommendations: ['Correlate with clinical presentation', 'Discuss with radiology if questions', 'Follow-up imaging as indicated'],
    severity: findings.some(f => f.status === 'critical') ? 'critical' :
              findings.some(f => f.status === 'abnormal') ? 'moderate' : 'low'
  };
}

/**
 * Interpret clinical note
 */
function interpretClinicalNote(parsed, rawText) {
  const { sections } = parsed;

  return {
    summary: 'Clinical documentation reviewed',
    findings: [{
      finding: 'Clinical note contains patient history and assessment',
      significance: 'Review all sections for complete clinical picture',
      status: 'informational',
      category: 'Documentation'
    }],
    assessment: 'Documentation appears complete. Verify all required elements present.',
    recommendations: [
      'Ensure all sections (SOAP) are addressed',
      'Document patient response to interventions',
      'Update problem list as needed'
    ],
    severity: 'low',
    sections
  };
}

/**
 * General document interpretation
 */
function interpretGeneral(rawText) {
  return {
    summary: 'Medical document reviewed',
    findings: [{
      finding: 'Document contains medical information',
      significance: 'Manual review recommended for detailed interpretation',
      status: 'pending',
      category: 'General'
    }],
    assessment: 'Document requires clinical correlation',
    recommendations: ['Review with appropriate specialist', 'Correlate with patient presentation'],
    severity: 'low'
  };
}

// Helper functions

function generateLabSummary(findings, abnormals) {
  if (abnormals.length === 0) {
    return 'Laboratory results within normal limits. No acute abnormalities detected.';
  }
  return `${findings.length} finding(s) noted: ${abnormals.slice(0, 3).join(', ')}${abnormals.length > 3 ? ', and others' : ''}.`;
}

function generateLabAssessment(abnormals) {
  if (abnormals.length === 0) {
    return 'No acute laboratory abnormalities requiring immediate intervention.';
  }
  return `Abnormal laboratory findings require clinical correlation and potential intervention. Key concerns: ${abnormals.join(', ')}.`;
}

function generateLabRecommendations(abnormals) {
  const recs = ['Correlate with clinical presentation', 'Trend values serially'];

  if (abnormals.includes('hyperkalemia')) {
    recs.push('Obtain EKG', 'Consider treatment protocol for hyperkalemia');
  }
  if (abnormals.includes('hypokalemia')) {
    recs.push('Replete potassium', 'Monitor for arrhythmias');
  }
  if (abnormals.includes('anemia')) {
    recs.push('Iron studies', 'Determine etiology of anemia');
  }
  if (abnormals.includes('renal dysfunction')) {
    recs.push('Calculate GFR', 'Adjust medications for renal function');
  }

  return recs;
}

function generateImagingAssessment(findings) {
  const critical = findings.filter(f => f.status === 'critical');
  const abnormal = findings.filter(f => f.status === 'abnormal');

  if (critical.length > 0) {
    return `Critical findings requiring urgent attention: ${critical.map(f => f.finding).join(', ')}.`;
  }
  if (abnormal.length > 0) {
    return `Abnormal findings noted: ${abnormal.map(f => f.finding).join(', ')}. Clinical correlation recommended.`;
  }
  return 'No acute findings requiring urgent intervention.';
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  interpretDocument
};
