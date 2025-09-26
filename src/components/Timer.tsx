import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

export const Timer: React.FC<TimerProps> = ({ expiresAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;
      
      if (difference > 0) {
        setTimeLeft(Math.floor(difference / 1000));
      } else {
        setTimeLeft(0);
        onExpire?.();
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isExpired = timeLeft <= 0;
  const isUrgent = timeLeft <= 60; // Last minute

  return (
    <div className={`flex items-center justify-center space-x-2 p-4 rounded-lg ${
      isExpired 
        ? 'bg-red-900/50 border border-red-500' 
        : isUrgent 
        ? 'bg-orange-900/50 border border-orange-500' 
        : 'bg-gray-800 border border-gray-600'
    }`}>
      <Clock className={`w-5 h-5 ${
        isExpired 
          ? 'text-red-400' 
          : isUrgent 
          ? 'text-orange-400' 
          : 'text-blue-400'
      }`} />
      <span className={`text-lg font-mono font-bold ${
        isExpired 
          ? 'text-red-400' 
          : isUrgent 
          ? 'text-orange-400' 
          : 'text-white'
      }`}>
        {isExpired ? 'EXPIRED' : formatTime(timeLeft)}
      </span>
      <span className="text-gray-400 text-sm">
        {isExpired ? 'Time up!' : 'remaining'}
      </span>
    </div>
  );
};
