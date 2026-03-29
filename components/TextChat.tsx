'use client';

import { useState, useEffect, useRef } from 'react';
import { useAgora } from './AgoraProvider';
import { validateMessageLength } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Send } from 'lucide-react';

interface Message {
  sender: string;
  text: string;
  timestamp: string;
}

interface TextChatProps {
  userName: string;
}

export default function TextChat({ userName }: TextChatProps) {
  const { rtmClient, channelName } = useAgora();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rtmClient) return;

    const handleMessage = (event: any) => {
      if (event.channelName === channelName && event.message) {
        try {
          const parsed: Message = JSON.parse(event.message);
          setMessages((prev) => [...prev, parsed]);
        } catch {
          setMessages((prev) => [
            ...prev,
            { sender: 'Unknown', text: event.message, timestamp: new Date().toISOString() },
          ]);
        }
      }
    };

    rtmClient.addEventListener('message', handleMessage);
    return () => {
      rtmClient.removeEventListener('message', handleMessage);
    };
  }, [rtmClient, channelName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!rtmClient || !input.trim()) return;

    const validation = validateMessageLength(input);
    if (!validation.valid) {
      setError(validation.error || null);
      return;
    }

    setError(null);
    const msg: Message = {
      sender: userName,
      text: input,
      timestamp: new Date().toISOString(),
    };

    await rtmClient.publish(channelName, JSON.stringify(msg));
    setMessages((prev) => [...prev, msg]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isOwn = (sender: string) => sender === userName;

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                'flex flex-col',
                isOwn(msg.sender) ? 'items-end' : 'items-start'
              )}
            >
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">{msg.sender}</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
                  isOwn(msg.sender)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        {error && (
          <p className="mb-2 text-sm text-destructive">{error}</p>
        )}
        <div className="flex gap-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            maxLength={1000}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim()}
          >
            <Send />
          </Button>
        </div>
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {input.length}/1000
        </p>
      </div>
    </div>
  );
}
