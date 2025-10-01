import { playSound } from '../services/soundService';
import { useCallback } from 'react';

export const useSound = () => {
  const playClickSound = useCallback(() => {
    playSound('click');
  }, []);

  const playGenerateSound = useCallback(() => {
    playSound('generate');
  }, []);

  return { playClickSound, playGenerateSound };
};
