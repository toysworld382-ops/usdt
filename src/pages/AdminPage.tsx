import React, { useState } from 'react';
import { ArrowLeft, LayoutDashboard, Users, DollarSign, Settings, LifeBuoy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { AdminTransactions } from '../components/admin/AdminTransactions';
import { AdminUsers } from '../components/admin/AdminUsers';
import { AdminTickets } from '../components/admin/AdminTickets';
import { AdminSettings } from '../components/admin/AdminSettings';

type AdminTab = 'dashboard' | 'transactions' | 'users' | 'tickets' | 'settings';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  if (!profile?.is_admin) {
    navigate('/dashboard');
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'transactions':
        return <AdminTransactions />;
      case 'users':
        return <AdminUsers />;
      case 'tickets':
        return <AdminTickets />;
      case 'settings':
        return <AdminSettings />;
      default:
        return null;
    }
  };

  const tabs: { id: AdminTab; name: string; icon: React.ElementType }[] = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', name: 'Transactions', icon: DollarSign },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'tickets', name: 'Tickets', icon: LifeBuoy },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-dark-primary">
      <div className="bg-dark-secondary border-b border-dark-border p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-dark-card rounded-lg p-2">
          <div className="flex space-x-1 mb-6 border-b border-dark-border">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors rounded-t-lg ${
                  activeTab === tab.id
                    ? 'text-brand-orange border-b-2 border-brand-orange bg-dark-secondary'
                    : 'text-gray-400 border-b-2 border-transparent hover:text-white hover:bg-dark-secondary/50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
          <div className="p-4">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
