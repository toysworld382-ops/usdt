import React, { useState, useEffect } from 'react';
import { ArrowLeft, History, User, LogOut, Plus, LifeBuoy, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  inr_amount: number;
  usdt_amount: number;
  exchange_rate: number;
  created_at: string;
  utr_number?: string;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'processing': return 'text-yellow-400';
      case 'pending': return 'text-blue-400';
      case 'failed': return 'text-red-400';
      case 'cancelled': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-900/50 border-green-500';
      case 'processing': return 'bg-yellow-900/50 border-yellow-500';
      case 'pending': return 'bg-blue-900/50 border-blue-500';
      case 'failed': return 'bg-red-900/50 border-red-500';
      case 'cancelled': return 'bg-gray-900/50 border-gray-500';
      default: return 'bg-gray-900/50 border-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Header */}
      <div className="bg-dark-secondary border-b border-dark-border p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Profile Section */}
        <div className="bg-dark-card rounded-lg p-6 mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-brand-orange to-brand-gold rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{profile?.full_name || 'User'}</h2>
              <p className="text-gray-400">{profile?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-dark-secondary rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-2">Total Transactions</h3>
              <p className="text-2xl font-bold text-brand-orange">{profile?.total_transactions || 0}</p>
            </div>
            <div className="bg-dark-secondary rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-2">Total Volume</h3>
              <p className="text-2xl font-bold text-brand-orange">₹{(profile?.total_volume || 0).toLocaleString()}</p>
            </div>
            <div className="bg-dark-secondary rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-2">Status</h3>
              <p className={`text-lg font-medium ${profile?.is_verified ? 'text-green-400' : 'text-yellow-400'}`}>
                {profile?.is_verified ? 'Verified' : 'Pending'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-brand-orange to-brand-gold hover:opacity-90 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Transaction</span>
          </button>
          <button
            onClick={() => navigate('/support')}
            className="bg-dark-secondary hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 border border-dark-border flex items-center justify-center space-x-2"
          >
            <LifeBuoy className="w-5 h-5" />
            <span>Support Tickets</span>
          </button>
          {profile?.is_admin && (
             <button
                onClick={() => navigate('/admin')}
                className="bg-dark-secondary hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 border border-dark-border flex items-center justify-center space-x-2"
              >
                <User className="w-5 h-5" />
                <span>Admin Panel</span>
              </button>
          )}
        </div>

        {/* Transaction History */}
        <div className="bg-dark-card rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <History className="w-6 h-6 text-brand-orange" />
            <h2 className="text-2xl font-bold text-white">Transaction History</h2>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-dark-secondary rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No Transactions Yet</h3>
              <p className="text-gray-400 mb-6">Start trading to see your transaction history here.</p>
              <button
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-brand-orange to-brand-gold hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Start Trading
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.id} className={`p-4 rounded-lg border ${getStatusBg(tx.status)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        tx.type === 'buy' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                      }`}>
                        {tx.type.toUpperCase()}
                      </span>
                      <span className={`text-sm font-medium ${getStatusColor(tx.status)}`}>
                        {tx.status.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Amount</p>
                      <p className="text-white font-medium">₹{tx.inr_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">USDT</p>
                      <p className="text-brand-gold font-medium">{tx.usdt_amount.toFixed(6)} USDT</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Rate</p>
                      <p className="text-white font-medium">₹{tx.exchange_rate}</p>
                    </div>
                  </div>
                  {tx.utr_number && (
                    <div className="mt-2 text-gray-400 text-sm">UTR: {tx.utr_number}</div>
                  )}
                  <div className="mt-3 border-t border-dark-border pt-3 flex justify-end">
                    <button
                      onClick={() => navigate('/support', { state: { transactionId: tx.id } })}
                      className="flex items-center space-x-2 text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>Report Issue</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
