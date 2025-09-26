import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useCryptoRates } from '../hooks/useCryptoRates';

export const CryptoPrices: React.FC = () => {
  const { rates, loading } = useCryptoRates();

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Live Crypto Prices</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-gray-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-4">Live Crypto Prices</h3>
      <div className="space-y-4">
        {rates.map((crypto) => (
          <div key={crypto.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">{crypto.symbol}</span>
              </div>
              <div>
                <div className="text-white font-medium">{crypto.symbol}</div>
                <div className="text-gray-400 text-sm">{crypto.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-medium">
                ₹{crypto.current_price.toLocaleString('en-IN', { 
                  maximumFractionDigits: crypto.current_price < 1000 ? 2 : 0 
                })}
              </div>
              <div className={`flex items-center text-sm ${
                crypto.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {crypto.price_change_percentage_24h >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
