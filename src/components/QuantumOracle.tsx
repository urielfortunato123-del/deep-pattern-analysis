import { useState, useRef, useEffect } from "react";
import { Atom, Send, Sparkles, Loader2, Zap, Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quantum-oracle`;

const suggestedQuestions = [
  "Quais números NÃO saem há mais tempo?",
  "Gere 3 jogos anti-padrão para o próximo sorteio",
  "Qual a leitura quântica do próximo ciclo?",
  "Analise os padrões da sequência 32-33",
];

export const QuantumOracle = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const streamChat = async (userMessage: string, type?: string) => {
    const userMsg: Message = { role: "user", content: userMessage };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantContent = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: [...messages, userMsg],
          type: type || "chat"
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || "Falha na conexão com o oráculo");
      }

      if (!resp.body) throw new Error("Sem resposta do oráculo");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Add assistant message placeholder
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantContent,
                };
                return newMessages;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Quantum oracle error:", error);
      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: `⚠️ ${error instanceof Error ? error.message : "Erro ao consultar o oráculo quântico"}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput("");
    streamChat(message);
  };

  const handleSuggestion = (question: string) => {
    const type = question.includes("Gere") ? "generate" : "analyze";
    streamChat(question, type);
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/30 flex items-center gap-3 gradient-cosmic">
        <div className="w-10 h-10 rounded-full bg-cosmic-purple/30 flex items-center justify-center">
          <Atom className="w-5 h-5 text-cosmic-purple animate-spin" style={{ animationDuration: "8s" }} />
        </div>
        <div>
          <h3 className="font-display text-xl font-semibold text-foreground">Oráculo Quântico</h3>
          <p className="text-sm text-muted-foreground">Inteligência estatística × simbólica</p>
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Sparkles className="w-12 h-12 text-cosmic-purple/50 mb-4" />
            <p className="text-muted-foreground mb-6">
              Pergunte sobre padrões, gere jogos anti-padrão, ou explore a leitura quântica
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestion(q)}
                  className="px-3 py-2 text-sm rounded-lg bg-muted/30 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-cosmic-purple/20 flex items-center justify-center flex-shrink-0">
                  <Atom className="w-4 h-4 text-cosmic-purple" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-gold/20 text-foreground border border-gold/30"
                    : "bg-muted/30 text-foreground border border-border/30"
                )}
              >
                {msg.content || (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando campo quântico...
                  </span>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-gold" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border/30">
        <div className="flex gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Consulte o oráculo quântico..."
            className="min-h-[44px] max-h-32 resize-none bg-muted/20 border-border/30 focus:border-cosmic-purple/50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="h-11 w-11 p-0 bg-cosmic-purple hover:bg-cosmic-purple/80"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
