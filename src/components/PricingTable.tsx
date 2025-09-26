import React from 'react';

const pricingData = [
  { quantity: '0-50', price: '86.00' },
  { quantity: '50-100', price: '85.50' },
  { quantity: '100-200', price: '85.00' },
  { quantity: '200-500', price: '84.50' },
  { quantity: '500-1000', price: '84.00' },
  { quantity: '1000+', price: '83.50' },
];

export const PricingTable: React.FC = () => {
  // NOTE: This data is currently static to match the design.
  // For dynamic pricing, this should be fetched from the `exchange_rates` table.
  // The database schema may need adjustment to support USDT quantity ranges.

  return (
    <div className="bg-dark-card rounded-lg p-6 w-full max-w-md mx-auto">
      <h3 className="text-2xl font-bold text-white text-center mb-2">Our Buying Prices</h3>
      <p className="text-gray-400 text-center mb-6">Competitive rates for all transaction volumes.</p>
      
      <div className="rounded-lg overflow-hidden border border-dark-border">
        {/* Header */}
        <div className="grid grid-cols-2 bg-gradient-to-r from-brand-orange/20 to-brand-gold/20 p-4">
          <h4 className="font-bold text-white text-center uppercase tracking-wider">Quantity (USDT)</h4>
          <h4 className="font-bold text-white text-center uppercase tracking-wider">Our Price (INR)</h4>
        </div>

        {/* Rows */}
        <div className="divide-y divide-dark-border">
          {pricingData.map((item, index) => (
            <div key={index} className="grid grid-cols-2 p-4 text-center items-center">
              <p className="text-white font-mono text-lg">{item.quantity}</p>
              <p className="text-brand-gold font-bold text-lg">₹{item.price}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
