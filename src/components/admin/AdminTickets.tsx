import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface Ticket {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'closed';
  created_at: string;
  transaction_id: string | null;
  message: string;
  profiles: { full_name: string; email: string } | null;
}

export const AdminTickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('tickets').select(`*, profiles (full_name, email)`).order('created_at', { ascending: false });
      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: 'open' | 'in_progress' | 'closed') => {
    try {
      const { error } = await supabase.from('tickets').update({ status }).eq('id', ticketId);
      if (error) throw error;
      await fetchTickets();
      toast.success(`Ticket status updated`);
    } catch (error) {
      toast.error('Failed to update ticket');
    }
  };

  const getStatusColor = (status: string) => ({
    open: 'text-green-400', in_progress: 'text-yellow-400', closed: 'text-gray-400'
  }[status] || 'text-gray-400');

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Manage Support Tickets</h2>
      {loading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div> : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-dark-secondary rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-4">
                  <span className="text-white font-medium">{ticket.profiles?.full_name}</span>
                  <span className="text-gray-400 text-sm">{ticket.profiles?.email}</span>
                </div>
                <span className={`font-medium text-sm ${getStatusColor(ticket.status)}`}>{ticket.status.replace('_', ' ').toUpperCase()}</span>
              </div>
              <p className="font-semibold text-white mb-1">{ticket.subject}</p>
              {ticket.transaction_id && <p className="text-xs text-gray-400 mb-2">Txn ID: <span className="font-mono">{ticket.transaction_id}</span></p>}
              <p className="text-gray-300 text-sm mb-4">{ticket.message}</p>
              <div className="flex space-x-2">
                <button onClick={() => updateTicketStatus(ticket.id, 'open')} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50" disabled={ticket.status === 'open'}>Open</button>
                <button onClick={() => updateTicketStatus(ticket.id, 'in_progress')} className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50" disabled={ticket.status === 'in_progress'}>In Progress</button>
                <button onClick={() => updateTicketStatus(ticket.id, 'closed')} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50" disabled={ticket.status === 'closed'}>Close</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
