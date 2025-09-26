import React, { useState } from 'react';
import { PriceCalculator } from './PriceCalculator';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface TradeWidgetProps {
  onLoginRequest: () => void;
}

export const TradeWidget: React.FC<TradeWidgetProps> = ({ onLoginRequest }) => {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleProceed = (path: string, state: any) => {
    if (!user) {
      onLoginRequest();
      return;
    }
    navigate(path, { state });
  };

  const handleProceedToBuy = (amount: number, usdtAmount: number, rate: number) => {
    handleProceed('/buy', { amount, usdtAmount, rate });
  };

  const handleProceedToSell = (amount: number, usdtAmount: number, rate: number) => {
    handleProceed('/sell', { amount, usdtAmount, rate });
  };

  return (
    <div className="bg-dark-card rounded-lg p-6 w-full max-w-lg mx-auto">
      <div className="flex justify-center mb-6">
        <div className="bg-dark-secondary p-1 rounded-lg flex space-x-1">
          <button
            onClick={() => setTradeType('buy')}
            className={`px-8 py-2 rounded-md font-medium transition-colors ${
              tradeType === 'buy' ? 'bg-brand-orange text-white' : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setTradeType('sell')}
            className={`px-8 py-2 rounded-md font-medium transition-colors ${
              tradeType === 'sell' ? 'bg-brand-orange text-white' : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            Sell
          </button>
        </div>
      </div>
      <PriceCalculator
        key={tradeType} 
        type={tradeType}
        onProceed={tradeType === 'buy' ? handleProceedToBuy : handleProceedToSell}
      />
    </div>
  );
};
