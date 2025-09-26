import { useState, useEffect } from 'react';

interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export const useCryptoRates = () => {
  const [rates, setRates] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=tether,bitcoin,ethereum,binancecoin,solana&vs_currencies=inr&include_24hr_change=true'
        );
        
        if (!response.ok) throw new Error('Failed to fetch rates');
        
        const data = await response.json();
        
        const formattedRates: CryptoPrice[] = [
          {
            id: 'tether',
            symbol: 'USDT',
            name: 'Tether',
            current_price: data.tether?.inr || 84.5,
            price_change_percentage_24h: data.tether?.inr_24h_change || 0
          },
          {
            id: 'bitcoin',
            symbol: 'BTC',
            name: 'Bitcoin',
            current_price: data.bitcoin?.inr || 3500000,
            price_change_percentage_24h: data.bitcoin?.inr_24h_change || 0
          },
          {
            id: 'ethereum',
            symbol: 'ETH',
            name: 'Ethereum',
            current_price: data.ethereum?.inr || 280000,
            price_change_percentage_24h: data.ethereum?.inr_24h_change || 0
          },
          {
            id: 'binancecoin',
            symbol: 'BNB',
            name: 'BNB',
            current_price: data.binancecoin?.inr || 50000,
            price_change_percentage_24h: data.binancecoin?.inr_24h_change || 0
          },
          {
            id: 'solana',
            symbol: 'SOL',
            name: 'Solana',
            current_price: data.solana?.inr || 12000,
            price_change_percentage_24h: data.solana?.inr_24h_change || 0
          }
        ];
        
        setRates(formattedRates);
        setError(null);
      } catch (err) {
        setError('Failed to fetch crypto rates');
        // Fallback data
        setRates([
          { id: 'tether', symbol: 'USDT', name: 'Tether', current_price: 84.5, price_change_percentage_24h: 0 },
          { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', current_price: 3500000, price_change_percentage_24h: 2.5 },
          { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', current_price: 280000, price_change_percentage_24h: 1.8 },
          { id: 'binancecoin', symbol: 'BNB', name: 'BNB', current_price: 50000, price_change_percentage_24h: -0.5 },
          { id: 'solana', symbol: 'SOL', name: 'Solana', current_price: 12000, price_change_percentage_24h: 3.2 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return { rates, loading, error };
};
