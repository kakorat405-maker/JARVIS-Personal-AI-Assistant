export type JarvisSpeechRecognitionEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

export type JarvisSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: JarvisSpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export type JarvisSpeechRecognitionConstructor = new () => JarvisSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: JarvisSpeechRecognitionConstructor;
    webkitSpeechRecognition?: JarvisSpeechRecognitionConstructor;
  }
}