
import { TrialData, ResponseType, TestResultMetrics, UserDemographics, StimulusType, FullScaleResults, TScores } from '../types';

// --- V2.0 Simulated Norms Database ---
// Data structure: Age Range -> Gender -> { meanRT, sdRT, allowedComm, allowedOmm }
// Note: For errors (Comm/Omm), we use "allowed" as Mean, and estimate SD as max(1, Mean/2) for prototype purposes.

interface NormEntry {
  meanRT: number;
  sdRT: number;
  allowedComm: number;
  allowedOmm: number;
}

// Norm Lookup Table
const NORMS_DB: Record<string, Record<string, NormEntry>> = {
  '6-12': {
    'male':   { meanRT: 600, sdRT: 150, allowedComm: 5, allowedOmm: 3 },
    'female': { meanRT: 650, sdRT: 140, allowedComm: 3, allowedOmm: 4 },
  },
  '13-17': {
    'male':   { meanRT: 450, sdRT: 100, allowedComm: 4, allowedOmm: 2 },
    'female': { meanRT: 500, sdRT: 90,  allowedComm: 2, allowedOmm: 3 },
  },
  '18-40': {
    'male':   { meanRT: 350, sdRT: 60,  allowedComm: 3, allowedOmm: 1 },
    'female': { meanRT: 400, sdRT: 55,  allowedComm: 1, allowedOmm: 2 },
  },
  '41-60': {
    'male':   { meanRT: 400, sdRT: 70,  allowedComm: 2, allowedOmm: 2 },
    'female': { meanRT: 450, sdRT: 65,  allowedComm: 1, allowedOmm: 2 },
  },
  '60+': {
    'male':   { meanRT: 550, sdRT: 120, allowedComm: 3, allowedOmm: 4 },
    'female': { meanRT: 550, sdRT: 120, allowedComm: 3, allowedOmm: 4 }, // Using same for elderly in this prototype
  }
};

/**
 * Get specific norm based on age and gender
 */
function getNorms(age: number, gender: 'male' | 'female'): NormEntry {
  let ageKey = '18-40'; // Default
  if (age >= 6 && age <= 12) ageKey = '6-12';
  else if (age >= 13 && age <= 17) ageKey = '13-17';
  else if (age >= 18 && age <= 40) ageKey = '18-40';
  else if (age >= 41 && age <= 60) ageKey = '41-60';
  else if (age > 60) ageKey = '60+';

  // Fallback for extreme ages if needed
  if (!NORMS_DB[ageKey]) ageKey = '18-40';

  return NORMS_DB[ageKey][gender];
}

/**
 * Helper to get readable age group name for Report
 */
export function getNormAgeGroup(age: number): string {
  if (age >= 6 && age <= 12) return "6-12岁 儿童组";
  if (age >= 13 && age <= 17) return "13-17岁 青少年组";
  if (age >= 18 && age <= 40) return "18-40岁 青年组";
  if (age >= 41 && age <= 60) return "41-60岁 中年组";
  if (age > 60) return "60岁+ 老年组";
  return "未知组别";
}

/**
 * Calculate Z-Score and convert to T-Score
 * T = 50 - (Z * 10)
 * Logic: We want Higher T = Better Performance.
 * Since RT and Errors are "Lower is Better", a positive Z (User > Norm) means bad performance.
 * So T = 50 - (Positive Z * 10) = Score < 50. Correct.
 */
function calculateTScore(userValue: number, normMean: number, normSD: number): number {
  if (normSD === 0) return 50;
  const z = (userValue - normMean) / normSD;
  const t = 50 - (z * 10);
  
  // Clamp T-Score reasonably (e.g., 0 to 100) to prevent UI breakage
  return Math.max(0, Math.min(100, Math.round(t)));
}

/**
 * Calculate Percentile Rank from T-Score
 * Using Error Function approximation for Normal CDF
 */
export function calculatePercentile(tScore: number): number {
  // Convert T-Score back to Z-Score (where Higher T is Higher Z in terms of "Goodness")
  // Z = (T - 50) / 10
  const z = (tScore - 50) / 10;
  
  // Constants for approximation
  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;

  const sign = (z < 0) ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2.0);
  const t = 1.0 / (1.0 + p * x);
  const erf = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  const probability = 0.5 * (1.0 + sign * erf);
  return Math.round(probability * 100);
}

/**
 * Calculate Stats Helper
 */
function calculateStats(rts: number[]) {
  if (rts.length === 0) return { mean: 0, sd: 0 };
  const mean = rts.reduce((a, b) => a + b, 0) / rts.length;
  const variance = rts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / rts.length;
  const sd = Math.sqrt(variance);
  return { mean, sd };
}

/**
 * Compute Scores for a Dimension Subset
 */
