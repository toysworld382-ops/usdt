import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { TransactionDetailModal } from './TransactionDetailModal';

export interface TransactionAdminView {
  id: string;
  type: 'buy' | 'sell';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  inr_amount: number;
  usdt_amount: number;
  created_at: string;
  utr_number?: string | null;
  payment_screenshot_url?: string | null;
  user_wallet_screenshot_url?: string | null;
  profiles: { 
    id: string;
    full_name: string; 
    email: string;
    phone: string | null;
    city: string | null;
  } | null;
}

export const AdminTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionAdminView[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedTx, setSelectedTx] = useState<TransactionAdminView | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase.from('transactions').select(`*, profiles (*)`).order('created_at', { ascending: false }).limit(50);
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      const { data, error } = await query;
      if (error) throw error;
      setTransactions(data as TransactionAdminView[] || []);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const updateTransactionStatus = async (transactionId: string, status: string) => {
    try {
      const { error } = await supabase.from('transactions').update({ status, processed_by: 'admin' }).eq('id', transactionId);
      if (error) throw error;
      await fetchTransactions();
      toast.success(`Transaction updated to ${status}`);
      setSelectedTx(null);
    } catch (error) {
      toast.error('Failed to update transaction');
    }
  };

  const getStatusColor = (status: string) => ({
    completed: 'text-green-400', processing: 'text-yellow-400', pending: 'text-blue-400',
    failed: 'text-red-400', cancelled: 'text-gray-400'
  }[status] || 'text-gray-400');

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Manage Transactions</h2>
      <div className="mb-4">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-dark-secondary border border-dark-border rounded-lg px-4 py-2 text-white">
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      {loading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div> : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="bg-dark-secondary rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${tx.type === 'buy' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>{tx.type.toUpperCase()}</span>
                  <span className="text-white font-medium">{tx.profiles?.full_name || 'Unknown'}</span>
                </div>
                <span className="text-gray-400 text-sm">{new Date(tx.created_at).toLocaleDateString()}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div><p className="text-gray-400 text-sm">Amount</p><p className="text-white font-medium">₹{tx.inr_amount.toLocaleString()}</p></div>
                <div><p className="text-gray-400 text-sm">USDT</p><p className="text-brand-gold font-medium">{tx.usdt_amount.toFixed(4)}</p></div>
                <div><p className="text-gray-400 text-sm">Status</p><p className={`font-medium ${getStatusColor(tx.status)}`}>{tx.status.toUpperCase()}</p></div>
                <div className="flex items-end">
                  <button onClick={() => setSelectedTx(tx)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">View Details</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedTx && (
        <TransactionDetailModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
          onStatusUpdate={updateTransactionStatus}
        />
      )}
    </div>
  );
};
