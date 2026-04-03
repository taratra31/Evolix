import { Injectable } from '@angular/core';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable({
  providedIn: 'root',
})
export class LoginService {

  constructor(private supabaseService: SupabaseService) {}

  async login(data: any) {
    const { phone, country_code, password } = data;

    // 🔥 clean phone
    let cleanPhone = phone.replace(/\s+/g, '');
    cleanPhone = cleanPhone.replace(/^0+/, '');

    const fullPhone = `${country_code}${cleanPhone}`;

    console.log('👉 PHONE SENT:', fullPhone);
    console.log('👉 PASSWORD:', password);

    const { data: user, error } = await this.supabaseService.supabase
      .from('users')
      .select('*')
      .eq('phone', fullPhone)
      .eq('password', password)
      .maybeSingle();

    console.log('👉 USER FROM SUPABASE:', user);
    console.log('👉 ERROR:', error);

    if (error) throw error;

    if (!user) {
      throw 'Numéro ou mot de passe incorrect';
    }

    // 🔥 SAVE USER ID
    localStorage.setItem('userId', user.id);

    console.log('👉 USER ID SAVED:', localStorage.getItem('userId'));

    return user;
  }
}