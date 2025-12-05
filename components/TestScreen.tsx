
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { APP_CONFIG, KEY_CODE } from '../constants';
import { StimulusType, ResponseType, TrialData, PhaseConfig } from '../types';
import { Coffee, LogOut } from 'lucide-react';

interface TestScreenProps {
  onComplete: (data: TrialData[], extraClicks: number) => void;
  onExit: () => void;
}

type InternalPhaseState = 'IDLE' | 'COUNTDOWN' | 'RUNNING' | 'RESTING' | 'COMPLETED';

const TestScreen: React.FC<TestScreenProps> = ({ onComplete, onExit }) => {
  // --- UI State ---
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseState, setPhaseState] = useState<InternalPhaseState>('IDLE');
  
  // Stimulus Display
  const [displayedContent, setDisplayedContent] = useState<string | null>(null);
  const [isStimulusVisible, setIsStimulusVisible] = useState(false);
  
  // Feedback / Overlay
  const [showFeedback, setShowFeedback] = useState(false);
  const [countdownValue, setCountdownValue] = useState(0);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);

  // --- Logic Refs ---
  const gameState = useRef({
    isRunning: false,
    results: [] as TrialData[],
    extraClicks: 0,
    
    // Timing & Loop
    phaseStartTime: 0,
    nextStimulusTime: 0,
    currentTrialId: 0,
    
    // Current Stimulus Logic
    currentStimulusType: null as StimulusType | null,
    currentAsset: '',
    trialStartTime: 0,
    hasResponded: false,
    
    // Config caching
    config: APP_CONFIG.phases[0]
  });

  const feedbackTimeoutRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Helpers ---

  const getRandomISI = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  const getNextStimulusType = (prob: number) => {
    return Math.random() < prob ? StimulusType.TARGET : StimulusType.NON_TARGET;
  };

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = 'auto';
    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {}
        audioRef.current = null;
      }
    };
  }, []);

  const finishTest = useCallback(() => {
    gameState.current.isRunning = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    onComplete(gameState.current.results, gameState.current.extraClicks);
  }, [onComplete]);

  // --- Input Handling ---

  const pendingResponse = useRef<{ time: number } | null>(null);

  // Unified Input Handler for both Keyboard (Space) and Touch (Screen Tap)
  const handleInputTrigger = useCallback(() => {
    if (phaseState === 'RUNNING') {
      setShowFeedback(true);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = window.setTimeout(() => setShowFeedback(false), 150);
    }

    const currentConfig = APP_CONFIG.phases[currentPhaseIndex];
    
    if (phaseState !== 'RUNNING' || currentConfig.type !== 'TEST') {
        return;
    }
    
    const state = gameState.current;

    if (!state.currentStimulusType) {
      state.extraClicks++;
      return;
    }

    if (state.hasResponded) {
      state.extraClicks++;
    } else {
      state.hasResponded = true;
      pendingResponse.current = { time: performance.now() };
    }
  }, [phaseState, currentPhaseIndex]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code !== KEY_CODE) return;
    e.preventDefault();
    handleInputTrigger();
  }, [handleInputTrigger]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, [handleKeyDown]);

  // --- Phase Management ---

  const startPhase = useCallback((index: number) => {
    if (index >= APP_CONFIG.phases.length) {
      finishTest();
      return;
    }

    const config = APP_CONFIG.phases[index];
    setCurrentPhaseIndex(index);
    gameState.current.config = config;
    
    if (config.type === 'REST') {
      setPhaseState('RESTING');
      setRestTimeRemaining(Math.ceil(config.duration / 1000));
    } else {
      // Test Phase
      if (config.hasCountdown) {
        setPhaseState('COUNTDOWN');
        setCountdownValue(3);
      } else {
        initRunPhase(config);
      }
    }
  }, [finishTest]);

  const initRunPhase = (config: PhaseConfig) => {
    setPhaseState('RUNNING');
    gameState.current.isRunning = true;
    gameState.current.phaseStartTime = performance.now();
    
    const initialDelay = config.initialDelay || 2000;
    gameState.current.nextStimulusTime = performance.now() + initialDelay;
    gameState.current.currentStimulusType = null;
    setIsStimulusVisible(false);
  };

  // --- Main Loop ---

  useEffect(() => {
    // 1. Countdown Logic
    if (phaseState === 'COUNTDOWN') {
      if (countdownValue > 0) {
        const timer = setTimeout(() => setCountdownValue(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        initRunPhase(APP_CONFIG.phases[currentPhaseIndex]);
      }
    }

    // 2. Rest Logic
    if (phaseState === 'RESTING') {
      if (restTimeRemaining > 0) {
        const timer = setTimeout(() => setRestTimeRemaining(t => t - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        startPhase(currentPhaseIndex + 1);
      }
    }

    // 3. Running Logic (RAF)
    if (phaseState === 'RUNNING') {
      const loop = (now: number) => {
        const state = gameState.current;
        const config = state.config;

        if (now - state.phaseStartTime >= config.duration) {
          if (state.currentStimulusType) {
             finalizeTrial(state, pendingResponse.current, now);
          }
          state.isRunning = false;
          setIsStimulusVisible(false);
          startPhase(currentPhaseIndex + 1);
          return; 
        }

        if (isStimulusVisible) {
          if (now - state.trialStartTime >= (config.stimulusDuration || 100)) {
            setIsStimulusVisible(false);
          }
        }

        if (now >= state.nextStimulusTime) {
          if (state.currentStimulusType) {
            finalizeTrial(state, pendingResponse.current, now);
          }

          const nextType = getNextStimulusType(config.targetProbability || 0.2);
          const nextAsset = nextType === StimulusType.TARGET 
            ? config.targetAsset || 'X' 
            : config.nonTargetAsset || 'O';
          
          state.currentStimulusType = nextType;
          state.currentAsset = nextAsset;
          state.trialStartTime = now;
          state.hasResponded = false;
          state.currentTrialId++;
          pendingResponse.current = null;

          setDisplayedContent(nextAsset);
          setIsStimulusVisible(true);

          const isi = getRandomISI(config.minISI || 2000, config.maxISI || 5000);
          state.nextStimulusTime = now + (config.stimulusDuration || 100) + isi;
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }

    if (phaseState === 'IDLE') {
      startPhase(0);
    }

  }, [phaseState, countdownValue, restTimeRemaining, currentPhaseIndex, startPhase, isStimulusVisible]);

  useEffect(() => {
    const cfg = APP_CONFIG.phases[currentPhaseIndex];
    if (!audioRef.current) return;
    if (cfg.assetType === 'audio' && isStimulusVisible && displayedContent) {
      audioRef.current.src = displayedContent;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } else if (cfg.assetType === 'audio' && !isStimulusVisible) {
      try { audioRef.current.pause(); } catch {}
    }
  }, [isStimulusVisible, displayedContent, currentPhaseIndex]);


  const finalizeTrial = (state: any, response: { time: number } | null, now: number) => {
    let rType: ResponseType;
    let rt: number | null = null;
    const stimType = state.currentStimulusType;

    if (stimType === StimulusType.TARGET) {
      if (response) {
        rType = ResponseType.HIT;
        rt = response.time - state.trialStartTime;
      } else {
        rType = ResponseType.MISS;
      }
    } else {
      if (response) {
        rType = ResponseType.FALSE_ALARM;
        rt = response.time - state.trialStartTime;
      } else {
        rType = ResponseType.CORRECT_REJECTION;
      }
    }

    state.results.push({
      trialId: state.currentTrialId,
      phaseId: state.config.id,
      stimulus: state.currentAsset,
      stimulusType: stimType,
      timestamp: state.trialStartTime,
      responseTime: rt,
      responseType: rType
    });
  };

  // --- RENDER ---

  const currentConfig = APP_CONFIG.phases[currentPhaseIndex];
  
  // Helper for Phase Name Display
  const getPhaseDisplayName = (id: string) => {
    if (id.includes('VISUAL')) return '视觉测试';
    if (id.includes('AUDIO')) return '听觉(替代)测试';
    if (id.includes('REST')) return '休息';
    return id;
  };

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen w-full relative overflow-hidden bg-background touch-manipulation cursor-pointer select-none"
      onPointerDown={handleInputTrigger}
    >
      
      {/* EXIT BUTTON */}
      <button 
        onClick={(e) => { e.stopPropagation(); onExit(); }}
        onPointerDown={(e) => e.stopPropagation()} // Prevent triggering input on exit
        className="absolute top-4 right-4 md:top-6 md:right-6 z-50 p-3 bg-gray-800/80 rounded-full text-gray-400 hover:text-white border border-gray-700 backdrop-blur-sm active:scale-95 transition-all shadow-lg"
        aria-label="退出测试"
      >
        <LogOut className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* --- COUNTDOWN OVERLAY --- */}
      {phaseState === 'COUNTDOWN' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/90 backdrop-blur-sm pointer-events-none">
           <div className="text-[8rem] md:text-[12rem] font-bold text-blue-500 animate-pulse font-mono">
             {countdownValue}
           </div>
        </div>
      )}

      {/* --- REST SCREEN --- */}
      {phaseState === 'RESTING' && (
        <div className="flex flex-col items-center justify-center space-y-8 animate-fade-in pointer-events-none p-4 text-center">
          <div className="p-6 md:p-8 bg-surface rounded-full border-4 border-gray-700">
            <Coffee className="w-12 h-12 md:w-16 md:h-16 text-green-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">休息时间 (Rest Phase)</h2>
          <div className="text-5xl md:text-6xl font-mono text-gray-300">
            {restTimeRemaining}s
          </div>
          <p className="text-gray-500 text-sm md:text-base">请放松您的眼睛，暂时无需操作。</p>
          <p className="text-gray-500 text-sm md:text-base">下一阶段为听力阶段，请提前调节好音量。</p>
        </div>
      )}

      {/* --- ACTIVE TEST SCREEN --- */}
      {phaseState === 'RUNNING' && (
        <>
          {/* Progress Bar (Time based) */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-800">
             <div className="h-full bg-blue-600 animate-progress" style={{ 
               animationDuration: `${currentConfig.duration}ms`,
               animationTimingFunction: 'linear',
               animationName: 'growWidth',
               width: '0%',
               animationFillMode: 'forwards'
             }} />
             <style>{`
               @keyframes growWidth {
                 from { width: 0%; }
                 to { width: 100%; }
               }
             `}</style>
          </div>

          <div className="absolute top-4 left-4 md:top-6 md:left-6 text-xs font-mono text-gray-500 uppercase tracking-widest pointer-events-none">
            阶段 {currentPhaseIndex + 1}: {getPhaseDisplayName(currentConfig.id)}
          </div>

          {/* Stimulus Area */}
          <div className="w-full max-w-[80vw] md:max-w-md aspect-square flex items-center justify-center relative pointer-events-none">
            <div className={`absolute inset-0 border-4 rounded-xl transition-colors duration-100 ${showFeedback ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'border-gray-800'}`} />
            
            {isStimulusVisible && displayedContent && (
              <div className="animate-pulse-fast select-none flex items-center justify-center">
                {currentConfig.assetType === 'text' ? (
                  <span className={`text-8xl md:text-9xl font-mono font-bold ${displayedContent === 'X' ? 'text-blue-100' : 'text-white'}`}>
                    {displayedContent}
                  </span>
                ) : currentConfig.assetType === 'image' ? (
                  <img src={displayedContent} alt="stimulus" className="w-32 h-32 md:w-48 md:h-48" />
                ) : (
                  <span className="text-xl md:text-2xl font-mono text-gray-300">声音</span>
                )}
              </div>
            )}
            
            {!isStimulusVisible && (
              <div className="w-2 h-2 bg-gray-700 rounded-full" /> 
            )}
          </div>

          {/* Feedback Indicator */}
          <div className={`mt-12 px-6 py-2 rounded-full border border-gray-700 font-mono text-sm transition-all duration-150 pointer-events-none ${showFeedback ? 'bg-white text-black translate-y-1' : 'bg-transparent text-gray-600'}`}>
            {showFeedback ? '输入已记录' : '...'}
          </div>
          
          <div className="absolute bottom-8 text-gray-600 text-xs animate-pulse pointer-events-none md:hidden">
             轻触屏幕任意位置进行反应
          </div>
        </>
      )}
    </div>
  );
};

export default TestScreen;
