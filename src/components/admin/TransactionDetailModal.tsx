import React from 'react';
import { X, User, DollarSign, Hash, Camera } from 'lucide-react';
import { TransactionAdminView } from './AdminTransactions';
import { supabase } from '../../lib/supabase';

interface ModalProps {
  transaction: TransactionAdminView;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string) => void;
}

export const TransactionDetailModal: React.FC<ModalProps> = ({ transaction, onClose, onStatusUpdate }) => {
  const screenshotUrl = transaction.type === 'buy' ? transaction.payment_screenshot_url : transaction.user_wallet_screenshot_url;
  
  const getPublicUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from('payment-screenshots').getPublicUrl(path);
    return data.publicUrl;
  };

  const publicScreenshotUrl = getPublicUrl(screenshotUrl);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Transaction Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X /></button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column: Details */}
          <div className="space-y-4">
            <DetailItem icon={User} label="User" value={transaction.profiles?.full_name || 'N/A'} />
            <DetailItem label="Email" value={transaction.profiles?.email || 'N/A'} />
            <DetailItem label="Phone" value={transaction.profiles?.phone || 'N/A'} />
            <DetailItem label="City" value={transaction.profiles?.city || 'N/A'} />
            <hr className="border-dark-border" />
            <DetailItem icon={DollarSign} label="INR Amount" value={`₹${transaction.inr_amount.toLocaleString()}`} />
            <DetailItem label="USDT Amount" value={`${transaction.usdt_amount.toFixed(4)} USDT`} />
            <DetailItem icon={Hash} label="UTR Number" value={transaction.utr_number || 'N/A'} />
          </div>

          {/* Right Column: Screenshot */}
          <div>
            <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2"><Camera /> Payment Proof</h3>
            {publicScreenshotUrl ? (
              <a href={publicScreenshotUrl} target="_blank" rel="noopener noreferrer">
                <img src={publicScreenshotUrl} alt="Payment Screenshot" className="rounded-lg border border-dark-border w-full object-contain" />
              </a>
            ) : (
              <div className="bg-dark-secondary rounded-lg h-48 flex items-center justify-center text-gray-400">No screenshot provided</div>
            )}
          </div>
        </div>

        {/* Actions */}
        {(transaction.status === 'pending' || transaction.status === 'processing') && (
          <div className="mt-6 pt-4 border-t border-dark-border flex flex-wrap gap-2">
            <h3 className="text-lg font-medium text-white w-full mb-2">Actions</h3>
            {transaction.status === 'pending' && (
              <button onClick={() => onStatusUpdate(transaction.id, 'processing')} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded">Mark as Processing</button>
            )}
            <button onClick={() => onStatusUpdate(transaction.id, 'completed')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Mark as Completed</button>
            <button onClick={() => onStatusUpdate(transaction.id, 'failed')} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Mark as Failed</button>
            <button onClick={() => onStatusUpdate(transaction.id, 'cancelled')} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">Cancel Transaction</button>
          </div>
        )}
      </div>
    </div>
  );
};

const DetailItem: React.FC<{ icon?: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div>
    <h4 className="text-sm text-gray-400 flex items-center gap-2">{Icon && <Icon size={14} />} {label}</h4>
    <p className="text-white font-medium">{value}</p>
  </div>
);
