const SOUND_ENABLED_KEY = 'virtual-try-on-sound-enabled';

// Minimalist click sound
const CLICK_SOUND = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaW5nIENTUkFQX1kAAITTFu4AAAAAADEv/////////3//ev/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////MUTEbAAAAAkBwgQcMAb/2/MUTEbAAAAAkBwggcMAb/3/MUTEbAAAAAkBwggcMAb/4/MUTEbAAAAAkBwggcMAb/5/MUTEbAAAAAkBwggcMAb/6/MUTEbAAAAAkBwggcMAb/7/MUTEbAAAAAkBwggcMAb/8/MUTEbAAAAAkBwggcMAb/9/MUTEbAAAAAkBwggcMAb/+/MUTEbAAAAAkBwggcMAb///MUTEbAAAAAkBwgAA';
// Slightly different sound for major actions like 'generate'
const GENERATE_SOUND = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaW5nIENTUkFQX1kAAITTFu8AAAAAADEv/////////3//ev/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////MUTEbAAAAAkBwggcMAb/2/MUTEbAAAAAkBwggcMAb/3/MUTEbAAAAAkBwggcMAb/4/MUTEbAAAAAkBwggcMAb/5/MUTEbAAAAAkBwggcMAb/6/MUTEbAAAAAkBwggcMAb/7/MUTEbAAAAAkBwggcMAb/8/MUTEbAAAAAkBwggcMAb/9/MUTEbAAAAAkBwggcMAb/+/MUTEbAAAAAkBwggcMAb///MUTEbAAAAAkBwgAA';

const sounds = {
  click: CLICK_SOUND,
  generate: GENERATE_SOUND,
};

let audioContext: AudioContext | null = null;
const audioBuffers: { [key: string]: AudioBuffer } = {};

async function getAudioContext(): Promise<AudioContext> {
  if (audioContext && audioContext.state !== 'closed') {
    return audioContext;
  }
  audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioContext;
}

async function loadSound(type: keyof typeof sounds) {
  if (audioBuffers[type]) {
    return audioBuffers[type];
  }
  try {
    const context = await getAudioContext();
    const response = await fetch(sounds[type]);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    audioBuffers[type] = audioBuffer;
    return audioBuffer;
  } catch (error) {
    console.error(`Error loading sound "${type}":`, error);
    return null;
  }
}

// Preload sounds for better performance
loadSound('click');
loadSound('generate');

/**
 * Checks if sound is enabled in localStorage.
 * Defaults to true if not set.
 */
export const isSoundEnabled = (): boolean => {
  try {
    const storedValue = localStorage.getItem(SOUND_ENABLED_KEY);
    return storedValue === null ? true : storedValue === 'true';
  } catch (e) {
    return true; // Default to enabled if localStorage fails
  }
};

/**
 * Saves the sound enabled state to localStorage.
 */
export const setSoundEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
  } catch (e) {
    console.error('Could not save sound setting to local storage:', e);
  }
};

/**
 * Plays a sound if sounds are enabled.
 */
export const playSound = async (type: keyof typeof sounds): Promise<void> => {
  if (!isSoundEnabled()) {
    return;
  }
  
  try {
    const context = await getAudioContext();
    // Resume context if it's suspended (e.g., due to browser auto-play policy)
    if (context.state === 'suspended') {
      await context.resume();
    }
    
    const buffer = await loadSound(type);
    if (!buffer) return;

    const source = context.createBufferSource();
    source.buffer = buffer;
    
    const gainNode = context.createGain();
    gainNode.gain.setValueAtTime(0.4, context.currentTime); // Lower volume for subtlety
    
    source.connect(gainNode);
    gainNode.connect(context.destination);
    source.start(0);
  } catch (error) {
    console.error(`Could not play sound "${type}":`, error);
  }
};
