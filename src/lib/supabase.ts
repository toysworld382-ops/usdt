import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          city: string | null;
          created_at: string;
          updated_at: string;
          is_admin: boolean;
          is_verified: boolean;
          total_transactions: number;
          total_volume: number;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
          is_admin?: boolean;
          is_verified?: boolean;
          total_transactions?: number;
          total_volume?: number;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
          is_admin?: boolean;
          is_verified?: boolean;
          total_transactions?: number;
          total_volume?: number;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: 'buy' | 'sell';
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
          inr_amount: number;
          usdt_amount: number;
          exchange_rate: number;
          payment_method_id: string | null;
          utr_number: string | null;
          payment_screenshot_url: string | null;
          crypto_network: 'erc20' | 'trc20' | null;
          user_wallet_address: string | null;
          user_wallet_screenshot_url: string | null;
          bank_name: string | null;
          account_number: string | null;
          ifsc_code: string | null;
          account_holder_name: string | null;
          processed_by: string | null;
          admin_notes: string | null;
          payment_timer_started_at: string | null;
          payment_timer_expires_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      exchange_rates: {
        Row: {
          id: string;
          quantity_min: number;
          quantity_max: number | null;
          buy_rate: number;
          sell_rate: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      payment_methods: {
        Row: {
          id: string;
          type: 'upi' | 'bank_transfer' | 'crypto';
          name: string;
          identifier: string;
          qr_code_url: string | null;
          network: 'erc20' | 'trc20' | null;
          is_active: boolean;
          created_at: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          user_id: string;
          transaction_id: string | null;
          subject: string;
          message: string;
          status: 'open' | 'in_progress' | 'closed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_id?: string | null;
          subject: string;
          message: string;
          status?: 'open' | 'in_progress' | 'closed';
        };
        Update: {
          status?: 'open' | 'in_progress' | 'closed';
          updated_at?: string;
        };
      };
    };
  };
};
