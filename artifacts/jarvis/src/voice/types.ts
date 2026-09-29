export type SpeakingStateListener = (isSpeaking: boolean) => void;

export interface TTSProvider {
  speak(text: string): Promise<void>;
  stop(): void;
  isSpeaking(): boolean;
}

export interface DisposableTTSProvider extends TTSProvider {
  dispose(): void;
}