function computeDimensionScores(data: TrialData[], norm: NormEntry): TScores {
  const hits = data.filter(d => d.responseType === ResponseType.HIT);
  const misses = data.filter(d => d.responseType === ResponseType.MISS);
  const fas = data.filter(d => d.responseType === ResponseType.FALSE_ALARM);
  
  // 1. Speed (RT)
  const rts = hits.map(d => d.responseTime || 0);
  const { mean: userMeanRT, sd: userSDRT } = calculateStats(rts);
  // If no hits, assign a penalty RT (e.g. Norm Mean + 3 SD)
  const effectiveRT = hits.length > 0 ? userMeanRT : (norm.meanRT + 3 * norm.sdRT);
  const tSpeed = calculateTScore(effectiveRT, norm.meanRT, norm.sdRT);

  // 2. Focus (Consistency/SD of RT)
  // Using Norm SD RT as the benchmark for "Normal Variability"
  // If User SD > Norm SD, they are inconsistent.
  // Heuristic: Norm for SD is roughly NormSD itself? 
  // For V2 prototype, let's use Norm.sdRT as the Mean for SD, and (Norm.sdRT/2) as the SD for SD.
  const effectiveSDRT = hits.length > 0 ? userSDRT : (norm.sdRT * 2);
  const tFocus = calculateTScore(effectiveSDRT, norm.sdRT, norm.sdRT / 3);

  // 3. Vigilance (Omissions)
  // Heuristic SD for errors = Max(1, Mean/2)
  const ommSD = Math.max(1, norm.allowedOmm / 2);
  const tVigilance = calculateTScore(misses.length, norm.allowedOmm, ommSD);

  // 4. Prudence (Commissions)
  const commSD = Math.max(1, norm.allowedComm / 2);
  const tPrudence = calculateTScore(fas.length, norm.allowedComm, commSD);

  return {
    speed: tSpeed,
    focus: tFocus,
    vigilance: tVigilance,
    prudence: tPrudence
  };
}

/**
 * Main Analysis Function
 */
export function analyzeResults(data: TrialData[], extraClicks: number, user: UserDemographics): TestResultMetrics {
  const norm = getNorms(user.age, user.gender);

  // 1. Partition Data
  const visualData = data.filter(d => d.phaseId.toUpperCase().includes('VISUAL') || d.phaseId.includes('PHASE_1'));
  const auditoryData = data.filter(d => d.phaseId.toUpperCase().includes('AUDIO') || d.phaseId.includes('PHASE_3'));

  // 2. Compute T-Scores
  const visScores = computeDimensionScores(visualData, norm);
  const audScores = computeDimensionScores(auditoryData, norm);

  // 3. Calculate Risk Probability S
  // Logic: S increases if T scores are low (< 40).
  // Weighting: Vigilance/Prudence (Errors) weighted higher than Speed.
  
  let riskAccumulator = 0;

  const assessRisk = (t: number, weight: number) => {
    if (t < 40) {
      // Risk increases by (40 - T) * Weight
      riskAccumulator += (40 - t) * weight;
    }
  };

  // Visual Risks
  assessRisk(visScores.vigilance, 1.5); // Misses
  assessRisk(visScores.prudence, 1.5);  // False Alarms
  assessRisk(visScores.speed, 0.5);     // RT
  assessRisk(visScores.focus, 1.0);     // Consistency

  // Auditory Risks
  assessRisk(audScores.vigilance, 1.5);
  assessRisk(audScores.prudence, 1.5);
  assessRisk(audScores.speed, 0.5);
  assessRisk(audScores.focus, 1.0);

  // Hyperactivity Risk
  // Logic: extraClicks. Norm? Assume 0-2 is normal.
  // Each click > 2 adds risk.
  const hyperRisk = Math.max(0, (extraClicks - 2) * 5);
  riskAccumulator += hyperRisk;

  // Normalize S to 0-99
  const s = Math.min(99, Math.round(riskAccumulator));

  // --- Raw Stats ---
  const allHits = data.filter(d => d.responseType === ResponseType.HIT);
  const allMisses = data.filter(d => d.responseType === ResponseType.MISS);
  const allFAs = data.filter(d => d.responseType === ResponseType.FALSE_ALARM);
  const rts = allHits.map(d => d.responseTime || 0);
  const { mean, sd } = calculateStats(rts);

  return {
    totalTrials: data.length,
    hits: allHits.length,
    misses: allMisses.length,
    falseAlarms: allFAs.length,
    correctRejections: 0, // Simplified
    extraClicks,
    
    hitRate: 0, 
    omissionRate: 0,
    commissionRate: 0,
    meanRT: Math.round(mean),
    sdRT: Math.round(sd),

    simulated: {
      visual: visScores,
      auditory: audScores,
      hyperactivityCount: extraClicks,
      riskProbability: s
    }
  };
}
