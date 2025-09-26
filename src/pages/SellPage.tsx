import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Copy, CheckCircle } from 'lucide-react';
import { Timer } from '../components/Timer';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface SellState {
  amount: number;
  usdtAmount: number;
  rate: number;
}

export const SellPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [step, setStep] = useState(1);

  // Step 1 State
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [bankDetails, setBankDetails] = useState({ bankName: '', accountNumber: '', ifscCode: '', accountHolderName: '' });
  
  // Step 2 State
  const [cryptoNetwork, setCryptoNetwork] = useState<'erc20' | 'trc20'>('trc20');
  const [walletScreenshot, setWalletScreenshot] = useState<File | null>(null);

  // Transaction State
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [paymentTimer, setPaymentTimer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const state = location.state as SellState;
  const adminWallets = {
    erc20: '0xa3674b3d96bbd967b2557455a1f85459ad391f1e',
    trc20: 'THmtZz3hpiRLrZ1dbb7vBxJj5D5EfVaGov'
  };

  useEffect(() => {
    if (!state) navigate('/');
  }, [state, navigate]);

  if (!state) return null;

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const timerStart = new Date();
      const timerEnd = new Date(timerStart.getTime() + 5 * 60 * 1000);

      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          user_id: profile!.id,
          type: 'sell',
          inr_amount: state.amount,
          usdt_amount: state.usdtAmount,
          exchange_rate: state.rate,
          payment_method_id: paymentMethod, // Simplified
          account_holder_name: paymentMethod === 'bank' ? bankDetails.accountHolderName : upiId,
          bank_name: paymentMethod === 'bank' ? bankDetails.bankName : null,
          account_number: paymentMethod === 'bank' ? bankDetails.accountNumber : null,
          ifsc_code: paymentMethod === 'bank' ? bankDetails.ifscCode : null,
          payment_timer_started_at: timerStart.toISOString(),
          payment_timer_expires_at: timerEnd.toISOString(),
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      
      await supabase.from('tickets').insert({
        user_id: profile!.id,
        transaction_id: transaction.id,
        subject: `Sell Order Created: ${transaction.id}`,
        message: `A new sell order for ${state.usdtAmount} USDT was created. Awaiting crypto deposit.`,
        status: 'open',
      });

      setTransactionId(transaction.id);
      setPaymentTimer(timerEnd.toISOString());
      setStep(2);
      toast.success('Details saved! Please send USDT.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to proceed');
    } finally {
      setLoading(false);
    }
  };

  const handleCryptoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletScreenshot || !transactionId) return;
    setLoading(true);
    try {
      const filePath = `${profile!.id}/${transactionId}-sell-${walletScreenshot.name}`;
      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(filePath, walletScreenshot);
      
      if (uploadError) throw uploadError;

      const { error } = await supabase
        .from('transactions')
        .update({ user_wallet_screenshot_url: filePath, status: 'processing' })
        .eq('id', transactionId);

      if (error) throw error;

      setStep(3);
      toast.success('Transaction submitted! We are processing your sale.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit transaction');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-dark-primary py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="flex items-center space-x-4 mb-8">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/')} className="text-gray-400 hover:text-white transition-colors"><ArrowLeft className="w-6 h-6" /></button>
          <h1 className="text-2xl font-bold text-white">Sell USDT</h1>
        </div>

        <div className="bg-dark-card rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Transaction Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-gray-400">You will send:</span><span className="text-brand-gold font-bold">{state.usdtAmount.toFixed(6)} USDT</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Exchange Rate:</span><span className="text-white font-medium">₹{state.rate.toFixed(2)}/USDT</span></div>
            <div className="flex justify-between"><span className="text-gray-400">You will receive:</span><span className="text-white font-medium">₹{state.amount.toLocaleString()}</span></div>
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={handleDetailsSubmit} className="bg-dark-card rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-bold text-white">Your Payout Details</h2>
            <div className="flex space-x-4"><button type="button" onClick={() => setPaymentMethod('upi')} className={`px-4 py-2 rounded-lg transition-colors flex-1 ${paymentMethod === 'upi' ? 'bg-brand-orange text-white' : 'bg-dark-secondary text-gray-300 hover:bg-gray-700'}`}>UPI</button><button type="button" onClick={() => setPaymentMethod('bank')} className={`px-4 py-2 rounded-lg transition-colors flex-1 ${paymentMethod === 'bank' ? 'bg-brand-orange text-white' : 'bg-dark-secondary text-gray-300 hover:bg-gray-700'}`}>Bank Transfer</button></div>
            {paymentMethod === 'upi' ? (
              <div><label className="block text-sm font-medium text-gray-300 mb-2">UPI ID</label><input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="w-full px-4 py-3 bg-dark-secondary border border-dark-border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange" placeholder="your-upi@paytm" required /></div>
            ) : (
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-300 mb-2">Bank Name</label><input type="text" value={bankDetails.bankName} onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })} className="w-full px-4 py-3 bg-dark-secondary border border-dark-border rounded-lg text-white" required /></div>
                <div><label className="block text-sm font-medium text-gray-300 mb-2">Account Number</label><input type="text" value={bankDetails.accountNumber} onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })} className="w-full px-4 py-3 bg-dark-secondary border border-dark-border rounded-lg text-white" required /></div>
                <div><label className="block text-sm font-medium text-gray-300 mb-2">IFSC Code</label><input type="text" value={bankDetails.ifscCode} onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })} className="w-full px-4 py-3 bg-dark-secondary border border-dark-border rounded-lg text-white" required /></div>
                <div><label className="block text-sm font-medium text-gray-300 mb-2">Account Holder Name</label><input type="text" value={bankDetails.accountHolderName} onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })} className="w-full px-4 py-3 bg-dark-secondary border border-dark-border rounded-lg text-white" required /></div>
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-brand-orange to-brand-gold hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200">{loading ? 'Processing...' : 'Proceed to Deposit'}</button>
          </form>
        )}

        {step === 2 && paymentTimer && (
          <div className="space-y-6">
            <Timer expiresAt={paymentTimer} onExpire={() => { toast.error('Transaction timer expired!'); navigate('/'); }} />
            <form onSubmit={handleCryptoSubmit} className="bg-dark-card rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-bold text-white">Deposit USDT</h2>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Select Network</label>
                <div className="flex space-x-4"><button type="button" onClick={() => setCryptoNetwork('trc20')} className={`px-4 py-2 rounded-lg transition-colors flex-1 ${cryptoNetwork === 'trc20' ? 'bg-brand-orange text-white' : 'bg-dark-secondary text-gray-300 hover:bg-gray-700'}`}>TRC-20 (TRON)</button><button type="button" onClick={() => setCryptoNetwork('erc20')} className={`px-4 py-2 rounded-lg transition-colors flex-1 ${cryptoNetwork === 'erc20' ? 'bg-brand-orange text-white' : 'bg-dark-secondary text-gray-300 hover:bg-gray-700'}`}>ERC-20 (Ethereum)</button></div>
              </div>
              <div className="bg-dark-secondary rounded-lg p-4">
                <div className="flex items-center justify-between mb-2"><span className="text-gray-400">Send to this address:</span><button type="button" onClick={() => copyToClipboard(adminWallets[cryptoNetwork])} className="text-brand-gold hover:text-brand-orange flex items-center space-x-1"><Copy className="w-4 h-4" /><span>Copy</span></button></div>
                <div className="bg-dark-border p-3 rounded font-mono text-white text-sm break-all">{adminWallets[cryptoNetwork]}</div>
                <div className="mt-2 text-center"><span className="text-gray-400">Amount: </span><span className="text-brand-gold font-bold">{state.usdtAmount.toFixed(6)} USDT</span></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Upload Transaction Screenshot</label>
                <input type="file" accept="image/*" onChange={(e) => setWalletScreenshot(e.target.files?.[0] || null)} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-orange file:text-white hover:file:opacity-90" required />
              </div>
              <button type="submit" disabled={loading || !walletScreenshot} className="w-full bg-gradient-to-r from-brand-orange to-brand-gold hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"><Upload className="w-5 h-5" /><span>{loading ? 'Submitting...' : 'Submit Deposit'}</span></button>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="bg-dark-card rounded-lg p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Deposit Submitted!</h2>
            <p className="text-gray-400 mb-6">We have received your submission. We will process your sale and send payment within 5-10 minutes.</p>
            <div className="space-y-2 mb-6 text-left">
              <div className="flex justify-between"><span className="text-gray-400">Transaction ID:</span><span className="text-white font-mono">{transactionId}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">USDT Sent:</span><span className="text-brand-gold font-bold">{state.usdtAmount.toFixed(6)} USDT</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Amount to Receive:</span><span className="text-white font-medium">₹{state.amount.toLocaleString()}</span></div>
            </div>
            <button onClick={() => navigate('/dashboard')} className="bg-gradient-to-r from-brand-orange to-brand-gold hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg">View Transaction History</button>
          </div>
        )}
      </div>
    </div>
  );
};
