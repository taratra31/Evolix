import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  constructor(private supabaseService: SupabaseService) {}

  // 🔥 GET USER ID (STRING UUID)
  getUserId(): string | null {
    const id = localStorage.getItem('userId');

    if (!id) {
      console.error('❌ userId not found in localStorage');
      return null;
    }

    return id; // ✅ tsy Number intsony
  }

  // 🔥 DEPOT
  async createDepot(data: any) {
    const userId = this.getUserId();

    if (!userId) return;

    const { error } = await this.supabaseService.supabase
      .from('transactions')
      .insert([{
        user_id: userId, // ✅ string
        type: 'depot',
        operateur: data.operateur,
        montant: data.montant,
        transaction_id: data.transactionId,
        status: 'pending'
      }]);

    if (error) {
      console.error('❌ DEPOT ERROR:', error);
    }
  }

  // 🔥 RETRAIT
  async createRetrait(data: any) {
    const userId = this.getUserId();

    if (!userId) return;

    const { error } = await this.supabaseService.supabase
      .from('transactions')
      .insert([{
        user_id: userId, // ✅ string
        type: 'retrait',
        operateur: data.operateur,
        montant: data.montant,
        user_phone: data.userPhone,
        status: 'pending'
      }]);

    if (error) {
      console.error('❌ RETRAIT ERROR:', error);
    }
  }

  // 🔥 HISTORIQUE
  async getTransactions(type: 'depot' | 'retrait') {
    const userId = this.getUserId();

    if (!userId) {
      console.error('❌ Cannot fetch transactions: no userId');
      return [];
    }

    const { data, error } = await this.supabaseService.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId) // ✅ string UUID
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ GET TRANSACTIONS ERROR:', error);
      return [];
    }

    return data || [];
  }

  // 🔥 DERNIÈRES TRANSACTIONS
  async getLastTransactions() {
    const userId = this.getUserId();

    if (!userId) return [];

    const { data, error } = await this.supabaseService.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('❌ GET LAST TRANSACTIONS ERROR:', error);
      return [];
    }

    return data || [];
  }
}