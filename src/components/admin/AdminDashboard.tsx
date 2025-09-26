import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, DollarSign, MessageSquare, Settings } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalTransactions: number;
  totalVolume: number;
  pendingTransactions: number;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: transactionCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
      const { count: pendingCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).in('status', ['pending', 'processing']);
      const { data: volumeData } = await supabase.from('transactions').select('inr_amount').eq('status', 'completed');
      
      const totalVolume = volumeData?.reduce((sum, tx) => sum + tx.inr_amount, 0) || 0;

      setStats({
        totalUsers: userCount || 0,
        totalTransactions: transactionCount || 0,
        totalVolume,
        pendingTransactions: pendingCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} title="Total Users" value={stats.totalUsers} color="blue" />
        <StatCard icon={DollarSign} title="Total Volume" value={`₹${stats.totalVolume.toLocaleString()}`} color="green" />
        <StatCard icon={MessageSquare} title="Total Transactions" value={stats.totalTransactions} color="orange" />
        <StatCard icon={Settings} title="Pending Actions" value={stats.pendingTransactions} color="red" />
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ElementType; title: string; value: string | number; color: string }> = ({ icon: Icon, title, value, color }) => (
  <div className="bg-dark-secondary rounded-lg p-6">
    <div className="flex items-center space-x-4">
      <div className={`w-12 h-12 bg-${color}-500/20 rounded-lg flex items-center justify-center`}>
        <Icon className={`w-6 h-6 text-${color}-400`} />
      </div>
      <div>
        <h3 className="text-lg font-medium text-white">{title}</h3>
        <p className={`text-2xl font-bold text-${color}-400`}>{value}</p>
      </div>
    </div>
  </div>
);
