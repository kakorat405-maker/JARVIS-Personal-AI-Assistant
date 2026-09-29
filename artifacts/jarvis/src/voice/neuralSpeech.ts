import type { DisposableTTSProvider, SpeakingStateListener } from './types';

const TTS_ENDPOINT = '/api/tts';
const MAX_CACHE_ENTRIES = 24;
const MAX_CACHEABLE_CHARACTERS = 240;

type ActivePlayback = {
  audio: HTMLAudioElement;
  objectUrl: string;
  settle: (error?: Error) => void;
};

export function createNeuralSpeechProvider(
  onSpeakingStateChange: SpeakingStateListener,
): DisposableTTSProvider {
  let activePlayback: ActivePlayback | null = null;
  let requestSequence = 0;
  let speaking = false;
  const audioCache = new Map<string, Blob>();

  const setSpeaking = (value: boolean) => {
    speaking = value;
    onSpeakingStateChange(value);
  };

  const finishPlayback = (error?: Error) => {
    const current = activePlayback;
    if (!current) return;

    activePlayback = null;
    current.audio.onplay = null;
    current.audio.onended = null;
    current.audio.onerror = null;
    if (error) current.audio.pause();
    current.audio.src = '';
    URL.revokeObjectURL(current.objectUrl);
    setSpeaking(false);
    current.settle(error);
  };

  const stop = () => {
    requestSequence += 1;
    finishPlayback(new Error('Speech stopped'));
    setSpeaking(false);
  };

  const getAudioBlob = async (text: string): Promise<Blob> => {
    const cached = audioCache.get(text);
    if (cached) return cached;

    const response = await fetch(TTS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Neural TTS unavailable (${response.status})`);
    }

    const blob = await response.blob();
    if (text.length <= MAX_CACHEABLE_CHARACTERS) {
      audioCache.set(text, blob);
      while (audioCache.size > MAX_CACHE_ENTRIES) {
        const oldest = audioCache.keys().next().value;
        if (!oldest) break;
        audioCache.delete(oldest);
      }
    }
    return blob;
  };

  const speak = async (text: string) => {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') {
      throw new Error('Audio playback is unavailable');
    }

    const trimmedText = text.trim();
    if (!trimmedText) return;

    stop();
    const sequence = requestSequence;
    const blob = await getAudioBlob(trimmedText);
    if (sequence !== requestSequence) throw new Error('Speech stopped');

    const objectUrl = URL.createObjectURL(blob);
    const audio = new Audio(objectUrl);

    await new Promise<void>((resolve, reject) => {
      activePlayback = {
        audio,
        objectUrl,
        settle: (error) => (error ? reject(error) : resolve()),
      };
      audio.onplay = () => {
        if (sequence === requestSequence) setSpeaking(true);
      };
      audio.onended = () => finishPlayback();
      audio.onerror = () => finishPlayback(new Error('Neural audio playback failed'));

      void audio.play().catch((error: unknown) => finishPlayback(error as Error));
    });

    if (sequence !== requestSequence) throw new Error('Speech stopped');
  };

  return {
    speak,
    stop,
    isSpeaking: () => speaking,
    dispose: () => {
      stop();
      audioCache.clear();
    },
  };
}