import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, MessageSquare, LifeBuoy, Link as LinkIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Ticket {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'closed';
  created_at: string;
  message: string;
}

export const SupportPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const transactionIdFromState = location.state?.transactionId;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
    if (transactionIdFromState) {
      setSubject(`Issue with Transaction: ${transactionIdFromState}`);
    }
  }, [transactionIdFromState]);

  const fetchTickets = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      toast.error('Failed to load support tickets.');
    } finally {
      setLoading(false);
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('tickets').insert({
        user_id: user.id,
        subject,
        message,
        status: 'open',
        transaction_id: transactionIdFromState || null,
      });

      if (error) throw error;

      toast.success('Support ticket created successfully!');
      setSubject(transactionIdFromState ? `Issue with Transaction: ${transactionIdFromState}` : '');
      setMessage('');
      await fetchTickets();
    } catch (error) {
      toast.error('Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: Ticket['status']) => {
    switch (status) {
      case 'open': return 'text-green-400';
      case 'in_progress': return 'text-yellow-400';
      case 'closed': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };
  
  const getStatusBg = (status: Ticket['status']) => {
    switch (status) {
      case 'open': return 'bg-green-900/50 border-green-500';
      case 'in_progress': return 'bg-yellow-900/50 border-yellow-500';
      case 'closed': return 'bg-gray-900/50 border-gray-500';
      default: return 'bg-gray-900/50 border-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-dark-primary">
      <div className="bg-dark-secondary border-b border-dark-border p-4">
        <div className="container mx-auto flex items-center space-x-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
        {/* Create Ticket Form */}
        <div className="bg-dark-card rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <LifeBuoy className="w-6 h-6 text-brand-orange" />
            <h2 className="text-2xl font-bold text-white">Create a New Ticket</h2>
          </div>
          {transactionIdFromState && (
            <div className="bg-dark-secondary p-3 rounded-lg mb-4 flex items-center space-x-2">
              <LinkIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">
                Related Transaction: <span className="font-mono text-white">{transactionIdFromState.substring(0, 8)}...</span>
              </span>
            </div>
          )}
          <form onSubmit={handleTicketSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-4 py-3 bg-dark-secondary border border-dark-border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange" placeholder="e.g., Issue with transaction #123" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="w-full px-4 py-3 bg-dark-secondary border border-dark-border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange" placeholder="Describe your issue in detail..." required />
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-brand-orange to-brand-gold hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2">
              {submitting ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <><Send className="w-5 h-5" /><span>Submit Ticket</span></>}
            </button>
          </form>
        </div>

        {/* Existing Tickets */}
        <div className="bg-dark-card rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <MessageSquare className="w-6 h-6 text-brand-orange" />
            <h2 className="text-2xl font-bold text-white">Your Tickets</h2>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => <div key={i} className="animate-pulse h-24 bg-dark-secondary rounded-lg"></div>)}
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white">No Tickets Found</h3>
              <p className="text-gray-400">Create a new ticket to get support.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map(ticket => (
                <div key={ticket.id} className={`p-4 rounded-lg border ${getStatusBg(ticket.status)}`}>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white mb-2 flex-1 pr-4">{ticket.subject}</h3>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusBg(ticket.status)} ${getStatusColor(ticket.status)}`}>{ticket.status.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  <p className="text-gray-300 text-sm mb-3 line-clamp-2">{ticket.message}</p>
                  <p className="text-xs text-gray-500">Created: {new Date(ticket.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
