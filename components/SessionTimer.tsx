'use client';

import { useState, useEffect, useCallback } from 'react';

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
    <div className={`text-center font-mono text-lg font-bold ${remaining <= 60 ? 'text-red-500' : 'text-gray-700'}`}>
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}
