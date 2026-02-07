import { useState, useCallback } from "react";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

interface TextContent {
  type: "text";
  text: string;
}

interface ImageContent {
  type: "image_url";
  image_url: {
    url: string;
  };
}

type MessageContent = string | (TextContent | ImageContent)[];

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: MessageContent;
  timestamp: Date;
}

interface UseAIChatOptions {
  systemPrompt?: string;
  model?: string;
}

export const useAIChat = (options: UseAIChatOptions = {}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    content: string,
    imageUrl?: string
  ) => {
    setError(null);
    setIsLoading(true);

    // Build message content
    let messageContent: MessageContent;
    if (imageUrl) {
      messageContent = [
        { type: "text", text: content },
        { type: "image_url", image_url: { url: imageUrl } }
      ];
    } else {
      messageContent = content;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Prepare messages for API (convert to simple format for history)
    const apiMessages = [...messages, userMessage].map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          systemPrompt: options.systemPrompt,
          model: options.model,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Sem resposta do servidor");
      }

      // Create assistant message placeholder
      const assistantId = crypto.randomUUID();
      let assistantContent = "";

      setMessages(prev => [...prev, {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      }]);

      // Stream the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process SSE lines
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
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages(prev => prev.map(msg =>
                msg.id === assistantId
                  ? { ...msg, content: assistantContent }
                  : msg
              ));
            }
          } catch {
            // Partial JSON, wait for more data
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

    } catch (err) {
      console.error("Chat error:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      // Remove the empty assistant message on error
      setMessages(prev => prev.filter(msg => msg.role !== "assistant" || msg.content !== ""));
    } finally {
      setIsLoading(false);
    }
  }, [messages, options.systemPrompt, options.model]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
};
