import React, { useState } from 'react';
import { ArrowRight, Shield, Zap, DollarSign, Smartphone, MessageCircle as FaqIcon, Bitcoin } from 'lucide-react';
import { CryptoPrices } from '../components/CryptoPrices';
import { AuthModal } from '../components/AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PricingTable } from '../components/PricingTable';
import { MessageCircle } from 'lucide-react';
import { TradeWidget } from '../components/TradeWidget';

export const HomePage: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showFAQ, setShowFAQ] = useState<number | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLoginRequest = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const faqs = [
    {
      q: "How can I buy USDT?",
      a: "Simply enter the INR amount in the calculator, proceed, and pay via UPI. USDT will be sent to your wallet instantly after verification."
    },
    {
      q: "Is it safe?",
      a: "Yes, we use secure payment channels and trusted non-custodial wallets for every transaction, ensuring your funds are always safe."
    },
    {
      q: "How fast is delivery?",
      a: "Delivery is typically processed within 5–10 minutes after your payment is confirmed by our team."
    },
    {
      q: "What is the minimum amount?",
      a: "You can start buying from as low as ₹500. Check our pricing table for the best rates on different volumes."
    }
  ];

  return (
    <div className="min-h-screen bg-dark-primary text-white">
      <header className="bg-dark-secondary border-b border-dark-border sticky top-0 z-40 backdrop-blur-sm bg-opacity-70">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-gradient-to-r from-brand-orange to-brand-gold rounded-lg flex items-center justify-center">
              <Bitcoin className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">CryptoSwift</h1>
          </div>
          {user ? (
             <div className="flex items-center gap-4">
               <button
                 onClick={() => navigate('/dashboard')}
                 className="text-gray-300 hover:text-white font-medium transition-colors"
               >
                 Dashboard
               </button>
               <button
                 onClick={signOut}
                 className="bg-dark-card hover:bg-dark-border text-white font-medium py-2 px-4 rounded-lg transition-colors"
               >
                 Logout
               </button>
             </div>
           ) : (
            <button
              onClick={() => {
                setAuthMode('login');
                setShowAuthModal(true);
              }}
              className="bg-gradient-to-r from-brand-orange to-brand-gold hover:opacity-90 text-white font-bold py-2 px-6 rounded-lg transition-opacity"
            >
              Login
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Buy & Sell USDT Instantly
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            The easiest way to trade USDT in India. Secure, fast, and reliable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => document.getElementById('trade-widget')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-brand-orange to-brand-gold hover:opacity-90 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 text-lg"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div id="trade-widget" className="mb-12">
          <TradeWidget onLoginRequest={handleLoginRequest} />
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <PricingTable />
          <CryptoPrices />
        </div>

        <div className="bg-dark-secondary rounded-lg p-6 md:p-8 mb-12">
          <h3 className="text-3xl font-bold text-white mb-8 text-center">Why Choose CryptoSwift?</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-brand-orange/20 rounded-full flex items-center justify-center mx-auto mb-4"><Zap className="w-8 h-8 text-brand-orange" /></div>
              <h4 className="text-white font-semibold text-lg mb-2">Instant UPI Payments</h4>
              <p className="text-gray-400 text-sm">Quick and secure UPI transactions.</p>
            </div>
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-brand-orange/20 rounded-full flex items-center justify-center mx-auto mb-4"><Shield className="w-8 h-8 text-brand-orange" /></div>
              <h4 className="text-white font-semibold text-lg mb-2">Secure & Trusted</h4>
              <p className="text-gray-400 text-sm">Bank-level security for all transactions.</p>
            </div>
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-brand-orange/20 rounded-full flex items-center justify-center mx-auto mb-4"><DollarSign className="w-8 h-8 text-brand-orange" /></div>
              <h4 className="text-white font-semibold text-lg mb-2">Best Market Rates</h4>
              <p className="text-gray-400 text-sm">Competitive rates for all volumes.</p>
            </div>
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-brand-orange/20 rounded-full flex items-center justify-center mx-auto mb-4"><Smartphone className="w-8 h-8 text-brand-orange" /></div>
              <h4 className="text-white font-semibold text-lg mb-2">Easy to Use</h4>
              <p className="text-gray-400 text-sm">Works on any device, anywhere.</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-secondary rounded-lg p-6 md:p-8">
          <h3 className="text-3xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h3>
          <div className="space-y-4 max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-dark-border rounded-lg">
                <button
                  onClick={() => setShowFAQ(showFAQ === index ? null : index)}
                  className="w-full p-4 text-left text-white font-medium flex justify-between items-center hover:bg-dark-card transition-colors"
                >
                  <span>{faq.q}</span>
                  <FaqIcon className={`w-5 h-5 transition-transform ${showFAQ === index ? 'rotate-180' : ''}`} />
                </button>
                {showFAQ === index && (
                  <div className="p-4 pt-0 text-gray-300">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-dark-secondary border-t border-dark-border py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>&copy; 2025 CryptoSwift. All rights reserved.</p>
          <p className="text-sm">Best platform to buy USDT in India at competitive rates.</p>
        </div>
      </footer>

      <a
        href="https://wa.me/910000000000"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 z-30"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-8 h-8" />
      </a>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
    </div>
  );
};
