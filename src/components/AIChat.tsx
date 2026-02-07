import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useAIChat, ChatMessage } from "@/hooks/useAIChat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Loader2, 
  Bot, 
  User, 
  ImagePlus, 
  X, 
  Trash2,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const SYSTEM_PROMPT = `Você é o Oráculo Quântico, um assistente especializado em:
- Análise estatística de loterias brasileiras (Mega-Sena, Lotofácil, Quina, etc.)
- Numerologia cabalística e significados dos números
- Padrões e tendências em sorteios
- Estratégias de jogo baseadas em dados

Responda sempre em português brasileiro, de forma clara e envolvente.
Use emojis quando apropriado para tornar a conversa mais dinâmica.
Quando analisar números, forneça insights sobre:
- Frequência histórica
- Padrões de paridade (pares/ímpares)
- Distribuição por dezenas
- Significado numerológico`;

export const AIChat = () => {
  const { messages, isLoading, error, sendMessage, clearMessages } = useAIChat({
    systemPrompt: SYSTEM_PROMPT,
    model: "openai/gpt-4o-mini",
  });
  
  const [input, setInput] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !imageUrl) return;
    if (isLoading) return;

    const message = input.trim() || "Analise esta imagem";
    setInput("");
    setImageUrl(null);
    setImagePreview(null);
    
    await sendMessage(message, imageUrl || undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    setImagePreview(url);
  };

  const removeImage = () => {
    setImageUrl(null);
    setImagePreview(null);
  };

  const getMessageText = (content: ChatMessage["content"]): string => {
    if (typeof content === "string") return content;
    const textPart = content.find(c => c.type === "text");
    return textPart ? (textPart as { type: "text"; text: string }).text : "";
  };

  const getMessageImage = (content: ChatMessage["content"]): string | null => {
    if (typeof content === "string") return null;
    const imagePart = content.find(c => c.type === "image_url");
    return imagePart ? (imagePart as { type: "image_url"; image_url: { url: string } }).image_url.url : null;
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-border/30 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Oráculo Quântico IA</h3>
            <p className="text-xs text-muted-foreground">GPT-4o-mini via OpenRouter</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-full bg-cosmic-purple/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-cosmic-purple" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">Olá! Sou o Oráculo Quântico</h4>
            <p className="text-sm text-muted-foreground max-w-sm">
              Posso analisar números, revelar padrões estatísticos e interpretar 
              significados numerológicos. Como posso ajudar?
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {[
                "Analise os números 7, 14, 21, 35, 42, 56",
                "Qual o significado do número 22?",
                "Quais dezenas saem mais na Mega-Sena?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-xs px-3 py-2 rounded-full bg-muted/30 border border-border/30 
                           text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "flex-row-reverse" : ""
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    message.role === "user"
                      ? "bg-gold/20"
                      : "bg-cosmic-purple/20"
                  )}
                >
                  {message.role === "user" ? (
                    <User className="w-4 h-4 text-gold" />
                  ) : (
                    <Bot className="w-4 h-4 text-cosmic-purple" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] rounded-xl p-3",
                    message.role === "user"
                      ? "bg-gold/10 border border-gold/20"
                      : "bg-muted/30 border border-border/30"
                  )}
                >
                  {/* Image if present */}
                  {getMessageImage(message.content) && (
                    <img
                      src={getMessageImage(message.content)!}
                      alt="Imagem anexada"
                      className="max-w-full max-h-48 rounded-lg mb-2"
                    />
                  )}
                  {/* Text content */}
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>
                        {getMessageText(message.content) || (isLoading ? "..." : "")}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {getMessageText(message.content)}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-cosmic-purple/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-cosmic-purple" />
                </div>
                <div className="bg-muted/30 border border-border/30 rounded-xl p-3">
                  <Loader2 className="w-4 h-4 animate-spin text-cosmic-purple" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-4 py-2 border-t border-border/30 bg-muted/10">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-20 rounded-lg border border-border/30"
              onError={() => setImagePreview(null)}
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive 
                       flex items-center justify-center hover:bg-destructive/80"
            >
              <X className="w-3 h-3 text-destructive-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border/30 bg-muted/10">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              className="min-h-[44px] max-h-[120px] resize-none pr-12 bg-background/50"
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => {
                const url = prompt("Cole a URL da imagem:");
                if (url) handleImageUrlChange(url);
              }}
            >
              <ImagePlus className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
          <Button
            type="submit"
            disabled={isLoading || (!input.trim() && !imageUrl)}
            className="h-[44px] px-4 gradient-gold text-primary-foreground"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
