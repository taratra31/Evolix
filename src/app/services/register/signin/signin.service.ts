import { Injectable } from '@angular/core';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable({
  providedIn: 'root',
})
export class SigninService {

  constructor(private supabaseService: SupabaseService) {}

  // 🔥 Générer code referral unique
  generateReferralCode(): string {
    return 'EVX' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async register(data: any) {
    const { phone, country_code, password, referral_code } = data;

    // 🔹 Nettoyage numéro
    let cleanPhone = phone.replace(/\s+/g, '');
    cleanPhone = cleanPhone.replace(/^0+/, '');
    const fullPhone = `${country_code}${cleanPhone}`;

    // 🔹 Vérifier si numéro existe déjà
    const { data: existing, error: checkError } =
      await this.supabaseService.supabase
        .from('users')
        .select('id')
        .eq('phone', fullPhone)
        .maybeSingle();

    if (checkError) {
      console.error(checkError);
      throw 'Erreur vérification numéro';
    }

    if (existing) {
      throw 'Ce numéro est déjà utilisé.';
    }

    // 🔹 Vérifier code parrain
    let referredBy: string | null = null;

    if (referral_code && referral_code.trim() !== '') {
      const code = referral_code.trim();

      const { data: refUser } =
        await this.supabaseService.supabase
          .from('users')
          .select('referral_code')
          .eq('referral_code', code)
          .maybeSingle();

      if (!refUser) {
        throw 'Code parrain invalide.';
      }

      referredBy = code;
    }

    // 🔥 Générer code perso
    const myReferralCode = this.generateReferralCode();

    // 🔹 Insert user
    const { data: user, error } =
      await this.supabaseService.supabase
        .from('users')
        .insert([
          {
            phone: fullPhone,
            country_code,
            password,

            // 🔥 IMPORTANT
            referral_code: myReferralCode, // code an'ilay user
            referred_by: referredBy       // iza no nanasa azy
          }
        ])
        .select()
        .single();

    if (error) {
      console.error(error);
      throw 'Erreur lors de l’inscription.';
    }

    return user;
  }
}