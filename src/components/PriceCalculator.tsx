import React, { useState, useEffect } from 'react';
import { Calculator, ArrowRight, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useActiveTransaction } from '../hooks/useActiveTransaction';
import toast from 'react-hot-toast';

interface ExchangeRate {
  id: string;
  quantity_min: number;
  quantity_max: number | null;
  buy_rate: number;
  sell_rate: number;
}

interface PriceCalculatorProps {
  type: 'buy' | 'sell';
  onProceed: (amount: number, usdtAmount: number, rate: number) => void;
}

export const PriceCalculator: React.FC<PriceCalculatorProps> = ({ type, onProceed }) => {
  const [amount, setAmount] = useState<string>('');
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(false);
  const { hasActiveTransaction, loading: checkingActiveTx } = useActiveTransaction();

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('is_active', true)
        .order('quantity_min');

      if (error) throw error;
      setRates(data || []);
    } catch (error) {
      console.error('Error fetching rates:', error);
    }
  };

  const calculateRate = (inrAmount: number): ExchangeRate | null => {
    return rates.find(rate => {
      if (rate.quantity_max) {
        return inrAmount >= rate.quantity_min && inrAmount <= rate.quantity_max;
      }
      return inrAmount >= rate.quantity_min;
    }) || rates[rates.length - 1] || null;
  };

  const handleCalculate = () => {
    if (hasActiveTransaction) {
      toast.error('Please complete your ongoing transaction first.');
      return;
    }

    const inrAmount = parseFloat(amount);
    if (isNaN(inrAmount) || inrAmount <= 0) return;

    const rateData = calculateRate(inrAmount);
    if (!rateData) return;

    const rate = type === 'buy' ? rateData.buy_rate : rateData.sell_rate;
    const usdtAmount = inrAmount / rate;
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onProceed(inrAmount, usdtAmount, rate);
    }, 500);
  };

  const inrAmount = parseFloat(amount) || 0;
  const rateData = calculateRate(inrAmount);
  const rate = rateData ? (type === 'buy' ? rateData.buy_rate : rateData.sell_rate) : 0;
  const usdtAmount = rate > 0 ? inrAmount / rate : 0;

  return (
    <div className="bg-dark-card rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Calculator className="w-5 h-5 text-brand-orange" />
        <h3 className="text-xl font-bold text-white">
          USDT Price Calculator ({type === 'buy' ? 'Buy' : 'Sell'})
        </h3>
      </div>
      
      <p className="text-gray-400 mb-6">
        Enter INR amount to see how much USDT you will {type === 'buy' ? 'receive' : 'need to send'}.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Enter Amount (INR)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount, e.g., 5000"
            className="w-full px-4 py-3 bg-dark-secondary border border-dark-border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange"
          />
        </div>

        {inrAmount > 0 && (
          <div className="bg-dark-secondary rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Effective Rate:</span>
              <span className="text-white font-medium">₹{rate.toFixed(2)} / USDT</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400">You will {type === 'buy' ? 'receive' : 'send'}:</span>
              <span className="text-brand-gold font-bold text-lg">
                {usdtAmount.toFixed(4)} USDT
              </span>
            </div>
          </div>
        )}
        
        {hasActiveTransaction && (
          <div className="bg-yellow-900/50 border border-yellow-500 text-yellow-300 text-sm p-3 rounded-lg flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>You have an ongoing transaction. Please complete it before starting a new one.</span>
          </div>
        )}

        <button
          onClick={handleCalculate}
          disabled={!amount || parseFloat(amount) <= 0 || loading || !rateData || hasActiveTransaction || checkingActiveTx}
          className="w-full bg-gradient-to-r from-brand-orange to-brand-gold hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {loading || checkingActiveTx ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <span>Proceed</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
