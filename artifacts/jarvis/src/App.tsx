import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Activity,
  ArrowUp,
  Command,
  LoaderCircle,
  MessageCircle,
  Mic,
  Radio,
  X,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { routeCommand } from '@/skills/router';
import { loadNotes, loadTasks, saveNotes, saveTasks } from '@/skills/storage';
import type { JarvisNote, JarvisTask } from '@/skills/types';
import type { JarvisSpeechRecognition as BrowserSpeechRecognition } from '@/types/speech-recognition';
import {
  createBrowserSpeechController,
  type BrowserSpeechController,
} from '@/voice/speech';

type Message = {
  id: number;
  role: 'user' | 'jarvis';
  text: string;
};

type InteractionMode = 'voice' | 'chat';
type AssistantStatus = 'online' | 'listening' | 'thinking' | 'speaking';

const queryClient = new QueryClient();

const initialMessages: Message[] = [
  {
    id: 1,
    role: 'jarvis',
    text: 'All systems are online.',
  },
];

function ConversationFeed({
  messages,
  isThinking,
  compact = false,
}: {
  messages: Message[];
  isThinking: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`message-list${compact ? ' message-list-compact' : ''}`} aria-live="polite">
      {messages.map((message) => (
        <article
          className={`message ${message.role}`}
          key={message.id}
          data-testid={`message-${message.role}-${message.id}`}
        >
          <span className="message-marker" aria-hidden="true" />
          <div>
            <div className="message-meta">
              {message.role === 'user' ? 'You / command' : 'JARVIS / response'}
            </div>
            <p className="message-text">{message.text}</p>
          </div>
        </article>
      ))}
      {isThinking && (
        <article className="message jarvis thinking" data-testid="message-thinking">
          <span className="message-marker" aria-hidden="true" />
          <div>
            <div className="message-meta">
              <LoaderCircle size={11} className="thinking-icon" aria-hidden="true" />
              JARVIS / thinking
            </div>
            <p className="message-text">Working through that now...</p>
          </div>
        </article>
      )}
    </div>
  );
}

