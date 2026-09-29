import { createBrowserSpeechProvider } from './browserSpeech';
import { createNeuralSpeechProvider } from './neuralSpeech';
import type { SpeakingStateListener } from './types';

export type BrowserSpeechController = {
  speakResponse: (text: string) => void;
  stopSpeaking: () => void;
  dispose: () => void;
};

export function createBrowserSpeechController(
  onSpeakingStateChange: SpeakingStateListener,
): BrowserSpeechController {
  const browserProvider = createBrowserSpeechProvider(onSpeakingStateChange);
  const neuralProvider = createNeuralSpeechProvider(onSpeakingStateChange);
  let neuralAvailable = true;
  let requestSequence = 0;
  let disposed = false;

  const speakResponse = (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    stopSpeaking();
    const sequence = requestSequence;

    void (async () => {
      if (neuralAvailable) {
        try {
          await neuralProvider.speak(trimmedText);
          if (sequence === requestSequence) return;
        } catch (error) {
          if (sequence !== requestSequence || isSpeechStop(error)) return;
          neuralAvailable = false;
        }
      }

      if (disposed || sequence !== requestSequence) return;
      try {
        await browserProvider.speak(trimmedText);
      } catch {
        onSpeakingStateChange(false);
      }
    })();
  };

  const stopSpeaking = () => {
    requestSequence += 1;
    neuralProvider.stop();
    browserProvider.stop();
    onSpeakingStateChange(false);
  };

  const isSpeechStop = (error: unknown) =>
    error instanceof Error && error.message === 'Speech stopped';

  return {
    speakResponse,
    stopSpeaking,
    dispose: () => {
      disposed = true;
      stopSpeaking();
      neuralProvider.dispose();
      browserProvider.dispose();
    },
  };
}