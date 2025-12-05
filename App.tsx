
import React, { useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import TestScreen from './components/TestScreen';
import ResultsScreen from './components/ResultsScreen';
import { TrialData, UserDemographics } from './types';

type AppState = 'WELCOME' | 'TEST' | 'RESULTS';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('WELCOME');
  const [results, setResults] = useState<TrialData[]>([]);
  const [extraClicks, setExtraClicks] = useState<number>(0);
  const [userDemographics, setUserDemographics] = useState<UserDemographics | null>(null);

  const startTest = (demographics: UserDemographics) => {
    setUserDemographics(demographics);
    setAppState('TEST');
  };

  const handleTestComplete = (data: TrialData[], clicks: number) => {
    setResults(data);
    setExtraClicks(clicks);
    setAppState('RESULTS');
  };

  // Called when user aborts the test via the Exit button
  const handleExit = () => {
    setResults([]);
    setExtraClicks(0);
    // We keep the demographics so they don't have to re-enter them, but return to welcome screen
    setAppState('WELCOME');
  };

  const restartTest = () => {
    setResults([]);
    setExtraClicks(0);
    setUserDemographics(null); 
    setAppState('WELCOME');
  };

  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-blue-500/30">
      <main className={appState === 'RESULTS' ? 'container mx-auto px-4 py-6 min-h-screen flex flex-col min-h-0 overflow-y-auto' : 'container mx-auto px-4 py-6 min-h-screen flex flex-col min-h-0'}>
        {/* Header */}
        {appState !== 'TEST' && (
          <header className="flex justify-between items-center py-4 mb-8 border-b border-gray-800">
            <div className="text-xl font-bold tracking-tighter text-blue-500">NeuroScale CPT</div>
            <div className="text-xs text-gray-500 font-mono">v2.3 Prototype (CN)</div>
          </header>
        )}

        <div className={appState === 'RESULTS' ? 'flex-grow flex flex-col overflow-y-auto' : 'flex-grow flex flex-col justify-center'}>
          {appState === 'WELCOME' && <WelcomeScreen onStart={startTest} initialDemographics={userDemographics} />}
          {appState === 'TEST' && <TestScreen onComplete={handleTestComplete} onExit={handleExit} />}
          {appState === 'RESULTS' && userDemographics && (
            <ResultsScreen 
              data={results} 
              extraClicks={extraClicks} 
              user={userDemographics} 
              onRestart={restartTest} 
            />
          )}
        </div>
        
        {/* Footer */}
        {appState !== 'TEST' && (
          <footer className="py-6 text-center text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} CPT Prototype. 隐私保护模式：仅本地运行。
          </footer>
        )}
      </main>
    </div>
  );
};

export default App;
