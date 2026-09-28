import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Activity, ArrowUp, Command, LoaderCircle, Mic, Radio } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { routeCommand } from '@/skills/router';
import { loadNotes, loadTasks, saveNotes, saveTasks } from '@/skills/storage';
import type { JarvisNote, JarvisTask } from '@/skills/types';
import type { JarvisSpeechRecognition as BrowserSpeechRecognition } from '@/types/speech-recognition';

type Message = {
  id: number;
  role: 'user' | 'jarvis';
  text: string;
};

const queryClient = new QueryClient();

const initialMessages: Message[] = [
  {
    id: 1,
    role: 'jarvis',
    text: 'All systems nominal. I am ready for your command.',
  },
];

function Home() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [command, setCommand] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [tasks, setTasks] = useState<JarvisTask[]>(loadTasks);
  const [notes, setNotes] = useState<JarvisNote[]>(loadNotes);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  useEffect(() => saveTasks(tasks), [tasks]);
  useEffect(() => saveNotes(notes), [notes]);

  const addJarvisMessage = (text: string) => {
    setMessages((current) => [
      ...current,
      { id: Date.now() + Math.random(), role: 'jarvis', text },
    ]);
  };

  const processCommand = async (rawCommand: string) => {
    const trimmedCommand = rawCommand.trim();
    if (!trimmedCommand || isThinking) return;

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

    if (result.timer) {
      window.setTimeout(() => {
        addJarvisMessage(`Timer complete${result.timer?.label ? `: ${result.timer.label}` : ''}.`);
      }, result.timer.durationMs);
    }
  };

  const sendCommand = (event?: FormEvent) => {
    event?.preventDefault();
    void processCommand(command);
  };

  const toggleMicrophone = () => {
    if (isThinking) return;

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
      if (transcript) void processCommand(transcript);
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
    recognition.start();
  };

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
              Online / ready
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
            <span className="topbar-time">SESSION 01 / SECURE</span>
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
                Speak when you are ready. Type a command below to open a channel with your
                personal assistant.
              </p>
            </div>

            <div className="orb-stage">
              <div className="mic-wrap">
                <button
                  className={`mic-button${isListening ? ' is-listening' : ''}`}
                  type="button"
                  onClick={toggleMicrophone}
                  aria-label={isListening ? 'Microphone listening' : 'Activate microphone'}
                  aria-pressed={isListening}
                  data-testid="button-microphone"
                >
                  <Mic size={34} strokeWidth={1.35} />
                </button>
                <span className="mic-caption" data-testid="status-microphone">
                  {isListening ? 'Listening for input' : 'Voice channel standby'}
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
            <div className="message-list" aria-live="polite">
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
          </section>

          <form className="composer" onSubmit={sendCommand}>
            <Command size={17} color="#6e8790" aria-hidden="true" />
            <input
              type="text"
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              placeholder="Enter a command..."
              aria-label="Command input"
              data-testid="input-command"
            />
            <button
              className="send-button"
              type="submit"
              disabled={!command.trim()}
              data-testid="button-send"
            >
              Send
              <ArrowUp size={15} strokeWidth={2.4} />
            </button>
          </form>
          <div className="composer-hint">
            <span>Press enter to transmit</span>
            <span>
              <Activity size={10} style={{ verticalAlign: 'middle', marginRight: 5 }} />
              Local response mode
            </span>
          </div>
        </main>
      </div>
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