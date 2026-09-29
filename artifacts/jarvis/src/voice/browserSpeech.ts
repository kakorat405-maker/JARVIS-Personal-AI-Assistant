import type { DisposableTTSProvider, SpeakingStateListener } from './types';

const preferredVoiceNames = [
  'natural',
  'neural',
  'enhanced',
  'premium',
  'google us english',
  'microsoft aria',
  'samantha',
  'karen',
  'daniel',
];

function selectPreferredVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith('en'));
  const candidates =
    englishVoices.length > 0 ? englishVoices : voices.filter((voice) => voice.default);
  if (candidates.length === 0) return null;

  return [...candidates].sort((left, right) => {
    const score = (voice: SpeechSynthesisVoice) => {
      const name = voice.name.toLowerCase();
      const language = voice.lang.toLowerCase();
      const preferredNameIndex = preferredVoiceNames.findIndex((preferred) =>
        name.includes(preferred),
      );

      return (
        (preferredNameIndex === -1 ? 0 : preferredVoiceNames.length - preferredNameIndex) * 10 +
        (language === 'en-us' ? 8 : language.startsWith('en-') ? 4 : 0) +
        (voice.default ? 2 : 0) -
        (name.includes('compact') || name.includes('espeak') ? 4 : 0)
      );
    };

    return score(right) - score(left);
  })[0];
}

export function createBrowserSpeechProvider(
  onSpeakingStateChange: SpeakingStateListener,
): DisposableTTSProvider {
  if (
    typeof window === 'undefined' ||
    !window.speechSynthesis ||
    typeof SpeechSynthesisUtterance === 'undefined'
  ) {
    return {
      speak: async () => undefined,
      stop: () => onSpeakingStateChange(false),
      isSpeaking: () => false,
      dispose: () => undefined,
    };
  }

  const synthesis = window.speechSynthesis;
  let preferredVoice = selectPreferredVoice(synthesis.getVoices());
  let speechSequence = 0;
  let speaking = false;
  let activeReject: ((reason?: unknown) => void) | null = null;

  const setSpeaking = (value: boolean) => {
    speaking = value;
    onSpeakingStateChange(value);
  };

  const refreshVoices = () => {
    preferredVoice = selectPreferredVoice(synthesis.getVoices());
  };

  synthesis.addEventListener('voiceschanged', refreshVoices);

  const stop = () => {
    speechSequence += 1;
    synthesis.cancel();
    activeReject?.(new Error('Speech stopped'));
    activeReject = null;
    setSpeaking(false);
  };

  const speak = async (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    speechSequence += 1;
    const sequence = speechSequence;
    synthesis.cancel();
    setSpeaking(false);

    const utterance = new SpeechSynthesisUtterance(trimmedText);
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 0.96;
    utterance.pitch = 1;

    await new Promise<void>((resolve, reject) => {
      activeReject = reject;
      utterance.onstart = () => {
        if (sequence === speechSequence) setSpeaking(true);
      };
      utterance.onend = () => {
        if (sequence === speechSequence) {
          activeReject = null;
          setSpeaking(false);
          resolve();
        }
      };
      utterance.onerror = (event) => {
        if (sequence === speechSequence) {
          activeReject = null;
          setSpeaking(false);
          reject(new Error(`Browser speech failed: ${event.error}`));
        }
      };

      try {
        synthesis.speak(utterance);
      } catch (error) {
        activeReject = null;
        setSpeaking(false);
        reject(error);
      }
    });
  };

  return {
    speak,
    stop,
    isSpeaking: () => speaking,
    dispose: () => {
      synthesis.removeEventListener('voiceschanged', refreshVoices);
      stop();
    },
  };
}