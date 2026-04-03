import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class EquipeService {

  constructor(private supabaseService: SupabaseService) {}

  async getUser(phone: string) {
    return this.supabaseService.supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();
  }

  async countInvitations(refCode: string) {
    return this.supabaseService.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', refCode);
  }

 async buyVIP(userId: string, amount: number, vipLevel: number) {

  const { error } = await this.supabaseService.supabase.rpc('buy_vip_secure', {
    p_user_id: userId,
    p_amount: amount,
    p_vip_level: vipLevel
  });

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

  async registerUser(phone: string, password: string, refCode?: string) {

    const { data, error } = await this.supabaseService.supabase.rpc('register_user', {
      p_phone: phone,
      p_password: password,
      p_referral_code: refCode || null
    });

    if (error) throw error;

    return data;
  }

   generateReferralLink(code: string): string {
  const baseUrl = 'https://evolix.netlify.app/signin';
  return code ? `${baseUrl}?ref=${code}` : '';
}
}