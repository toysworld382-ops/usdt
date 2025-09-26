import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit } from 'lucide-react';

type ExchangeRate = {
  id: string;
  quantity_min: number;
  quantity_max: number | null;
  buy_rate: number;
  sell_rate: number;
};

type PaymentMethod = {
  id: string;
  type: 'upi' | 'crypto';
  name: string;
  identifier: string;
  network: 'erc20' | 'trc20' | null;
};

export const AdminSettings: React.FC = () => {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [wallets, setWallets] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [ratesRes, walletsRes] = await Promise.all([
        supabase.from('exchange_rates').select('*').order('quantity_min'),
        supabase.from('payment_methods').select('*').in('type', ['upi', 'crypto'])
      ]);

      if (ratesRes.error) throw ratesRes.error;
      if (walletsRes.error) throw walletsRes.error;

      setRates(ratesRes.data || []);
      setWallets(walletsRes.data || []);
    } catch (error) {
      toast.error('Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleRateUpdate = async (rate: ExchangeRate) => {
    const newBuyRate = prompt('Enter new Buy Rate:', rate.buy_rate.toString());
    const newSellRate = prompt('Enter new Sell Rate:', rate.sell_rate.toString());

    if (newBuyRate && newSellRate) {
      try {
        const { error } = await supabase
          .from('exchange_rates')
          .update({ buy_rate: parseFloat(newBuyRate), sell_rate: parseFloat(newSellRate) })
          .eq('id', rate.id);
        if (error) throw error;
        toast.success('Rate updated!');
        fetchSettings();
      } catch (error) {
        toast.error('Failed to update rate.');
      }
    }
  };

  const handleWalletDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this method?')) {
      try {
        const { error } = await supabase.from('payment_methods').delete().eq('id', id);
        if (error) throw error;
        toast.success('Payment method deleted.');
        fetchSettings();
      } catch (error) {
        toast.error('Failed to delete method.');
      }
    }
  };
  
  // Add new wallet/rate logic would go here, likely in a modal form.

  if (loading) {
    return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Platform Settings</h2>
      
      {/* Exchange Rates */}
      <div className="bg-dark-secondary rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium text-white mb-4">Exchange Rates</h3>
        <div className="space-y-2">
          {rates.map(rate => (
            <div key={rate.id} className="flex items-center justify-between p-2 bg-gray-900 rounded">
              <div>
                <span className="text-white">₹{rate.quantity_min} - {rate.quantity_max || '∞'}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-400">Buy: <span className="text-green-400">₹{rate.buy_rate}</span></span>
                <span className="text-gray-400">Sell: <span className="text-red-400">₹{rate.sell_rate}</span></span>
                <button onClick={() => handleRateUpdate(rate)} className="text-blue-400 hover:text-blue-300"><Edit size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wallets & Addresses */}
      <div className="bg-dark-secondary rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">Wallets & Payment Methods</h3>
        <div className="space-y-2">
          {wallets.map(wallet => (
            <div key={wallet.id} className="flex items-center justify-between p-2 bg-gray-900 rounded">
              <div>
                <span className="text-white font-semibold">{wallet.name}</span>
                <span className="text-xs text-gray-400 ml-2 uppercase">{wallet.type} {wallet.network && `(${wallet.network})`}</span>
                <p className="text-gray-300 font-mono text-sm">{wallet.identifier}</p>
              </div>
              <button onClick={() => handleWalletDelete(wallet.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
        <button className="mt-4 bg-brand-orange hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg transition-opacity flex items-center gap-2" disabled>
          <Plus size={18} /> Add New Method (Coming Soon)
        </button>
      </div>
    </div>
  );
};
