'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Timer } from 'lucide-react';

interface SessionTimerProps {
  expiresAt: string;
  onExpire: () => void;
}

export default function SessionTimer({ expiresAt, onExpire }: SessionTimerProps) {
  const calculateRemaining = useCallback(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  }, [expiresAt]);

  const [remaining, setRemaining] = useState(calculateRemaining);

  useEffect(() => {
    const interval = setInterval(() => {
      const newRemaining = calculateRemaining();
      setRemaining(newRemaining);
      if (newRemaining <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [calculateRemaining, onExpire]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <Badge
      variant={remaining <= 60 ? 'destructive' : 'secondary'}
      className={cn('gap-1.5 font-mono tabular-nums')}
    >
      <Timer data-icon="inline-start" />
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </Badge>
  );
}
