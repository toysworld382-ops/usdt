import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Copy, CheckCircle, User, Phone, MapPin, Wallet } from 'lucide-react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { Timer } from '../components/Timer';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface BuyState {
  amount: number;
  usdtAmount: number;
  rate: number;
}

export const BuyPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  
  const [step, setStep] = useState(1);
  
  // Step 1 State
  const [userInfo, setUserInfo] = useState({
    name: profile?.full_name || '',
    phone: profile?.phone || '',
    city: profile?.city || ''
  });
  const [walletInfo, setWalletInfo] = useState({
    network: 'trc20' as 'trc20' | 'erc20',
    address: ''
  });

  // Step 2 State
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  
  // Transaction State
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [paymentTimer, setPaymentTimer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const state = location.state as BuyState;
  const upiId = 'usdtbuyrohan@axl';
  const upiName = 'CryptoSwift';

  useEffect(() => {
    if (!state) {
      navigate('/');
    }
    if (profile) {
        setUserInfo({
            name: profile.full_name || '',
            phone: profile.phone || '',
            city: profile.city || ''
        })
    }
  }, [state, navigate, profile]);

  if (!state) return null;

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Update user profile if changed
      if (userInfo.name !== profile?.full_name || userInfo.phone !== profile?.phone || userInfo.city !== profile?.city) {
        await updateProfile({
          full_name: userInfo.name,
          phone: userInfo.phone,
          city: userInfo.city,
        });
      }

      // 2. Create transaction record
      const timerStart = new Date();
      const timerEnd = new Date(timerStart.getTime() + 5 * 60 * 1000);

      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          user_id: profile!.id,
          type: 'buy',
          inr_amount: state.amount,
          usdt_amount: state.usdtAmount,
          exchange_rate: state.rate,
          user_wallet_address: walletInfo.address,
          crypto_network: walletInfo.network,
          payment_timer_started_at: timerStart.toISOString(),
          payment_timer_expires_at: timerEnd.toISOString(),
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      
      // 3. Create linked support ticket
      await supabase.from('tickets').insert({
        user_id: profile!.id,
        transaction_id: transaction.id,
        subject: `Buy Order Created: ${transaction.id}`,
        message: `A new buy order for ₹${state.amount} was created. Awaiting payment.`,
        status: 'open',
      });

      setTransactionId(transaction.id);
      setPaymentTimer(timerEnd.toISOString());
      setStep(2);
      toast.success('Details saved! Please complete payment.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to proceed');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentScreenshot || !utrNumber || !transactionId) return;

    setLoading(true);

    try {
      const filePath = `${profile!.id}/${transactionId}-${paymentScreenshot.name}`;
      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(filePath, paymentScreenshot);

      if (uploadError) throw uploadError;

      const { error } = await supabase
        .from('transactions')
        .update({
          utr_number: utrNumber,
          payment_screenshot_url: filePath,
          status: 'processing',
        })
        .eq('id', transactionId);

      if (error) throw error;

      setStep(3);
      toast.success('Payment submitted! We are processing your transaction.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit payment');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };
  
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${state.amount.toFixed(2)}&cu=INR`;

  return (
    <div className="min-h-screen bg-dark-primary py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="flex items-center space-x-4 mb-8">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/')} className="text-gray-400 hover:text-white transition-colors"><ArrowLeft className="w-6 h-6" /></button>
          <h1 className="text-2xl font-bold text-white">Buy USDT</h1>
        </div>

        <div className="bg-dark-card rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Transaction Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-gray-400">Amount (INR):</span><span className="text-white font-medium">₹{state.amount.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Exchange Rate:</span><span className="text-white font-medium">₹{state.rate.toFixed(2)}/USDT</span></div>
            <div className="flex justify-between"><span className="text-gray-400">You will receive:</span><span className="text-brand-gold font-bold">{state.usdtAmount.toFixed(6)} USDT</span></div>
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={handleDetailsSubmit} className="bg-dark-card rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-bold text-white">Your Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                  <div className="relative"><User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="text" value={userInfo.name} onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-dark-secondary border border-dark-border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange" required /></div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                  <div className="relative"><Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="tel" value={userInfo.phone} onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-dark-secondary border border-dark-border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange" required /></div>
              </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                <div className="relative"><MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="text" value={userInfo.city} onChange={(e) => setUserInfo({ ...userInfo, city: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-dark-secondary border border-dark-border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange" required /></div>
            </div>
            <h2 className="text-xl font-bold text-white pt-4 border-t border-dark-border">Receiving Wallet</h2>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Network</label>
              <div className="flex space-x-4"><button type="button" onClick={() => setWalletInfo({ ...walletInfo, network: 'trc20' })} className={`px-4 py-2 rounded-lg transition-colors flex-1 ${walletInfo.network === 'trc20' ? 'bg-brand-orange text-white' : 'bg-dark-secondary text-gray-300 hover:bg-gray-700'}`}>TRC-20 (TRON)</button><button type="button" onClick={() => setWalletInfo({ ...walletInfo, network: 'erc20' })} className={`px-4 py-2 rounded-lg transition-colors flex-1 ${walletInfo.network === 'erc20' ? 'bg-brand-orange text-white' : 'bg-dark-secondary text-gray-300 hover:bg-gray-700'}`}>ERC-20 (Ethereum)</button></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Your USDT Address</label>
              <div className="relative"><Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="text" value={walletInfo.address} onChange={(e) => setWalletInfo({ ...walletInfo, address: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-dark-secondary border border-dark-border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange" placeholder="Enter your wallet address" required /></div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-brand-orange to-brand-gold hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200">{loading ? 'Processing...' : 'Proceed to Payment'}</button>
          </form>
        )}

        {step === 2 && paymentTimer && (
          <div className="space-y-6">
            <Timer expiresAt={paymentTimer} onExpire={() => { toast.error('Payment timer expired!'); navigate('/'); }} />
            <form onSubmit={handlePaymentSubmit} className="bg-dark-card rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-bold text-white">Complete Payment</h2>
              <div className="bg-dark-secondary rounded-lg p-4"><h3 className="text-lg font-bold text-white mb-4">UPI Payment Details</h3><div className="flex flex-col md:flex-row gap-6 items-center"><div className="flex-1 space-y-2"><div className="flex items-center justify-between"><span className="text-gray-400">UPI ID:</span><button type="button" onClick={() => copyToClipboard(upiId)} className="text-brand-gold hover:text-brand-orange flex items-center space-x-1"><Copy className="w-4 h-4" /><span>Copy</span></button></div><div className="bg-dark-border p-3 rounded font-mono text-white text-center">{upiId}</div><div><span className="text-gray-400">Amount: </span><span className="text-brand-orange font-bold">₹{state.amount}</span></div></div><div className="flex justify-center"><div className="bg-white p-2 rounded-lg w-44 h-44"><QRCode value={upiUrl} size={160} /></div></div></div></div>
              <div><label className="block text-sm font-medium text-gray-300 mb-2">UTR / Payment Reference</label><input type="text" value={utrNumber} onChange={(e) => setUtrNumber(e.target.value)} className="w-full px-4 py-3 bg-dark-secondary border border-dark-border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange" placeholder="Enter UTR number from your UPI app" required /></div>
              <div><label className="block text-sm font-medium text-gray-300 mb-2">Upload Payment Screenshot</label><input type="file" accept="image/*" onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-orange file:text-white hover:file:opacity-90" required /></div>
              <button type="submit" disabled={loading || !paymentScreenshot || !utrNumber} className="w-full bg-gradient-to-r from-brand-orange to-brand-gold hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"><Upload className="w-5 h-5" /><span>{loading ? 'Submitting...' : 'Submit Payment'}</span></button>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="bg-dark-card rounded-lg p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Payment Submitted!</h2>
            <p className="text-gray-400 mb-6">Your payment has been submitted successfully. We are processing your transaction and will send USDT to your wallet within 5-10 minutes.</p>
            <div className="space-y-2 mb-6 text-left"><div className="flex justify-between"><span className="text-gray-400">Transaction ID:</span><span className="text-white font-mono">{transactionId}</span></div><div className="flex justify-between"><span className="text-gray-400">Amount Paid:</span><span className="text-white font-medium">₹{state.amount.toLocaleString()}</span></div><div className="flex justify-between"><span className="text-gray-400">USDT to Receive:</span><span className="text-brand-gold font-bold">{state.usdtAmount.toFixed(6)} USDT</span></div></div>
            <button onClick={() => navigate('/dashboard')} className="bg-gradient-to-r from-brand-orange to-brand-gold hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200">View Transaction History</button>
          </div>
        )}
      </div>
    </div>
  );
};
