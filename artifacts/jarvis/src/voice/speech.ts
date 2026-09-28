type SpeakingStateListener = (isSpeaking: boolean) => void;

export type BrowserSpeechController = {
  speakResponse: (text: string) => void;
  stopSpeaking: () => void;
  dispose: () => void;
};

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

export function createBrowserSpeechController(
  onSpeakingStateChange: SpeakingStateListener,
): BrowserSpeechController {
  if (
    typeof window === 'undefined' ||
    !window.speechSynthesis ||
    typeof SpeechSynthesisUtterance === 'undefined'
  ) {
    return {
      speakResponse: () => undefined,
      stopSpeaking: () => onSpeakingStateChange(false),
      dispose: () => undefined,
    };
  }

  const synthesis = window.speechSynthesis;
  let preferredVoice = selectPreferredVoice(synthesis.getVoices());
  let speechSequence = 0;

  const refreshVoices = () => {
    preferredVoice = selectPreferredVoice(synthesis.getVoices());
  };

  synthesis.addEventListener('voiceschanged', refreshVoices);

  const stopSpeaking = () => {
    speechSequence += 1;
    synthesis.cancel();
    onSpeakingStateChange(false);
  };

  const speakResponse = (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    speechSequence += 1;
    const sequence = speechSequence;
    synthesis.cancel();
    onSpeakingStateChange(false);

    const utterance = new SpeechSynthesisUtterance(trimmedText);
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 0.96;
    utterance.pitch = 1;
    utterance.onstart = () => {
      if (sequence === speechSequence) onSpeakingStateChange(true);
    };
    utterance.onend = () => {
      if (sequence === speechSequence) onSpeakingStateChange(false);
    };
    utterance.onerror = () => {
      if (sequence === speechSequence) onSpeakingStateChange(false);
    };

    try {
      synthesis.speak(utterance);
    } catch {
      if (sequence === speechSequence) onSpeakingStateChange(false);
    }
  };

  return {
    speakResponse,
    stopSpeaking,
    dispose: () => {
      synthesis.removeEventListener('voiceschanged', refreshVoices);
      stopSpeaking();
    },
  };
}