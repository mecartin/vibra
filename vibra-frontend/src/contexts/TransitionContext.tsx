import React, { createContext, useContext, useState } from 'react';

interface TransitionContextType {
  matrixSymbols: string[];
  setMatrixSymbols: (symbols: string[]) => void;
  resultEmoji: string;
  setResultEmoji: (emoji: string) => void;
  isTransitioning: boolean;
  setIsTransitioning: (value: boolean) => void;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export const useTransition = () => {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('useTransition must be used within TransitionProvider');
  }
  return context;
};

export const TransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [matrixSymbols, setMatrixSymbols] = useState<string[]>([]);
  const [resultEmoji, setResultEmoji] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  return (
    <TransitionContext.Provider value={{
      matrixSymbols,
      setMatrixSymbols,
      resultEmoji,
      setResultEmoji,
      isTransitioning,
      setIsTransitioning
    }}>
      {children}
    </TransitionContext.Provider>
  );
};