/*
# CryptoSwift Exchange Database Schema
Complete database setup for USDT exchange platform with buy/sell functionality, admin panel, and ticket system.

## Query Description: 
This migration creates the entire database structure for a cryptocurrency exchange platform. It includes user profiles, transactions, tickets, admin settings, and exchange rates. The operation is safe for new installations and includes comprehensive RLS policies for security.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "High"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- profiles: User profile information linked to auth.users
- transactions: Buy/sell transaction records with payment details
- tickets: Support ticket system
- admin_settings: Platform configuration
- exchange_rates: Dynamic pricing configuration
- payment_methods: Supported payment options

## Security Implications:
- RLS Status: Enabled on all public tables
- Policy Changes: Yes - comprehensive row-level security
- Auth Requirements: All operations require authenticated users

## Performance Impact:
- Indexes: Added on foreign keys and frequently queried columns
- Triggers: Profile creation trigger on auth.users
- Estimated Impact: Minimal performance impact, optimized for read operations
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE transaction_type AS ENUM ('buy', 'sell');
CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE payment_method_type AS ENUM ('upi', 'bank_transfer', 'crypto');
CREATE TYPE crypto_network AS ENUM ('erc20', 'trc20');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  total_transactions INTEGER DEFAULT 0,
  total_volume DECIMAL(20, 8) DEFAULT 0
);

-- Create exchange_rates table
CREATE TABLE exchange_rates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quantity_min DECIMAL(20, 8) NOT NULL,
  quantity_max DECIMAL(20, 8),
  buy_rate DECIMAL(10, 2) NOT NULL,
  sell_rate DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create payment_methods table
CREATE TABLE payment_methods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type payment_method_type NOT NULL,
  name TEXT NOT NULL,
  identifier TEXT NOT NULL, -- UPI ID, bank account, wallet address
  qr_code_url TEXT,
  network crypto_network,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type transaction_type NOT NULL,
  status transaction_status DEFAULT 'pending' NOT NULL,
  inr_amount DECIMAL(15, 2) NOT NULL,
  usdt_amount DECIMAL(20, 8) NOT NULL,
  exchange_rate DECIMAL(10, 2) NOT NULL,
  
  -- Payment details
  payment_method_id UUID REFERENCES payment_methods(id),
  utr_number TEXT,
  payment_screenshot_url TEXT,
  
  -- Crypto details for sell transactions
  crypto_network crypto_network,
  user_wallet_address TEXT,
  user_wallet_screenshot_url TEXT,
  
  -- Bank details for sell transactions
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  account_holder_name TEXT,
  
  -- Admin processing
  processed_by UUID REFERENCES profiles(id),
  admin_notes TEXT,
  
  -- Timing
  payment_timer_started_at TIMESTAMP WITH TIME ZONE,
  payment_timer_expires_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create tickets table
CREATE TABLE tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status ticket_status DEFAULT 'open' NOT NULL,
  priority ticket_priority DEFAULT 'medium' NOT NULL,
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create ticket_messages table
CREATE TABLE ticket_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_admin_message BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create admin_settings table
CREATE TABLE admin_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all transactions" ON transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Tickets policies
CREATE POLICY "Users can view own tickets" ON tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tickets" ON tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets" ON tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Ticket messages policies
CREATE POLICY "Users can view messages of own tickets" ON ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tickets 
      WHERE id = ticket_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages on own tickets" ON ticket_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM tickets 
      WHERE id = ticket_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all ticket messages" ON ticket_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Exchange rates policies (public read, admin write)
CREATE POLICY "Anyone can view active exchange rates" ON exchange_rates
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage exchange rates" ON exchange_rates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Payment methods policies (public read, admin write)
CREATE POLICY "Anyone can view active payment methods" ON payment_methods
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage payment methods" ON payment_methods
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Admin settings policies (admin only)
CREATE POLICY "Admins can manage settings" ON admin_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Create trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();

-- Insert default exchange rates
INSERT INTO exchange_rates (quantity_min, quantity_max, buy_rate, sell_rate) VALUES
(0, 50, 86.00, 84.00),
(50, 100, 85.50, 83.50),
(100, 200, 85.00, 83.00),
(200, 500, 84.50, 82.50),
(500, 1000, 84.00, 82.00),
(1000, NULL, 83.50, 81.50);

-- Insert default payment methods
INSERT INTO payment_methods (type, name, identifier, network) VALUES
('upi', 'UPI Payment', 'usdtbuyrohan@axl', NULL),
('crypto', 'USDT ERC-20', '0xa3674b3d96bbd967b2557455a1f85459ad391f1e', 'erc20'),
('crypto', 'USDT TRC-20', 'THmtZz3hpiRLrZ1dbb7vBxJj5D5EfVaGov', 'trc20');

-- Insert default admin settings
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
('platform_name', 'CryptoSwift', 'Platform display name'),
('min_transaction_amount', '500', 'Minimum transaction amount in INR'),
('max_transaction_amount', '100000', 'Maximum transaction amount in INR'),
('payment_timer_minutes', '5', 'Payment timer duration in minutes'),
('admin_wallet_erc20', '0xa3674b3d96bbd967b2557455a1f85459ad391f1e', 'Admin USDT ERC-20 wallet'),
('admin_wallet_trc20', 'THmtZz3hpiRLrZ1dbb7vBxJj5D5EfVaGov', 'Admin USDT TRC-20 wallet'),
('telegram_support', 'https://t.me/bitgoldy', 'Telegram support link');
