'use client';

import { useState, useEffect, useRef } from 'react';
import { useAgora } from './AgoraProvider';
import { validateMessageLength } from '@/lib/validation';

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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.sender === userName ? 'items-end' : 'items-start'}`}
          >
            <div className="text-xs text-gray-500 mb-1">
              <span className="font-semibold">{msg.sender}</span>
              <span className="ml-2">{new Date(msg.timestamp).toLocaleTimeString()}</span>
            </div>
            <div
              className={`rounded-2xl px-4 py-2 max-w-[80%] ${
                msg.sender === userName
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            maxLength={1000}
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="bg-blue-500 text-white rounded-full px-6 py-2 font-semibold disabled:opacity-50 hover:bg-blue-600 transition"
          >
            전송
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1 text-right">{input.length}/1000</p>
      </div>
    </div>
  );
}
