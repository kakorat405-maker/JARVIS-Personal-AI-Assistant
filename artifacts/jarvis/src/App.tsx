import { type FormEvent, type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Activity, ArrowUp, Command, Mic, Radio } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

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

function getLocalResponse(command: string) {
  const normalized = command.toLowerCase();

  if (normalized.includes('time')) {
    return 'Local time module is standing by. A real-time skill can plug in here next.';
  }
  if (normalized.includes('remind') || normalized.includes('task')) {
    return 'Task interface acknowledged. Reminder skills are ready to be connected.';
  }
  if (normalized.includes('calendar') || normalized.includes('schedule')) {
    return 'Calendar channel acknowledged. No external connections are active yet.';
  }
  return `Command received: “${command}”. I am ready for a connected response layer.`;
}

function Home() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [command, setCommand] = useState('');
  const [isListening, setIsListening] = useState(false);

  const sendCommand = (event?: FormEvent) => {
    event?.preventDefault();
    const trimmedCommand = command.trim();
    if (!trimmedCommand) return;

    const commandId = Date.now();
    setMessages((current) => [
      ...current,
      { id: commandId, role: 'user', text: trimmedCommand },
      { id: commandId + 1, role: 'jarvis', text: getLocalResponse(trimmedCommand) },
    ]);
    setCommand('');
  };

  const toggleMicrophone = () => {
    setIsListening(true);
    window.setTimeout(() => setIsListening(false), 1600);
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