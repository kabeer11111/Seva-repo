import { useEffect, useRef } from "react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import { SevaSetuLogo } from "../icons";
import { Button } from "../ui/button";
import { Volume2 } from "lucide-react";

interface ChatMessagesProps {
  messages: Message[];
  isAiTyping: boolean;
  onReplayAudio: (audioUri: string) => void;
}

export default function ChatMessages({
  messages,
  isAiTyping,
  onReplayAudio,
}: ChatMessagesProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isAiTyping]);

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
      <div className="space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-end gap-2",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "ai" && (
              <Avatar className="h-8 w-8 self-start">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <SevaSetuLogo className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex flex-col gap-2">
              <div
                className={cn(
                  "max-w-md rounded-lg p-3 text-sm",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted rounded-bl-none"
                )}
              >
                {message.imageUrl && (
                  <div className="relative w-full aspect-video mb-2">
                    <Image
                      src={message.imageUrl}
                      alt="User uploaded content"
                      fill
                      className="rounded-md object-cover"
                    />
                  </div>
                )}
                {message.text && (
                  <p className="whitespace-pre-wrap">{message.text}</p>
                )}
              </div>
              {message.role === "ai" && message.audioUri && (
                 <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 self-start"
                    onClick={() => onReplayAudio(message.audioUri!)}
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
              )}
            </div>
          </div>
        ))}
        {isAiTyping && (
          <div className="flex items-end gap-2 justify-start">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <SevaSetuLogo className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-lg p-3 text-sm rounded-bl-none">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-foreground/50 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 rounded-full bg-foreground/50 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 rounded-full bg-foreground/50 animate-bounce" />
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
