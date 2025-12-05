
export enum StimulusType {
  TARGET = 'TARGET',
  NON_TARGET = 'NON_TARGET',
}

export enum ResponseType {
  HIT = 'HIT', // Target + Response
  MISS = 'MISS', // Target + No Response
  FALSE_ALARM = 'FALSE_ALARM', // Non-Target + Response
  CORRECT_REJECTION = 'CORRECT_REJECTION', // Non-Target + No Response
}

export interface TrialData {
  trialId: number;
  phaseId: string; // Track which phase this trial belongs to
  stimulus: string; // The actual content shown (X, O, S, V)
  stimulusType: StimulusType; // Logical type
  timestamp: number; // When stimulus appeared
  responseTime: number | null; // ms from stimulus onset
  responseType: ResponseType;
}

export type AssetType = 'text' | 'image' | 'audio';

export interface PhaseConfig {
  id: string;
  type: 'TEST' | 'REST';
  duration: number; // ms
  
  // Test specific configs
  hasCountdown?: boolean; // 3-2-1 start
  initialDelay?: number; // ms before first stimulus
  minISI?: number; // ms
  maxISI?: number; // ms
  stimulusDuration?: number; // ms
  targetProbability?: number;
  
  // Assets
  assetType?: AssetType;
  targetAsset?: string; // "X" or image path
  nonTargetAsset?: string; // "O" or image path
}

export interface TestConfig {
  phases: PhaseConfig[];
}

export interface UserDemographics {
  age: number;
  gender: 'male' | 'female';
}

// --- V2.0 Scoring Types (T-Scores) ---

export interface TScores {
  // T-Score: Mean=50, SD=10. Higher is better (consistent with standard IQ/Quotient logic in UI, though raw calculation usually inverts it)
  // Logic: < 40 indicates risk (1 SD below mean)
  
  vigilance: number; // Omissions T-Score
  speed: number;     // RT T-Score
  focus: number;     // RT Consistency (SD) T-Score
  prudence: number;  // Commissions T-Score
}

export interface FullScaleResults {
  visual: TScores;
  auditory: TScores;
  
  // Global Risk
  hyperactivityCount: number;
  riskProbability: number; // 0-99%
}

export interface TestResultMetrics {
  totalTrials: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  correctRejections: number;
  extraClicks: number;
  
  // Raw Stats
  hitRate: number;
  omissionRate: number;
  commissionRate: number;
  meanRT: number;
  sdRT: number;
  
  // V2.0 Norm-Referenced Scoring
  simulated: FullScaleResults;
}
