import { Injectable } from '@angular/core';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable({
  providedIn: 'root',
})
export class LoginService {

  constructor(private supabaseService: SupabaseService) {}

  async login(data: any) {
    const { phone, country_code, password } = data;

    let cleanPhone = phone.replace(/\s+/g, '');
    cleanPhone = cleanPhone.replace(/^0+/, '');
    const fullPhone = `${country_code}${cleanPhone}`;

    const { data: user, error } = await this.supabaseService.supabase
      .from('users')
      .select('*')
      .eq('phone', fullPhone)
      .eq('password', password)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      throw 'Numéro ou mot de passe incorrect';
    }

    localStorage.setItem('userId', user.id);
    localStorage.setItem('userPhone', user.phone);
    localStorage.setItem('userVIP', String(user.vip_level ?? 0));
    localStorage.setItem('userSolde', String(user.solde ?? 0));
    localStorage.setItem('userIsAdmin', String(user.is_admin ?? false));
    localStorage.setItem('userReferralCode', user.referral_code || '');
    localStorage.setItem('rememberMe', 'true');

    return user;
  }
}