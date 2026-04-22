import { Injectable } from '@angular/core';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable({
  providedIn: 'root',
})
export class SigninService {

  constructor(private supabaseService: SupabaseService) {}

  generateReferralCode(): string {
    return 'EVX' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async register(data: any) {
    const { phone, country_code, password, referral_code } = data;

    let cleanPhone = phone.replace(/\s+/g, '');
    cleanPhone = cleanPhone.replace(/^0+/, '');
    const fullPhone = `${country_code}${cleanPhone}`;

    const { data: existing, error: checkError } =
      await this.supabaseService.supabase
        .from('users')
        .select('id')
        .eq('phone', fullPhone)
        .maybeSingle();

    if (checkError) {
      throw 'Erreur vérification numéro';
    }

    if (existing) {
      throw 'Ce numéro est déjà utilisé.';
    }

    let referredBy: string | null = null;

    if (referral_code && referral_code.trim() !== '') {
      const code = referral_code.trim();

      const { data: refUser } =
        await this.supabaseService.supabase
          .from('users')
          .select('referral_code, id')
          .eq('referral_code', code)
          .maybeSingle();

      if (!refUser) {
        throw 'Code parrain invalide.';
      }

      referredBy = code;
    }

    const myReferralCode = this.generateReferralCode();
    
    const initialVIP = 0;
    const initialSolde = 0;

    const { data: user, error } =
      await this.supabaseService.supabase
        .from('users')
        .insert([
          {
            phone: fullPhone,
            country_code,
            password,
            referral_code: myReferralCode,
            referred_by: referredBy,
            vip_level: initialVIP,
            solde: initialSolde,
            total_commission: 0,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

    if (error) {
      throw 'Erreur lors de l’inscription.';
    }

    localStorage.setItem('userId', user.id);
    localStorage.setItem('userPhone', user.phone);
    localStorage.setItem('userVIP', String(user.vip_level ?? 0));
    localStorage.setItem('userSolde', String(user.solde ?? 0));
    localStorage.setItem('userIsAdmin', String(user.is_admin ?? false));
    localStorage.setItem('userReferralCode', user.referral_code || '');
    localStorage.setItem('rememberMe', 'true');

    if (referredBy) {
      try {
        const { data: parrainData } = await this.supabaseService.supabase
          .from('users')
          .select('solde, total_commission')
          .eq('referral_code', referredBy)
          .single();

        if (parrainData) {
          const bonusAmount = 100;
          const newParrainSolde = (parrainData.solde ?? 0) + bonusAmount;
          const newTotalCommission = (parrainData.total_commission ?? 0) + bonusAmount;
          
          await this.supabaseService.supabase
            .from('users')
            .update({ 
              solde: newParrainSolde,
              total_commission: newTotalCommission
            })
            .eq('referral_code', referredBy);
        }
      } catch (err) {
        // Silent error
      }
    }

    return user;
  }
}