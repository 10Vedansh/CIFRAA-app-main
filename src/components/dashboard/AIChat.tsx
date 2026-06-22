import { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, MessageSquare, Plus, ArrowLeft, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

const SUGGESTIONS = [
  "Which small cap funds gave the highest returns last year?",
  "Compare large cap vs flexi cap funds for long term",
  "Best SIP strategy for a conservative investor",
  "Explain Sharpe Ratio and why it matters",
];

function AuctusIcon({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg bg-white/5 border border-white/10 flex items-center justify-center", className)}>
      <Zap className="h-4 w-4 text-foreground" />
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-3">
      <AuctusIcon className="h-8 w-8 flex-shrink-0" />
      <div className="bg-secondary/60 rounded-2xl px-4 py-3 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
        <span className="text-xs text-muted-foreground ml-2">Auctus is thinking...</span>
      </div>
    </div>
  );
}

interface AIChatProps {
  resetKey?: number;
}

const RESPONSES: Record<string, string> = {
  'which small cap funds gave the highest returns last year': `Based on available data, here are top-performing small cap funds:

1. **Quant Small Cap Fund** - Excellent 1Y returns with strong momentum
2. **Nippon India Small Cap Fund** - Consistent multi-year outperformance
3. **SBI Small Cap Fund** - Large AUM with reliable management

*Small cap funds can be volatile. Ensure you have a 5+ year horizon before investing.*`,
  'compare large cap vs flexi cap funds for long term': `## Large Cap vs Flexi Cap for Long Term

| Aspect | Large Cap | Flexi Cap |
|--------|-----------|-----------|
| **Risk** | Lower (stable blue-chips) | Moderate (flexible allocation) |
| **Returns** | 12-14% CAGR typical | 14-18% CAGR potential |
| **Volatility** | Lower | Moderate |
| **Best for** | Conservative investors | Growth-oriented investors |

**Verdict:** For long-term (7+ years), Flexi Cap funds often outperform due to flexibility across market caps.`,
  'best sip strategy for a conservative investor': `## SIP Strategy for Conservative Investors

1. **Core Portfolio (70%)** - Large Cap & Flexi Cap funds
2. **Stability (20%)** - Corporate Bond or Short Duration funds  
3. **Optional (10%)** - Balanced Hybrid fund

**Recommended monthly allocation:**
- ₹5,000+ in large cap for stability
- ₹3,000+ in flexi cap for growth
- ₹2,000+ in debt for safety

*Start with ₹5,000-10,000/month and increase by 10% annually.*`,
  'explain sharpe ratio and why it matters': `## Sharpe Ratio Explained

The **Sharpe Ratio** measures risk-adjusted returns:

$$\\text{Sharpe} = \\frac{\\text{Return} - \\text{Risk-Free Rate}}{\\text{Standard Deviation}}$$

### What it tells you:
- **> 1.5** : Excellent risk-adjusted returns
- **1.0 - 1.5** : Good
- **0.5 - 1.0** : Average
- **< 0.5** : Poor (returns don't justify risk)

### Why it matters:
A fund with higher returns but extremely high volatility may have a lower Sharpe ratio than a fund with moderate returns and low volatility. **Always compare Sharpe ratios within the same category.**`,
};

function findResponse(input: string): string {
  const lower = input.toLowerCase().trim();
  for (const [key, response] of Object.entries(RESPONSES)) {
    if (lower.includes(key)) return response;
  }
  if (lower.includes('sip')) return RESPONSES['best sip strategy for a conservative investor'];
  if (lower.includes('large cap') || lower.includes('flexi cap')) return RESPONSES['compare large cap vs flexi cap funds for long term'];
  if (lower.includes('sharpe')) return RESPONSES['explain sharpe ratio and why it matters'];
  if (lower.includes('small cap')) return RESPONSES['which small cap funds gave the highest returns last year'];

  const cat = lower.match(/(\w+)\s*fund/);
  const catName = cat ? cat[1].toUpperCase() : '';
  return `Great question about **${input}**!

Based on the data available in our workbook:

- Check the **All Funds** tab to browse funds by category
- Use the **Build Portfolio** feature to get personalized strategies
- Compare funds using the **Sectors** tab

${catName ? `For funds in the ${catName} category, look at metrics like Sharpe ratio (>1 is good), expense ratio (<1% is ideal), and 3Y/5Y CAGR returns.` : ''}

*Tip: For specific fund recommendations, use the Build Portfolio tool with your preferences.*`;
}

export function AIChat({ resetKey = 0 }: AIChatProps) {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = sessionStorage.getItem('cifraa_chat_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((s: any) => ({ ...s, createdAt: new Date(s.createdAt) }));
      }
    } catch {}
    return [];
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resetKey > 0) {
      setActiveSessionId(null);
      setMessages([]);
      setShowHistory(false);
      setInput('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [resetKey]);

  useEffect(() => {
    if (sessions.length > 0) {
      sessionStorage.setItem('cifraa_chat_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    if (activeSessionId && messages.length > 0 && !isLoading) {
      setSessions(prev => prev.map(s =>
        s.id === activeSessionId ? { ...s, messages } : s
      ));
    }
  }, [messages, isLoading, activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const createNewSession = () => {
    const id = crypto.randomUUID();
    setActiveSessionId(id);
    setMessages([]);
    setShowHistory(false);
  };

  const loadSession = (session: ChatSession) => {
    setActiveSessionId(session.id);
    setMessages(session.messages);
    setShowHistory(false);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      setActiveSessionId(sessionId);
      const newSession: ChatSession = {
        id: sessionId,
        title: text.trim().slice(0, 50),
        messages: [],
        createdAt: new Date(),
      };
      setSessions(prev => [newSession, ...prev]);
    }

    const userMsg: Message = { role: 'user', content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    const response = findResponse(text);
    setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (showHistory) {
    return (
      <div className="animate-fade-in flex flex-col min-h-[60vh] px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold text-foreground">Previous Chats</h2>
          </div>
          <Button variant="outline" size="sm" onClick={createNewSession} className="gap-2">
            <Plus className="h-3.5 w-3.5" />
            New Chat
          </Button>
        </div>
        {sessions.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">No previous chats yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => (
              <button
                key={s.id}
                onClick={() => loadSession(s)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all",
                  s.id === activeSessionId
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/40 bg-card/50 hover:bg-primary/5 hover:border-primary/30"
                )}
              >
                <p className="font-medium text-sm text-foreground truncate">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {s.messages.length} messages • {s.createdAt.toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (messages.length === 0 && !activeSessionId) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60dvh] lg:min-h-[60vh] px-4">
        <div className="w-full max-w-2xl flex justify-end mb-4">
          {sessions.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)} className="gap-2">
              <MessageSquare className="h-3.5 w-3.5" />
              Previous Chats ({sessions.length})
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Zap className="h-7 w-7 text-foreground" />
          </div>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-1">
          Auctus
        </h2>
        <p className="text-sm text-muted-foreground font-medium mb-2">Your Financial Intelligence</p>
        <p className="text-muted-foreground text-center mb-8 max-w-md">
          Ask anything about mutual funds — returns, comparisons, strategies, and more.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-8">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Auctus about mutual funds..."
              className="w-full h-14 pl-5 pr-14 rounded-2xl bg-secondary/60 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring/50 text-base"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-left p-4 rounded-xl border border-border/40 bg-card/50 hover:bg-white/5 hover:border-white/20 transition-all text-sm text-muted-foreground hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'animate-fade-in flex flex-col',
        'fixed inset-x-0 top-[56px] bottom-[56px] z-30 px-4 pb-[env(safe-area-inset-bottom)] bg-background',
        'lg:static lg:inset-auto lg:z-auto lg:px-0 lg:pb-0 lg:bg-transparent lg:h-[calc(100vh-200px)] lg:max-h-[700px]'
      )}
    >
      <div className="flex items-center justify-between pt-3 pb-3 border-b border-border/40 mb-3 lg:mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <AuctusIcon className="h-6 w-6" />
          <span className="text-sm font-semibold text-foreground">Auctus</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-sm text-muted-foreground truncate">
            {sessions.find(s => s.id === activeSessionId)?.title || 'New Chat'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {sessions.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)} className="gap-1.5 text-xs">
              <MessageSquare className="h-3.5 w-3.5" />
              History
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={createNewSession} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1 lg:pr-2 min-h-0">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'flex gap-3',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {msg.role === 'assistant' && (
              <AuctusIcon className="h-8 w-8 flex-shrink-0 mt-1" />
            )}
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
                msg.role === 'user'
                  ? 'bg-white text-black'
                  : 'bg-secondary/60 text-foreground'
              )}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
            {msg.role === 'user' && (
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        {isLoading && <ThinkingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border/40 pt-3 lg:pt-4 pb-2">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Auctus a follow-up..."
            disabled={isLoading}
            className="w-full h-12 pl-4 pr-14 rounded-xl bg-secondary/50 border border-border/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
