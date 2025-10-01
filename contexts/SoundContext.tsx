import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { isSoundEnabled as getSoundStatus, setSoundEnabled as saveSoundStatus } from '../services/soundService';

interface SoundContextType {
  isSoundEnabled: boolean;
  toggleSound: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(getSoundStatus());

  const toggleSound = useCallback(() => {
    const newStatus = !isSoundEnabled;
    setIsSoundEnabled(newStatus);
    saveSoundStatus(newStatus);
  }, [isSoundEnabled]);

  return (
    <SoundContext.Provider value={{ isSoundEnabled, toggleSound }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSoundSettings = (): SoundContextType => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSoundSettings must be used within a SoundProvider');
  }
  return context;
};