function Home() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [command, setCommand] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [tasks, setTasks] = useState<JarvisTask[]>(loadTasks);
  const [notes, setNotes] = useState<JarvisNote[]>(loadNotes);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const speechControllerRef = useRef<BrowserSpeechController | null>(null);

  useEffect(() => saveTasks(tasks), [tasks]);
  useEffect(() => saveNotes(notes), [notes]);
  useEffect(
    () => {
      const speechController = createBrowserSpeechController(setIsSpeaking);
      speechControllerRef.current = speechController;

      return () => {
        recognitionRef.current?.stop();
        speechController.dispose();
        speechControllerRef.current = null;
      };
    },
    [],
  );

  const addJarvisMessage = (text: string) => {
    setMessages((current) => [
      ...current,
      { id: Date.now() + Math.random(), role: 'jarvis', text },
    ]);
  };

  const stopSpeaking = () => {
    speechControllerRef.current?.stopSpeaking();
  };

  const speakResponse = (text: string) => {
    speechControllerRef.current?.speakResponse(text);
  };

  const processCommand = async (rawCommand: string, mode: InteractionMode) => {
    const trimmedCommand = rawCommand.trim();
    if (!trimmedCommand || isThinking) return;

    if (mode === 'voice') {
      stopSpeaking();
    }

    const commandId = Date.now();
    setMessages((current) => [
      ...current,
      { id: commandId, role: 'user', text: trimmedCommand },
    ]);
    setCommand('');
    setIsThinking(true);

    await new Promise((resolve) => window.setTimeout(resolve, 320));
    const result = routeCommand(trimmedCommand, {
      tasks,
      notes,
      now: new Date(),
    });

    if (result.tasks) setTasks(result.tasks);
    if (result.notes) setNotes(result.notes);
    addJarvisMessage(result.response);
    setIsThinking(false);
    if (mode === 'voice') {
      speakResponse(result.response);
    }

    if (result.timer) {
      const timerMessage = `Timer complete${result.timer.label ? `: ${result.timer.label}` : ''}.`;
      window.setTimeout(() => {
        addJarvisMessage(timerMessage);
        if (mode === 'voice') {
          speakResponse(timerMessage);
        }
      }, result.timer.durationMs);
    }
  };

  const sendChatCommand = (event?: FormEvent) => {
    event?.preventDefault();
    void processCommand(command, 'chat');
  };

  const toggleMicrophone = () => {
    if (isThinking) return;

    if (isSpeaking) {
      stopSpeaking();
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      addJarvisMessage(
        'Speech recognition is not available in this browser. You can type your command instead.',
      );
      return;
    }

    const recognition: BrowserSpeechRecognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) void processCommand(transcript, 'voice');
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      recognitionRef.current = null;
      addJarvisMessage(`Voice channel error: ${event.error}. You can type your command instead.`);
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    try {
      recognition.start();
    } catch {
      setIsListening(false);
      recognitionRef.current = null;
      addJarvisMessage('I could not access the microphone. Check your browser permission and try again.');
    }
  };

  const status: AssistantStatus = isListening
    ? 'listening'
    : isThinking
      ? 'thinking'
      : isSpeaking
        ? 'speaking'
        : 'online';
  const statusLabel = status === 'online' ? 'JARVIS ONLINE' : `JARVIS ${status.toUpperCase()}`;
  const orbCaption =
    status === 'listening'
      ? 'Listening'
      : status === 'thinking'
        ? 'Thinking'
        : status === 'speaking'
          ? 'Speaking'
          : 'Tap to speak';

  return (
    <div className="jarvis-shell">
      <div className="jarvis-layout">
        <aside className="jarvis-sidebar" aria-label="JARVIS system status">
          <div className="brand-lockup" data-testid="text-brand">
            <span className="brand-mark" aria-hidden="true" />
            JARVIS
          </div>
          <div>
            <p className="system-label">System state</p>
            <div className="side-status" data-testid="status-online">
              <span className="status-dot" aria-hidden="true" />
              {statusLabel}
            </div>
          </div>
          <div className="side-footer">
            <strong>LOCAL INSTANCE</strong>
            <br />
            Voice channel // available
            <br />
            Response core // local
          </div>
        </aside>

        <main className="jarvis-main">
          <header className="topbar">
            <p className="eyebrow" data-testid="text-page-context">
              Personal command center
            </p>
            <div className="topbar-actions">
              <button
                className="chat-launcher"
                type="button"
                onClick={() => setIsChatOpen(true)}
                aria-expanded={isChatOpen}
                aria-controls="jarvis-chat-drawer"
                data-testid="button-open-chat"
              >
                <MessageCircle size={14} aria-hidden="true" />
                Chat
              </button>
              <span className="topbar-time">SESSION 01 / SECURE</span>
            </div>
          </header>

          <section className="hero" aria-labelledby="hero-title">
            <div className="hero-copy">
              <p className="eyebrow">Good to have you back</p>
              <h1 id="hero-title">
                What can I do
                <br />
                <span>for you?</span>
              </h1>
              <p>
                Tap the orb and speak naturally. JARVIS will listen, think, and respond.
              </p>
            </div>

            <div className="orb-stage">
              <div className="mic-wrap">
                <button
                  className={`mic-button${isListening ? ' is-listening' : ''}${isThinking ? ' is-thinking' : ''}${isSpeaking ? ' is-speaking' : ''}`}
                  type="button"
                  onClick={toggleMicrophone}
                  aria-label={
                    isListening
                      ? 'Stop listening'
                      : isThinking
                        ? 'JARVIS is thinking'
                        : isSpeaking
                          ? 'Stop speaking and listen'
                          : 'Activate microphone'
                  }
                  aria-pressed={isListening}
                  data-testid="button-microphone"
                >
                  <Mic size={34} strokeWidth={1.35} />
                </button>
                <span className="mic-caption" data-testid="status-microphone">
                  {orbCaption}
                </span>
              </div>
            </div>
          </section>

          <section className="conversation" aria-labelledby="conversation-title">
            <div className="section-heading">
              <h2 id="conversation-title">
                <Radio size={12} style={{ verticalAlign: 'middle', marginRight: 7 }} />
                Live channel
              </h2>
              <span data-testid="text-message-count">{messages.length} transmissions</span>
            </div>
            <ConversationFeed
              messages={messages.slice(-3)}
              isThinking={isThinking}
              compact
            />
          </section>
        </main>
      </div>
      <button
        className={`chat-backdrop${isChatOpen ? ' is-open' : ''}`}
        type="button"
        onClick={() => setIsChatOpen(false)}
        aria-label="Close chat panel"
        tabIndex={isChatOpen ? 0 : -1}
      />
      <aside
        id="jarvis-chat-drawer"
        className={`chat-drawer${isChatOpen ? ' is-open' : ''}`}
        aria-hidden={!isChatOpen}
        aria-label="JARVIS chat panel"
      >
        <div className="chat-drawer-header">
          <div>
            <p className="eyebrow">Optional channel</p>
            <h2>Chat with JARVIS</h2>
          </div>
          <button
            className="chat-close"
            type="button"
            onClick={() => setIsChatOpen(false)}
            aria-label="Close chat"
            data-testid="button-close-chat"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="chat-drawer-body">
          <ConversationFeed messages={messages} isThinking={isThinking} />
          <form className="composer chat-composer" onSubmit={sendChatCommand}>
            <Command size={17} color="#6e8790" aria-hidden="true" />
            <input
              type="text"
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              placeholder="Enter a command..."
              aria-label="Chat command input"
              data-testid="input-chat-command"
            />
            <button
              className="send-button"
              type="submit"
              disabled={!command.trim() || isThinking}
              data-testid="button-chat-send"
            >
              Send
              <ArrowUp size={15} strokeWidth={2.4} />
            </button>
          </form>
          <div className="composer-hint">
            <span>Shared local skill channel</span>
            <span>
              <Activity size={10} style={{ verticalAlign: 'middle', marginRight: 5 }} />
              {statusLabel}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;